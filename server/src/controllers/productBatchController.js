// src/controllers/productBatchController.js
const Product = require('../models/Product');
const Batch = require('../models/Batch');

/* ── 1. Original: Get Products With Batches (Used for PDF Export & Catalog) ── */
exports.getProductsWithBatches = async (req, res) => {
  try {
    // ★ FIX: Populate companyId so we can grab the shortCode
    const products = await Product.find({}).populate('companyId', 'shortCode').lean();

    const enriched = await Promise.all(
      products.map(async (product) => {
        const batches = await Batch.find({ productId: product._id })
          .select('batchNumber mrp expiryDate totalStockQuantity')
          .lean();

        const batchList = batches.map(b => ({
          _id: b._id,
          no: b.batchNumber,
          mrp: b.mrp,
          expiry: b.expiryDate ? b.expiryDate.toISOString().split('T')[0] : '',
          stock: b.totalStockQuantity || 0,
        }));

        const firstBatch = batchList[0];
        const computedRate = firstBatch && firstBatch.mrp
          ? parseFloat((firstBatch.mrp * 0.8).toFixed(2))
          : 0;

        return {
          id: product._id,
          name: product.name,
          company: product.company,
          // ★ FIX: Safely grab shortCode, fallback to full name if missing
          companyShortCode: product.companyId ? product.companyId.shortCode : product.company,
          // ★ FIX: Add all the missing fields needed for the detail drawer
          categories: product.categories,
          description: product.description,
          usageTips: product.usageTips,
          type: product.type,
          compositions: product.compositions,
          packing: product.packing,
          hsn: product.hsnCode,
          gstRate: product.gstRate,
          defaultRate: computedRate,    
          batches: batchList,
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