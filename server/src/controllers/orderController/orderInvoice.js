// server/src/controllers/orderController/orderInvoice.js
const Order = require('../../models/Order');
const SalesInvoice = require('../../models/SalesInvoice');
const Admin = require('../../models/Admin');
const { generateInvoicePdfBuffer } = require('../../helpers/invoicePdfGenerator');

exports.downloadInvoicePdf = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    if (!order.invoiceDocumentId) {
      return res.status(404).json({ message: 'This order does not have an invoice generated yet.' });
    }

    const invoice = await SalesInvoice.findById(order.invoiceDocumentId).populate('clientObjectId', 'city district');
    if (!invoice) return res.status(409).json({ message: "This order's linked invoice could not be found." });

    // ✨ THIS GRABS MILA AGENCIES, COMPLETELY IGNORING FIKU'S GHOST ACCOUNT
    const adminProfile = await Admin.findOne({ 'proprietor.name': { $exists: true } }) || {};

    const pdfBuffer = await generateInvoicePdfBuffer(invoice, adminProfile);
    const filename = `${invoice.invoiceNumber || order.orderId}.pdf`;

    const base64Pdf = pdfBuffer.toString('base64');
    res.status(200).json({ success: true, filename: filename, pdfData: base64Pdf });

  } catch (err) {
    console.error('downloadInvoicePdf error:', err);
    res.status(500).json({ message: err.message || 'Failed to generate invoice PDF.' });
  }
};