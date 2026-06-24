// src/controllers/productBatchController.js
const Product = require('../models/Product');
const Batch = require('../models/Batch');

exports.getProductsWithBatches = async (req, res) => {
  try {
    const products = await Product.find({}).lean();

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

        // Compute default selling rate from the first batch’s MRP (80% of MRP).
        // If no batches exist, default to 0.
        const firstBatch = batchList[0];
        const computedRate = firstBatch && firstBatch.mrp
          ? parseFloat((firstBatch.mrp * 0.8).toFixed(2))
          : 0;

        return {
          id: product._id,
          name: product.name,
          company: product.company,
          packing: product.packing,
          hsn: product.hsnCode,
          gstRate: product.gstRate,
          defaultRate: computedRate,      // ← always a number now
          batches: batchList,
        };
      })
    );

    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};