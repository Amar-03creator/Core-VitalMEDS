// // server/src/controllers/inquiryController.js
// const mongoose = require('mongoose');
// const Inquiry = require('../models/Inquiry');
// const Client = require('../models/Client');
// const Batch = require('../models/Batch');
// const Product = require('../models/Product');
// const Notification = require('../models/Notification');
// const { getNextInquiryNumber } = require('../helpers/SequenceHelper');

// const Admin = mongoose.model('Admin');

// // Foolproof number parser
// const safeNum = (val) => {
//   const n = Number(val);
//   return isNaN(n) ? 0 : n;
// };

// const attachClosestExpiry = async (docs) => {
//   if (!docs || docs.length === 0) return docs;

//   const productIds = new Set();

//   docs.forEach(doc => {
//     if (!doc.items) return;
//     doc.items.forEach(item => {
//       if (item.productId && item.productId._id) productIds.add(item.productId._id.toString());
//       else if (item.productId) productIds.add(item.productId.toString());
//     });
//   });

//   if (productIds.size === 0) return docs;

//   const batches = await Batch.find({
//     productId: { $in: Array.from(productIds) },
//     totalStockQuantity: { $gt: 0 },
//     isActive: true
//   }).select('productId expiryDate mrp').lean();

//   const expiryMap = {};
//   batches.forEach(b => {
//     const pid = b.productId.toString();
//     const bDate = new Date(b.expiryDate);
//     if (!expiryMap[pid] || bDate < expiryMap[pid].date) {
//       expiryMap[pid] = { date: bDate, mrp: b.mrp };
//     }
//   });

//   docs.forEach(doc => {
//     if (!doc.items) return;
//     doc.items.forEach(item => {
//       const pid = item.productId && item.productId._id ? item.productId._id.toString() : item.productId?.toString();

//       if (item.productId && item.productId._id) {
//         const prodMrp = safeNum(item.productId.mrp);
//         const prodPtr = safeNum(item.productId.defaultRate) || (prodMrp * 0.8);

//         if (item.fallbackMrp == null) item.fallbackMrp = prodMrp;
//         if (item.estPTR == null) item.estPTR = prodPtr;
//       }

//       if (pid && expiryMap[pid]) {
//         if (!item.expiryDate) item.closestExpiry = expiryMap[pid].date;
//         if (!item.mrp && (item.fallbackMrp == null || item.fallbackMrp === 0)) {
//           item.fallbackMrp = expiryMap[pid].mrp;
//         }
//       }
//     });
//   });

//   return docs;
// };

// const notifyClient = async (clientId, payload) => {
//   try {
//     await Notification.create({ recipientId: clientId, recipientRole: 'client', ...payload });
//   } catch (err) {
//     console.error('notifyClient error:', err);
//   }
// };

// const populateInquiryItems = (query) =>
//   query
//     .populate('clientId', 'establishmentName city deliveryRoute')
//     .populate({
//       path: 'items.productId',
//       select: 'name company companyId packing photoUrl gstRate mrp defaultRate',
//       populate: { path: 'companyId', select: 'shortCode companyName' },
//     })
//     .populate('items.offerBatchId', 'batchNumber expiryDate mrp')
//     .populate('linkedOrder', 'orderId status');


// exports.createInquiry = async (req, res) => {
//   try {
//     const { clientId, items, billPreference, clientNote, clientRemarks } = req.body;

//     if (!clientId) return res.status(400).json({ message: 'clientId is required.' });
//     if (!Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({ message: 'At least one item is required.' });
//     }

//     const client = await Client.findById(clientId).select('clientId establishmentName');
//     if (!client) return res.status(404).json({ message: 'Client not found.' });

//     const productIds = items.map(i => i.productId);
    
//     // ✨ FIX: Upgraded to mirror Safe Batch / Offer Batch logic perfectly
//     const batches = await Batch.find({
//       productId: { $in: productIds },
//       totalStockQuantity: { $gt: 0 },
//       isActive: true
//     }).select('productId expiryDate mrp offer').lean();

//     const products = await Product.find({ _id: { $in: productIds } }).lean();

//     const thresholdDate = new Date();
//     thresholdDate.setMonth(thresholdDate.getMonth() + 3);

//     const enrichedItems = items.map((i) => {
//       const pidStr = String(i.productId);
//       const product = products.find(p => String(p._id) === pidStr);
//       const prodBatches = batches.filter(b => String(b.productId) === pidStr);

