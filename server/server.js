// server/server.js
// Import core libraries
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// ✨ CLOUD ADDITION: The Serverless Wrapper
const serverless = require('serverless-http');

// Database connection
const connectDB = require('./src/config/db');

// Initialize Express
const app = express();

// Connect to the database
connectDB(); 

// TEMPORARY CLEANUP SCRIPT 
mongoose.connection.once('open', async () => {
    try {
        await mongoose.connection.collection('orders').dropIndex('orderNumber_1');
        console.log('✅ Successfully dropped old orderNumber ghost index!');
    } catch (err) {
        // Ignore errors if the index is already dropped
    }
    
    try {
        await mongoose.connection.collection('inquiries').dropIndex('inquiryNumber_1');
        console.log('✅ Successfully dropped old inquiryNumber ghost index!');
    } catch (err) {}
});

// Middleware
app.use(cors()); // Allow requests from your React frontend
app.use(express.json()); // Parse incoming JSON payloads

// ── API ROUTES ────────────────────────────────────────────────────────
// Authentication & Profiles
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/clients', require('./src/routes/clientRoutes'));

// Inventory & Catalog
app.use('/api/companies', require('./src/routes/companyRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/products-with-batches', require('./src/routes/productBatchRoutes'));  
app.use('/api/stock', require('./src/routes/stockRoutes'));

// Transactions & Orders
app.use('/api/purchase-bills', require('./src/routes/purchaseBillRoutes'));
app.use('/api/sales-invoices', require('./src/routes/salesInvoiceRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/inquiries', require('./src/routes/inquiryRoutes'));
app.use('/api/payment-receipts', require('./src/routes/paymentReceiptRoutes'));
app.use('/api/debit-notes', require('./src/routes/debitNoteRoutes'));
app.use('/api/billing', require('./src/routes/billingRoutes'));

// Analytics & System
app.use('/api/ledger', require('./src/routes/ledgerRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/audit', require('./src/routes/auditRoutes'));
app.use('/api/replenishment', require('./src/routes/replenishmentRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));

// Utilities
app.use('/api/drug-licenses', require('./src/routes/drugLicenseRoutes'));
app.use('/api/duplicates', require('./src/routes/duplicateRoutes'));
app.use('/api/phones', require('./src/routes/phoneRoutes'));
// ──────────────────────────────────────────────────────────────────────

// Health check endpoint
app.get('/', (req, res) => {
    res.send('VitalMEDS API is running successfully on AWS Serverless!');
});

// ✨ CLOUD ADDITION: Global Error Handler Middleware
// This catches all unhandled errors so API Gateway returns clean JSON instead of crashing
app.use((err, req, res, next) => {
    console.error('Unhandled Error caught by global middleware:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// ✨ CLOUD FIX: Conditionally start the server
// If running locally, use app.listen(). If on AWS, skip this so Lambda can manage it.
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Local Server is up and running on http://localhost:${PORT}`);
    });
}

// ✨ CLOUD ADDITION: Export the wrapped app for AWS Lambda
module.exports.handler = serverless(app);