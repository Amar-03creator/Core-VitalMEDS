// src/controllers/productBatchController.js
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const Notification = require('../models/Notification');
const Client = require('../models/Client');

 
/* ── 1. Original: Get Products With Batches (Used for PDF Export & Catalog) ── */
exports.getProductsWithBatches = async (req, res) => {
  try {
    const products = await Product.find({}).populate('companyId', 'shortCode').lean();
    const productIds = products.map(p => p._id);

    // ✨ NEW: Fetch pending orders for Soft Allocation
    const Order = require('../models/Order');
    const liveOrders = await Order.find({
      status: { $in: ['Placed', 'Confirmed', 'Editing'] }
    }).select('items').lean();

    const globalAllocations = {}; 
    const batchAllocations = {};  

    liveOrders.forEach(order => {
      if (!order.items) return;
      order.items.forEach(item => {
        const pId = String(item.productId);
        const qty = Number(item.requestedQty || item.chargeableQty || 0);
        globalAllocations[pId] = (globalAllocations[pId] || 0) + qty;

        if (item.plannedBatches && item.plannedBatches.length > 0) {
          item.plannedBatches.forEach(pb => {
            const bId = String(pb.batchId);
            batchAllocations[bId] = (batchAllocations[bId] || 0) + Number(pb.chargeableQty || 0);
          });
        }
      });
    });

    const enriched = await Promise.all(
      products.map(async (product) => {
        const pIdStr = String(product._id);
        const batches = await Batch.find({ productId: product._id })
          .select('batchNumber mrp expiryDate totalStockQuantity offer')
          .lean();

        const batchList = batches.map(b => {
          const reservedInBatch = batchAllocations[String(b._id)] || 0;
          // ✨ Soft Allocation: Subtract pending orders from the batch stock
          const virtualBatchStock = Math.max(0, (b.totalStockQuantity || 0) - reservedInBatch);

          return {
            _id: b._id,
            no: b.batchNumber,
            mrp: b.mrp,
            expiry: b.expiryDate ? b.expiryDate.toISOString().split('T')[0] : '',
            stock: virtualBatchStock, 
            offer: b.offer?.isActive ? b.offer : null,
          };
        });

        // ✨ Soft Allocation: Subtract pending orders from the global stock
        const totalReserved = globalAllocations[pIdStr] || 0;
        const virtualTotalStock = Math.max(0, (product.totalStock || 0) - totalReserved);

        const firstBatch = batchList[0];
        const computedRate = firstBatch && firstBatch.mrp
          ? parseFloat((firstBatch.mrp * 0.8).toFixed(2))
          : 0;

        return {
          productId: product._id, // ✨ FIXED: Maps perfectly to the Cart now!
          name: product.name,
          company: product.company,
          companyShortCode: product.companyId ? product.companyId.shortCode : product.company,
          categories: product.categories,
          description: product.description,
          usageTips: product.usageTips,
          type: product.type,
          compositions: product.compositions,
          packing: product.packing,
          hsn: product.hsnCode,
          gstRate: product.gstRate,
          mrp: product.mrp || 0,
          photoUrl: (product.images && product.images.length > 0) ? product.images[0] : (product.photoUrl || ''),
          images: product.images || [],
          defaultRate: computedRate,    
          batches: batchList,
          
          totalStock: virtualTotalStock, // Sends the Soft Allocated stock to the frontend!
          shortExpiryThreshold: product.shortExpiryThreshold || 90,
          lowStockThreshold: product.lowStockThreshold || 50,
          criticalStockThresholdPercent: product.criticalStockThresholdPercent || 50,
        };
      })
    );

    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── 2. New: Get Inventory (Used for the Advanced Inventory Page) ── */
exports.getInventory = async (req, res) => {
  try {
    const { search, company, category, type } = req.query;

    const productMatch = {};

    // Handle multiple companies (comma-separated)
    if (company) {
      const companyArray = company.split(',').map(c => c.trim()).filter(Boolean);
      if (companyArray.length > 0) {
        productMatch.company = { $in: companyArray };
      }
    }

    // Handle multiple categories (comma-separated)
    if (category) {
      const categoryArray = category.split(',').map(c => c.trim()).filter(Boolean);
      if (categoryArray.length > 0) {
        productMatch.categories = { $in: categoryArray };
      }
    }

    // Handle type (single or multiple)
    if (type) {
      const typeArray = type.split(',').map(t => t.trim()).filter(Boolean);
      if (typeArray.length === 1) {
        productMatch.type = typeArray[0];
      } else if (typeArray.length > 1) {
        productMatch.type = { $in: typeArray };
      }
    }

    const pipeline = [
      { $match: productMatch },
      {
        $lookup: {
          from: 'batches',
          localField: '_id',
          foreignField: 'productId',
          as: 'batches'
        }
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'companyId',
          foreignField: '_id',
          as: 'companyDetails'
        }
      }
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } },
            { 'batches.batchNumber': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    pipeline.push({ $sort: { name: 1 } });

    const inventory = await Product.aggregate(pipeline);

    const formattedInventory = inventory.map(product => {
      product.batches = product.batches.map(batch => {
        const latestLot = batch.purchaseLots && batch.purchaseLots.length > 0
          ? batch.purchaseLots[batch.purchaseLots.length - 1]
          : null;
        return {
          ...batch,
          purchaseRate: latestLot ? latestLot.purchaseRate : 0
        };
      });
      return product;
    });

    res.status(200).json({ success: true, count: formattedInventory.length, data: formattedInventory });
  } catch (error) {
    console.error('[getInventory] error:', error);
    res.status(500).json({ message: error.message });
  }
};

/* ── 3. New: Update Batch PTR (Used for inline selling rate edits) ── */
exports.updateBatchPTR = async (req, res) => {
  try {
    const { id } = req.params;
    const { sellingRate } = req.body;
    const numPTR = Number(sellingRate);

    if (!sellingRate || isNaN(sellingRate) || numPTR <= 0) {
      return res.status(400).json({ message: 'A valid Selling Rate (PTR) is required.' });
    }

    // Fetch the batch to do math validation
    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found.' });
    }

    // Establish boundaries
    const maxPtr = batch.mrp * 0.8;
    const latestPurchaseRate = batch.purchaseLots?.length > 0 
      ? batch.purchaseLots[batch.purchaseLots.length - 1].purchaseRate 
      : 0;

    // Validate
    if (numPTR > maxPtr) {
        return res.status(400).json({ message: `PTR (₹${numPTR}) cannot exceed 80% of MRP (₹${maxPtr.toFixed(2)}).` });
    }
    if (numPTR < latestPurchaseRate) {
        return res.status(400).json({ message: `PTR (₹${numPTR}) cannot be less than Purchase Cost (₹${latestPurchaseRate}).` });
    }

    // Apply and Save
    batch.sellingRate = numPTR;
    await batch.save();

    res.status(200).json({ message: 'PTR updated successfully', data: batch });
  } catch (error) {
    console.error('[updateBatchPTR] error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ... existing code ...

/* ── 4. Get Short Expiry Batches (For Offers Page) ── */
// exports.getShortExpiryBatches = async (req, res) => {
//   try {
//     const months = parseInt(req.query.months) || 6;
//     const thresholdDate = new Date();
//     thresholdDate.setMonth(thresholdDate.getMonth() + months);

//     const batches = await Batch.find({ 
//       expiryDate: { $lte: thresholdDate },
//       totalStockQuantity: { $gt: 0 } // Don't show zero stock batches
//     }).populate('companyId', 'shortCode').lean();

//     const formatted = batches.map(b => ({
//       id: b._id,
//       productId: b.productId,
//       productName: b.productName,
//       company: b.companyName,
//       companyShortCode: b.companyId?.shortCode || b.companyName,
//       batchNumber: b.batchNumber,
//       expiryDate: b.expiryDate,
//       remainingUnits: b.totalStockQuantity,
//       mrp: b.mrp,
//       sellingRate: b.sellingRate,
//       offer: b.offer?.isActive ? b.offer : null
//     }));

//     // Sort by closest expiry
//     formatted.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

//     res.status(200).json({ success: true, data: formatted });
//   } catch (error) {
//     console.error('[getShortExpiryBatches] error:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// /* ── 5. Get Active Offers (For Offers Page & Client Dashboard) ── */
// exports.getActiveOffers = async (req, res) => {
//   try {
//     const batches = await Batch.find({ 
//       'offer.isActive': true,
//       totalStockQuantity: { $gt: 0 } 
//     }).populate('companyId', 'shortCode').lean();

//     const formatted = batches.map(b => ({
//       id: b._id,
//       productId: b.productId,
//       productName: b.productName,
//       company: b.companyName,
//       companyShortCode: b.companyId?.shortCode || b.companyName,
//       batchNumber: b.batchNumber,
//       expiryDate: b.expiryDate,
//       remainingUnits: b.totalStockQuantity,
//       mrp: b.mrp,
//       sellingRate: b.sellingRate,
//       offer: b.offer
//     }));

//     res.status(200).json({ success: true, data: formatted });
//   } catch (error) {
//     console.error('[getActiveOffers] error:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

/* ── Unified Route: Get Offers & Inventory ── */
exports.getOffersList = async (req, res) => {
  try {
    const { status = 'all', months = '6' } = req.query;
    const now = new Date();
    
    let matchQuery = { totalStockQuantity: { $gt: 0 } };

    if (months !== 'all') {
      const thresholdDate = new Date();
      thresholdDate.setMonth(thresholdDate.getMonth() + parseInt(months));
      matchQuery.expiryDate = { $lte: thresholdDate };
    }

    if (status === 'active') {
      matchQuery['offer.isActive'] = true;
      matchQuery['offer.startDate'] = { $lte: now };
    } 
    else if (status === 'inactive') {
      matchQuery.$or = [
        { 'offer.isActive': false, 'offer.description': { $ne: '' } }, 
        { 'offer.isActive': true, 'offer.startDate': { $gt: now } } 
      ];
    } 
    else if (status === 'no_offer') {
      matchQuery.$or = [
        { offer: { $exists: false } },
        { offer: null },
        { 'offer.description': '' },
        { 'offer.description': null }
      ];
    }

    // ✨ FIX: Added .populate('productId') to fetch images, descriptions, and categories
    // Inside getOffersList...
    const batches = await Batch.find(matchQuery)
      .populate('companyId', 'shortCode')
      .populate('productId') 
      .lean();

    const formatted = batches.map(b => {
      const prod = b.productId || {}; 
      return {
        id: b._id,
        productId: prod._id || b.productId,
        productName: prod.name || b.productName,
        company: b.companyName,
        companyShortCode: b.companyId?.shortCode || b.companyName,
        batchNumber: b.batchNumber,
        expiryDate: b.expiryDate,
        remainingUnits: b.totalStockQuantity,
        mrp: b.mrp,
        sellingRate: b.sellingRate,
        offer: b.offer?.description ? b.offer : null,
        
        photoUrl: (prod.images && prod.images.length > 0) ? prod.images[0] : (prod.photoUrl || ''),
        images: prod.images || [],
        packing: prod.packing,
        type: prod.type,
        categories: prod.categories || [],      
        compositions: prod.compositions || [],  
        hsnCode: prod.hsnCode,                  
        gstRate: prod.gstRate,
        description: prod.description,
        usageTips: prod.usageTips,

        // ✨ ADDED: Now the Offers page won't have the math bug either!
        totalStock: prod.totalStock || 0,
        shortExpiryThreshold: prod.shortExpiryThreshold || 90,
        lowStockThreshold: prod.lowStockThreshold || 50,
        criticalStockThresholdPercent: prod.criticalStockThresholdPercent || 50,
      };
    });

    formatted.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error('[getOffersList] error:', error);
    res.status(500).json({ message: error.message });
  }
};

/* ── Update / Delete Batch Offer ── */
exports.updateBatchOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { offer, action, notifyClients } = req.body; // ✨ Catch notifyClients

    const batch = await Batch.findById(id);
    if (!batch) return res.status(404).json({ message: 'Batch not found.' });

    // TRUE DELETE: Wipes the offer from DB
    if (action === 'delete') {
      const wipedBatch = await Batch.findByIdAndUpdate(id, { $unset: { offer: "" } }, { new: true });
      return res.status(200).json({ message: 'Offer deleted successfully', data: wipedBatch });
    }

    if (offer) {
      if (batch.totalStockQuantity <= 0) return res.status(400).json({ message: 'Cannot create an offer on an out-of-stock batch.' });
      if (batch.expiryDate < new Date() && offer.isActive) return res.status(400).json({ message: 'Cannot activate an offer on an expired batch.' });

      if (offer.startDate && offer.endDate && new Date(offer.endDate) <= new Date(offer.startDate)) {
        return res.status(400).json({ message: 'Offer End Date must be after the Start Date.' });
      }
      if (offer.endDate && new Date(offer.endDate) > batch.expiryDate) {
        return res.status(400).json({ message: 'Offer cannot outlive the medicine\'s expiry date.' });
      }

      // Enforce Once-Per-Day Toggle Limit
      if (batch.offer && batch.offer.isActive !== offer.isActive) {
        if (batch.offer.lastToggleDate) {
          const lastToggle = new Date(batch.offer.lastToggleDate);
          const today = new Date();
          if (lastToggle.toDateString() === today.toDateString()) {
            return res.status(400).json({ 
              message: `The offer for batch ${batch.batchNumber} was already toggled today. Limit: 1 toggle/day per batch.` 
            });
          }
        }
        offer.lastToggleDate = new Date();
      } else if (batch.offer && batch.offer.lastToggleDate) {
        offer.lastToggleDate = batch.offer.lastToggleDate;
      }
    }

    const updatedBatch = await Batch.findByIdAndUpdate(id, { $set: { offer: offer } }, { new: true, runValidators: true });

    // ✨ NEW: Broadcast Notification to all active clients
    // ✨ NEW: Broadcast Notification to all active clients
    if (notifyClients && offer.isActive) {
      // ✨ FIX: Look for both 'Active' and 'Approved' (case-insensitive)
      const activeClients = await Client.find({ 
        status: { $regex: /^(approved|active|Static|Credit Alert)$/i } 
      }).select('_id');
      
      const notifications = activeClients.map(client => ({
        recipientId: client._id,
        recipientRole: 'client',
        type: 'alert', // Broadcast scheme alert
        title: 'New Scheme Alert! 🏷️',
        message: `${batch.productName}: ${offer.description}`,
        link: '/client-dashboard/offers'
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    res.status(200).json({ message: 'Offer updated successfully', data: updatedBatch });
  } catch (error) {
    console.error('[updateBatchOffer] error:', error);
    res.status(500).json({ message: error.message });
  }
};