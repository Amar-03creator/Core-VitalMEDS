// server/masterMigration.js
require('dotenv').config();
const mongoose = require('mongoose');

const Client = require('./src/models/Client');
const SalesInvoice = require('./src/models/SalesInvoice');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function runMasterMigration() {
  if (!MONGO_URI) {
    console.error('❌ ERROR: MONGO_URI not found in .env');
    process.exit(1);
  }

  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    // ==========================================
    // PHASE 1: BACKFILL CLIENT LINES
    // ==========================================
    console.log('\n--- PHASE 1: Backfilling Client Lines ---');
    
    const clientsNeedingLine = await Client.find({
      $or: [{ line: { $exists: false } }, { line: null }, { line: '' }]
    });

    let clientsUpdated = 0;

    for (const client of clientsNeedingLine) {
      const cityRaw = (client.city || '').trim();
      if (!cityRaw) continue;

      const cityTitleCase = cityRaw.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
      const derivedLine = `${cityTitleCase} Line`;

      client.line = derivedLine;
      await client.save();
      clientsUpdated++;
      console.log(`✔️ Updated Client: ${client.establishmentName} -> "${derivedLine}"`);
    }
    console.log(`Phase 1 Complete: ${clientsUpdated} clients updated.`);


    // ==========================================
    // PHASE 2: BACKFILL INVOICE OUTSTANDING DATES
    // ==========================================
    console.log('\n--- PHASE 2: Backfilling Invoice Outstanding Dates ---');
    
    // Find all invoices missing the previousOutstandingDate field
    const invoicesNeedingDate = await SalesInvoice.find({
      previousOutstandingDate: { $exists: false }
    });

    let invoicesUpdated = 0;

    for (const invoice of invoicesNeedingDate) {
      let dateToSet = null;

      // Only search for a past date if they actually had a previous balance
      if (invoice.previousOutstanding && invoice.previousOutstanding > 0) {
        
        const oldestPastInvoice = await SalesInvoice.findOne({
          clientObjectId: invoice.clientObjectId,
          invoiceDate: { $lt: invoice.invoiceDate }
        }).sort({ invoiceDate: 1 });

        if (oldestPastInvoice) {
          dateToSet = oldestPastInvoice.invoiceDate;
        }
      }

      // ★ FIXED: Use updateOne to safely inject the field without triggering 
      // strict validation on older missing fields like 'totalGrossAmount'.
      await SalesInvoice.updateOne(
        { _id: invoice._id },
        { $set: { previousOutstandingDate: dateToSet } }
      );

      invoicesUpdated++;
      
      const dateString = dateToSet ? dateToSet.toISOString().split('T')[0] : 'null';
      console.log(`✔️ Updated Invoice: ${invoice.invoiceNumber} -> Date: ${dateString}`);
    }
    
    console.log(`Phase 2 Complete: ${invoicesUpdated} invoices updated.`);

    console.log('\n🎉 ALL MIGRATIONS COMPLETE!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  }
}

// Execute the migration
runMasterMigration();