//       let finalMrp = product ? safeNum(product.mrp) : 0;
//       let finalExpiry = null;
//       let offerDesc = '';
//       let offerBatchId = undefined;

//       if (prodBatches.length > 0) {
//         if (i.batchId) {
//           // Client checked out from Offer Modal
//           const specificBatch = prodBatches.find(b => String(b._id) === String(i.batchId));
//           if (specificBatch) {
//             finalMrp = safeNum(specificBatch.mrp);
//             finalExpiry = new Date(specificBatch.expiryDate);
//             offerBatchId = specificBatch._id;
//             if (specificBatch.offer) offerDesc = specificBatch.offer.description || '';
//           }
//         } else {
//           // NORMAL ITEM: Safe MRP & Safe Expiry Logic
//           const normalBatches = prodBatches.filter(b => !(b.offer && b.offer.isActive));
//           const validBatches = normalBatches.length > 0 ? normalBatches : prodBatches;
          
//           const validDates = validBatches.filter(b => !isNaN(new Date(b.expiryDate)));
//           const safeBatches = validDates.filter(b => new Date(b.expiryDate) >= thresholdDate);

//           // Find Highest MRP strictly from Safe Batches!
//           const mrpSourceBatches = safeBatches.length > 0 ? safeBatches : validDates;
//           if (mrpSourceBatches.length > 0) {
//             finalMrp = Math.max(...mrpSourceBatches.map(b => safeNum(b.mrp)));
//           }

//           // Find Safe Expiry Date
//           if (safeBatches.length > 0) {
//             finalExpiry = new Date(Math.min(...safeBatches.map(b => new Date(b.expiryDate))));
//           } else if (validDates.length > 0) {
//             finalExpiry = new Date(Math.min(...validDates.map(b => new Date(b.expiryDate))));
//           }
//         }
//       }

//       const ptr = product ? (safeNum(product.defaultRate) || (finalMrp * 0.8)) : 0;

//       return {
//         productId: i.productId,
//         requestedQty: safeNum(i.requestedQty),
//         estimatedLineTotal: safeNum(i.estimatedLineTotal),
        
//         mrp: finalMrp,
//         expiryDate: finalExpiry,
//         offerBatchId: offerBatchId,
//         offerDescription: offerDesc, // ✨ Snapshot
        
//         fallbackMrp: finalMrp,
//         estPTR: ptr
//       };
//     });

//     const inquiryId = await getNextInquiryNumber(client.clientId);

//     const inquiry = new Inquiry({
//       inquiryId,
//       clientId,
//       status: 'Pending',
//       items: enrichedItems,
//       billPreference,
//       clientRemarks: clientNote || clientRemarks,
//       totalPrice: enrichedItems.reduce((sum, i) => sum + i.estimatedLineTotal, 0),
//     });

//     await inquiry.save();

//     const admin = await Admin.findOne();
//     if (admin) {
//       await Notification.create({
//         recipientId: admin._id,
//         recipientRole: 'admin',
//         type: 'inquiry',
//         title: 'New Inquiry Received',
//         message: `${client.establishmentName} requested a price quote for ${items.length} item${items.length > 1 ? 's' : ''}.`,
//         link: `/admin-dashboard/orders?tab=inquiries&search=${inquiry.inquiryId}`
//       });
//     }

