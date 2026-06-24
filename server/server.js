// Import the Express library
const express = require('express');

// Import the function to connect to the database
const connectDB = require('./src/config/db');

// Load environment variables from the .env file
require('dotenv').config();

// Initialize the Express application
const app = express();
connectDB(); // Connect to the database before starting the server


// Define the port our server will listen on. 
// We use 5000 as a standard development port for backends.
const PORT = process.env.PORT || 5000;

// Middleware: This tells Express to automatically parse incoming data as JSON.
// When your React frontend sends data (like a login email/password), this makes it readable.
app.use(express.json());
const cors = require('cors');  // Import the CORS middleware to handle cross-origin requests
app.use(cors());    // Enable CORS for all routes, allowing requests from any origin. This is useful during development when your frontend and backend are on different ports.
const companyRoutes = require('./src/routes/companyRoutes');
const productRoutes = require('./src/routes/productRoutes');
const purchaseBillRoutes = require('./src/routes/purchaseBillRoutes');
const salesInvoiceRoutes = require('./src/routes/salesInvoiceRoutes');
const clientRoutes = require('./src/routes/clientRoutes');
const paymentReceiptRoutes = require('./src/routes/paymentReceiptRoutes');
const drugLicenseRoutes = require('./src/routes/drugLicenseRoutes');
const duplicateRoutes = require('./src/routes/duplicateRoutes');
const phoneRoutes = require('./src/routes/phoneRoutes');
const productBatchRoutes = require('./src/routes/productBatchRoutes');
const ledgerRoutes = require('./src/routes/ledgerRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const auditRoutes = require('./src/routes/auditRoutes');


// Tell Express: "If a URL starts with /api/companies, send it to the companyRoutes file"
app.use('/api/companies', companyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchase-bills', purchaseBillRoutes);
app.use('/api/sales-invoices', salesInvoiceRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/payment-receipts', paymentReceiptRoutes);
app.use('/api/drug-licenses', drugLicenseRoutes);
app.use('/api/duplicates', duplicateRoutes);
app.use('/api/phones', phoneRoutes);
app.use('/api/products-with-batches', productBatchRoutes);  
app.use('/api/ledger', ledgerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit', require('./src/routes/auditRoutes'));

// Create a basic test route (an endpoint)
// When a browser or frontend sends a GET request to the root URL ('/'), run this function.
app.get('/', (req, res) => {
    res.send('VitalMEDS API is running successfully!');
});

// Tell the server to start listening for incoming requests
app.listen(PORT, () => {
    console.log(`Server is up and running on http://localhost:${PORT}`);
});




