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
    const clientId = req.params.id;

    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Client ID is required' });
    }

    const orders = await Order.find({ clientId: clientId })
      .sort({ createdAt: -1 })
      // 1. Populates the Product Name & Company
      .populate({
        path: 'items.productId',
        select: 'name mrp fallbackMrp companyId company', 
        populate: { 
          path: 'companyId', 
          select: 'name shortCode' 
        }
      })
      // ✨ 2. NEW FIX: Populates the Batch to reveal MRP and Expiry Date!
      .populate({
        path: 'items.plannedBatches.batchId',
        select: 'batchNumber mrp expiryDate expiry'
      });

    res.json({ success: true, data: orders });
  } catch (err) {
    console.error("getClientOrders Error:", err);
    res.status(500).json({ message: err.message });
  }
};