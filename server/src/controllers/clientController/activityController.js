// server/src/controllers/clientController/activityController.js
const SalesInvoice = require('../../models/SalesInvoice');
const PaymentReceipt = require('../../models/PaymentReceipt');
const Order = require('../../models/Order');

exports.getClientInvoices = async (req, res) => {
  try {
    // ✨ FIXED: Added invoiceStatus: { $ne: 'CANCELLED' }
    const invoices = await SalesInvoice.find({ 
      clientObjectId: req.params.id,
      invoiceStatus: { $ne: 'CANCELLED' } 
    }).sort({ invoiceDate: -1 });
    
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getClientPayments = async (req, res) => {
  try {
    const receipts = await PaymentReceipt.find({ clientObjectId: req.params.id }).sort({ paymentDate: -1 });
    res.json({ success: true, data: receipts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getClientOrders = async (req, res) => {
  try {
    const orders = await Order.find({ clientId: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};