//     res.status(201).json({ success: true, data: inquiry });
//   } catch (err) {
//     console.error('createInquiry error:', err);
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.getInquiries = async (req, res) => {
//   try {
//     const { clientId, status } = req.query;
//     const match = {};
//     if (clientId) match.clientId = clientId;
//     if (status) match.status = status;

//     let inquiries = await populateInquiryItems(Inquiry.find(match)).sort({ createdAt: -1 }).lean();
//     inquiries = await attachClosestExpiry(inquiries);

//     res.json({ success: true, count: inquiries.length, data: inquiries });
//   } catch (err) {
//     console.error('getInquiries error:', err);
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.getInquiryById = async (req, res) => {
//   try {
//     const inquiry = await populateInquiryItems(Inquiry.findById(req.params.id)).lean();
//     if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

//     const [enrichedInquiry] = await attachClosestExpiry([inquiry]);

//     res.json({ success: true, data: enrichedInquiry });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.deleteInquiry = async (req, res) => {
//   try {
//     const inquiry = await Inquiry.findById(req.params.id);
//     if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

//     if (inquiry.status !== 'Pending') {
//       return res.status(409).json({ message: 'This inquiry has already been viewed by admin and can no longer be deleted.' });
//     }

//     await inquiry.deleteOne();
//     res.json({ success: true, message: 'Inquiry deleted.' });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.markViewed = async (req, res) => {
//   try {
//     const inquiry = await Inquiry.findById(req.params.id);
//     if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

//     if (inquiry.status === 'Pending') {
//       inquiry.status = 'Viewed';
//       await inquiry.save();
//     }
//     res.json({ success: true, data: inquiry });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.sendQuote = async (req, res) => {
//   try {
//     const inquiry = await Inquiry.findById(req.params.id);
//     if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

//     if (!['Pending', 'Viewed'].includes(inquiry.status)) {
//       return res.status(409).json({ message: 'This inquiry is no longer open for quoting.' });
//     }

//     const { items, discountPercent, discountValue, discountType, discountReason, adminRemarks, billPreference } = req.body;

//     if (discountPercent > 0 && !discountReason) {
//       return res.status(400).json({ message: 'A discount reason is required whenever a discount is applied.' });
//     }

//     // Grab batches so we can pull the offer description if the admin selected an offer batch manually
//     const batchIds = items?.map(i => i.offerBatchId).filter(Boolean) || [];
//     const batches = await Batch.find({ _id: { $in: batchIds } }).select('offer').lean();

//     if (items) {
//       inquiry.items = inquiry.items.map((existing) => {
//         const update = items.find((i) => String(i.productId) === String(existing.productId));
//         if (!update) return existing;
        
//         // Restore snapshot if available
//         let offerDesc = existing.offerDescription || '';
        
//         // If the admin attached a specific Offer Batch to the quote, snapshot its description
//         if (update.offerBatchId) {
//             const b = batches.find(b => String(b._id) === String(update.offerBatchId));
//             if (b && b.offer) offerDesc = b.offer.description || '';
//         }

//         return {
//           ...existing.toObject(),
//           adminOfferedPTR: safeNum(update.adminOfferedPTR),
//           chargeableQty: safeNum(update.chargeableQty),
//           freeQty: safeNum(update.freeQty),
//           offerBatchId: update.offerBatchId || undefined,
//           offerDescription: offerDesc, // ✨ Snapshot saved!
//           discountType: update.discountType,
//           discountValue: safeNum(update.discountValue),
//           discountAmount: safeNum(update.discountAmount),
//           estimatedLineTotal: safeNum(update.estimatedLineTotal),
//         };
//       });
//     }

//     if (billPreference) inquiry.billPreference = billPreference;
//     inquiry.discountType = discountType || 'percent';
//     inquiry.discountPercent = discountType === 'percent' ? safeNum(discountPercent) : 0;
//     inquiry.discountValue = safeNum(discountValue);
//     inquiry.discountReason = discountReason || '';
//     if (adminRemarks !== undefined) inquiry.adminRemarks = adminRemarks;

//     inquiry.totalPrice = inquiry.items.reduce((sum, i) => sum + (i.estimatedLineTotal || 0), 0);

//     let finalDiscAmount = 0;
//     if (inquiry.discountType === 'percent') {
//       finalDiscAmount = inquiry.totalPrice * ((inquiry.discountValue || 0) / 100);
//     } else {
//       finalDiscAmount = inquiry.discountValue || 0;
//     }
//     inquiry.discountedTotalPrice = inquiry.totalPrice - finalDiscAmount;

//     inquiry.status = 'Quoted';
//     inquiry.updatedBy = req.admin?._id;

//     await inquiry.save();

//     await notifyClient(inquiry.clientId, {
//       type: 'inquiry',
//       title: 'Quote ready',
//       message: 'Your inquiry has a quote ready for review.',
//       link: `/client-dashboard/orders?tab=inquiries&id=${inquiry._id}`,
//     });

//     res.json({ success: true, data: inquiry });
//   } catch (err) {
//     console.error('sendQuote error:', err);
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.rejectInquiry = async (req, res) => {
//   try {
//     const inquiry = await Inquiry.findById(req.params.id);
//     if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

//     if (!['Pending', 'Viewed', 'Quoted'].includes(inquiry.status)) {
//       return res.status(409).json({ message: 'This inquiry cannot be rejected in its current state.' });
//     }

//     const rejectedByRole = req.user?.role || 'client';

//     inquiry.status = 'Rejected';
//     inquiry.rejectionReason = req.body.reason || '';
//     inquiry.rejectedBy = rejectedByRole;

//     if (req.admin?._id) {
//       inquiry.updatedBy = req.admin._id;
//     } else if (req.user?._id) {
//       inquiry.updatedBy = req.user._id;
//     }

//     await inquiry.save();

//     res.json({ success: true, data: inquiry });
//   } catch (err) {
//     console.error('rejectInquiry error:', err);
//     res.status(500).json({ message: err.message });
//   }
// };







// server/src/controllers/inquiryController.js

/* 
 * ============================================================================
 * 📝 INQUIRY CREATION LOGIC (B2B QUOTATION SYSTEM)
 * ============================================================================
 * An Inquiry does NOT deduct or reserve virtual stock. It is purely a request 
 * for a price quote. 
 * 
 * 1. Snapshotting Strategy:
 *    - When the client submits an inquiry, we capture the MRP, Expiry, and PTR 
 *      at that exact moment so the quote reflects reality.
 *    - If an Offer Batch is selected (`i.batchId`), we strictly capture that 
 *      batch's specific details (MRP, Expiry, and Offer Description).
 *    - If it's a Standard Item (No `batchId`), we look for the highest MRP 
 *      among "Safe Batches" (non-expired, non-offer) and use the closest 
 *      safe expiry date as a baseline.
 * 
 * 2. Admin Interaction:
 *    - Admins review inquiries and propose PTRs. They can attach an offer batch 
 *      during quoting if they wish. The status changes to 'Quoted'.
 * 
 * 3. Client Conversion:
 *    - When a client accepts a quote, the inquiry is converted into an Order. 
 *      (Stock logic is handled entirely by orderController during conversion).
 * ============================================================================
 */

const mongoose = require('mongoose');
const Inquiry = require('../models/Inquiry');
const Client = require('../models/Client');
const Batch = require('../models/Batch');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const { getNextInquiryNumber } = require('../helpers/SequenceHelper');

const Admin = mongoose.model('Admin');

// Foolproof number parser
const safeNum = (val) => {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
};

const attachClosestExpiry = async (docs) => {
  if (!docs || docs.length === 0) return docs;

  const productIds = new Set();

  docs.forEach(doc => {
    if (!doc.items) return;
    doc.items.forEach(item => {
      if (item.productId && item.productId._id) productIds.add(item.productId._id.toString());
      else if (item.productId) productIds.add(item.productId.toString());
    });
  });

  if (productIds.size === 0) return docs;

  const batches = await Batch.find({
    productId: { $in: Array.from(productIds) },
    totalStockQuantity: { $gt: 0 },
    isActive: true
  }).select('productId expiryDate mrp').lean();

  const expiryMap = {};
  batches.forEach(b => {
    const pid = b.productId.toString();
    const bDate = new Date(b.expiryDate);
    if (!expiryMap[pid] || bDate < expiryMap[pid].date) {
      expiryMap[pid] = { date: bDate, mrp: b.mrp };
    }
  });

  docs.forEach(doc => {
    if (!doc.items) return;
    doc.items.forEach(item => {
      const pid = item.productId && item.productId._id ? item.productId._id.toString() : item.productId?.toString();

      if (item.productId && item.productId._id) {
        const prodMrp = safeNum(item.productId.mrp);
        const prodPtr = safeNum(item.productId.defaultRate) || (prodMrp * 0.8);

        if (item.fallbackMrp == null) item.fallbackMrp = prodMrp;
        if (item.estPTR == null) item.estPTR = prodPtr;
      }

      if (pid && expiryMap[pid]) {
        if (!item.expiryDate) item.closestExpiry = expiryMap[pid].date;
        if (!item.mrp && (item.fallbackMrp == null || item.fallbackMrp === 0)) {
          item.fallbackMrp = expiryMap[pid].mrp;
        }
      }
    });
  });

  return docs;
};

const notifyClient = async (clientId, payload) => {
  try {
    await Notification.create({ recipientId: clientId, recipientRole: 'client', ...payload });
  } catch (err) {
    console.error('notifyClient error:', err);
  }
};

const populateInquiryItems = (query) =>
  query
    .populate('clientId', 'establishmentName city deliveryRoute')
    .populate({
      path: 'items.productId',
      select: 'name company companyId packing photoUrl gstRate mrp defaultRate',
      populate: { path: 'companyId', select: 'shortCode companyName' },
    })
    .populate('items.offerBatchId', 'batchNumber expiryDate mrp')
    .populate('linkedOrder', 'orderId status');


exports.createInquiry = async (req, res) => {
  try {
    const { clientId, items, billPreference, clientNote, clientRemarks } = req.body;

    if (!clientId) return res.status(400).json({ message: 'clientId is required.' });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required.' });
    }

    const client = await Client.findById(clientId).select('clientId establishmentName');
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    const productIds = items.map(i => i.productId);
    
    // ✨ Fetch Snapshot Data
    const batches = await Batch.find({
      productId: { $in: productIds },
      totalStockQuantity: { $gt: 0 },
      isActive: true
    }).select('productId expiryDate mrp offer').lean();

    const products = await Product.find({ _id: { $in: productIds } }).lean();

    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setMonth(thresholdDate.getMonth() + 3);

    const enrichedItems = items.map((i) => {
      const pidStr = String(i.productId);
      const product = products.find(p => String(p._id) === pidStr);
      const prodBatches = batches.filter(b => String(b.productId) === pidStr);

      let finalMrp = product ? safeNum(product.mrp) : 0;
      let finalExpiry = null;
      let offerDesc = '';
      let offerBatchId = undefined;

      if (prodBatches.length > 0) {
        if (i.batchId) {
          // 1. OFFER ITEM: Strict Snapshot of the specific batch
          const specificBatch = prodBatches.find(b => String(b._id) === String(i.batchId));
          if (specificBatch) {
            finalMrp = safeNum(specificBatch.mrp);
            finalExpiry = new Date(specificBatch.expiryDate);
            offerBatchId = specificBatch._id;
            if (specificBatch.offer) offerDesc = specificBatch.offer.description || '';
          }
        } else {
          // 2. STANDARD ITEM: Safe MRP & Safe Expiry Logic
          const normalBatches = prodBatches.filter(b => !(b.offer && b.offer.isActive));
          const validBatches = normalBatches.length > 0 ? normalBatches : prodBatches;
          
          const validDates = validBatches.filter(b => !isNaN(new Date(b.expiryDate)));
          const safeBatches = validDates.filter(b => new Date(b.expiryDate) >= thresholdDate);

          // Find Highest MRP strictly from Safe Batches!
          const mrpSourceBatches = safeBatches.length > 0 ? safeBatches : validDates;
          if (mrpSourceBatches.length > 0) {
            finalMrp = Math.max(...mrpSourceBatches.map(b => safeNum(b.mrp)));
          }

          // Find Safe Expiry Date
          if (safeBatches.length > 0) {
            finalExpiry = new Date(Math.min(...safeBatches.map(b => new Date(b.expiryDate))));
          } else if (validDates.length > 0) {
            finalExpiry = new Date(Math.min(...validDates.map(b => new Date(b.expiryDate))));
          }
        }
      }

      const ptr = product ? (safeNum(product.defaultRate) || (finalMrp * 0.8)) : 0;

      return {
        productId: i.productId,
        requestedQty: safeNum(i.requestedQty),
        estimatedLineTotal: safeNum(i.estimatedLineTotal),
        
        mrp: finalMrp,
        expiryDate: finalExpiry,
        offerBatchId: offerBatchId,
        offerDescription: offerDesc, 
        
        fallbackMrp: finalMrp,
        estPTR: ptr
      };
    });

    const inquiryId = await getNextInquiryNumber(client.clientId);

    const inquiry = new Inquiry({
      inquiryId,
      clientId,
      status: 'Pending',
      items: enrichedItems,
      billPreference,
      clientRemarks: clientNote || clientRemarks,
      totalPrice: enrichedItems.reduce((sum, i) => sum + i.estimatedLineTotal, 0),
    });

    await inquiry.save();

    const admin = await Admin.findOne();
    if (admin) {
      await Notification.create({
        recipientId: admin._id,
        recipientRole: 'admin',
        type: 'inquiry',
        title: 'New Inquiry Received',
        message: `${client.establishmentName} requested a price quote for ${items.length} item${items.length > 1 ? 's' : ''}.`,
        link: `/admin-dashboard/orders?tab=inquiries&search=${inquiry.inquiryId}`
      });
    }

    res.status(201).json({ success: true, data: inquiry });
  } catch (err) {
    console.error('createInquiry error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getInquiries = async (req, res) => {
  try {
    const { clientId, status } = req.query;
    const match = {};
    if (clientId) match.clientId = clientId;
    if (status) match.status = status;

    let inquiries = await populateInquiryItems(Inquiry.find(match)).sort({ createdAt: -1 }).lean();
    inquiries = await attachClosestExpiry(inquiries);

    res.json({ success: true, count: inquiries.length, data: inquiries });
  } catch (err) {
    console.error('getInquiries error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getInquiryById = async (req, res) => {
  try {
    const inquiry = await populateInquiryItems(Inquiry.findById(req.params.id)).lean();
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

    const [enrichedInquiry] = await attachClosestExpiry([inquiry]);

    res.json({ success: true, data: enrichedInquiry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

    if (inquiry.status !== 'Pending') {
      return res.status(409).json({ message: 'This inquiry has already been viewed by admin and can no longer be deleted.' });
    }

    await inquiry.deleteOne();
    res.json({ success: true, message: 'Inquiry deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markViewed = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

    if (inquiry.status === 'Pending') {
      inquiry.status = 'Viewed';
      await inquiry.save();
    }
    res.json({ success: true, data: inquiry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendQuote = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

    if (!['Pending', 'Viewed'].includes(inquiry.status)) {
      return res.status(409).json({ message: 'This inquiry is no longer open for quoting.' });
    }

    const { items, discountPercent, discountValue, discountType, discountReason, adminRemarks, billPreference } = req.body;

    if (discountPercent > 0 && !discountReason) {
      return res.status(400).json({ message: 'A discount reason is required whenever a discount is applied.' });
    }

    const batchIds = items?.map(i => i.offerBatchId).filter(Boolean) || [];
    const batches = await Batch.find({ _id: { $in: batchIds } }).select('offer').lean();

    if (items) {
      inquiry.items = inquiry.items.map((existing) => {
        const update = items.find((i) => String(i.productId) === String(existing.productId));
        if (!update) return existing;
        
        let offerDesc = existing.offerDescription || '';
        
        if (update.offerBatchId) {
            const b = batches.find(b => String(b._id) === String(update.offerBatchId));
            if (b && b.offer) offerDesc = b.offer.description || '';
        }

        return {
          ...existing.toObject(),
          adminOfferedPTR: safeNum(update.adminOfferedPTR),
          chargeableQty: safeNum(update.chargeableQty),
          freeQty: safeNum(update.freeQty),
          offerBatchId: update.offerBatchId || undefined,
          offerDescription: offerDesc,
          discountType: update.discountType,
          discountValue: safeNum(update.discountValue),
          discountAmount: safeNum(update.discountAmount),
          estimatedLineTotal: safeNum(update.estimatedLineTotal),
        };
      });
    }

    if (billPreference) inquiry.billPreference = billPreference;
    inquiry.discountType = discountType || 'percent';
    inquiry.discountPercent = discountType === 'percent' ? safeNum(discountPercent) : 0;
    inquiry.discountValue = safeNum(discountValue);
    inquiry.discountReason = discountReason || '';
    if (adminRemarks !== undefined) inquiry.adminRemarks = adminRemarks;

    inquiry.totalPrice = inquiry.items.reduce((sum, i) => sum + (i.estimatedLineTotal || 0), 0);

    let finalDiscAmount = 0;
    if (inquiry.discountType === 'percent') {
      finalDiscAmount = inquiry.totalPrice * ((inquiry.discountValue || 0) / 100);
    } else {
      finalDiscAmount = inquiry.discountValue || 0;
    }
    inquiry.discountedTotalPrice = inquiry.totalPrice - finalDiscAmount;

    inquiry.status = 'Quoted';
    inquiry.updatedBy = req.admin?._id;

    await inquiry.save();

    await notifyClient(inquiry.clientId, {
      type: 'inquiry',
      title: 'Quote ready',
      message: 'Your inquiry has a quote ready for review.',
      link: `/client-dashboard/orders?tab=inquiries&id=${inquiry._id}`,
    });

    res.json({ success: true, data: inquiry });
  } catch (err) {
    console.error('sendQuote error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.rejectInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

    if (!['Pending', 'Viewed', 'Quoted'].includes(inquiry.status)) {
      return res.status(409).json({ message: 'This inquiry cannot be rejected in its current state.' });
    }

    const rejectedByRole = req.user?.role || 'client';

    inquiry.status = 'Rejected';
    inquiry.rejectionReason = req.body.reason || '';
    inquiry.rejectedBy = rejectedByRole;

    if (req.admin?._id) {
      inquiry.updatedBy = req.admin._id;
    } else if (req.user?._id) {
      inquiry.updatedBy = req.user._id;
    }

    await inquiry.save();

    res.json({ success: true, data: inquiry });
  } catch (err) {
    console.error('rejectInquiry error:', err);
    res.status(500).json({ message: err.message });
  }
};