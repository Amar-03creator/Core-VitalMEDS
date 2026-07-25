/* 
 * ============================================================================
 * 🛒 BACKEND CART VALIDATION (BATCH-SPECIFIC + SOFT ALLOCATION)
 * ============================================================================
 * - Prevents the "Global Stock Loophole". 
 * - Incorporates "Soft Allocation" (subtracting pending un-invoiced orders).
 * - Fenced Stock rule applied: Offer batches are subtracted from normal pools.
 * ============================================================================
 */

const Product = require('../models/Product');
const Batch = require('../models/Batch'); 
const Order = require('../models/Order'); // Required for Soft Allocation
const { computeStockTier } = require('../helpers/stockTier');

exports.checkAvailability = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items array is required.' });
    }

    const productIds = items.map((i) => i.productId);

    const products = await Product.find({ _id: { $in: productIds } }).select(
      'name totalStock lowStockThreshold criticalStockThresholdPercent'
    );
    const allBatches = await Batch.find({ productId: { $in: productIds } }).select(
      'productId totalStockQuantity offer'
    );

    // ✨ Fetch live pending orders to perform Soft Allocation
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

    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const results = items.map(({ productId, batchId, requestedQty }) => {
      const product = productMap.get(String(productId));
      if (!product) {
        return { productId, tier: 'unavailable', availableQty: null, message: 'Product not found.' };
      }

      const productBatches = allBatches.filter(b => String(b.productId) === String(productId));
      let stockToCheck = 0;

      if (batchId) {
        // ✨ OFFER ITEM: Check strictly against this specific batch's VIRTUAL stock
        const specificBatch = productBatches.find((b) => String(b._id) === String(batchId));
        if (specificBatch) {
            const reservedInBatch = batchAllocations[String(batchId)] || 0;
            stockToCheck = Math.max(0, (specificBatch.totalStockQuantity || 0) - reservedInBatch);
        }
      } else {
        // ✨ NORMAL ITEM: Exclude all active offer batches from the VIRTUAL total pool
        let lockedOfferStock = 0;
        productBatches.forEach(b => {
            if (b.offer && b.offer.isActive) {
                // Calculate the virtual stock of the offer batch
                const reservedInBatch = batchAllocations[String(b._id)] || 0;
                lockedOfferStock += Math.max(0, (b.totalStockQuantity || 0) - reservedInBatch);
            }
        });
        
        // Calculate the virtual global stock
        const totalReservedForProduct = globalAllocations[String(productId)] || 0;
        const virtualTotalStock = Math.max(0, product.totalStock - totalReservedForProduct);
        
        // Subtract the fenced offer stock from the global virtual pool
        stockToCheck = Math.max(0, virtualTotalStock - lockedOfferStock);
      }

      const { tier, availableQty, message } = computeStockTier({
        requestedQty,
        currentStock: stockToCheck,
        lowStockThreshold: product.lowStockThreshold,
        criticalThresholdPercent: product.criticalStockThresholdPercent,
      });

      return {
        productId,
        productName: product.name,
        tier,
        availableQty, 
        message: message ? `${product.name} ${message}` : null,
      };
    });

    res.json({ success: true, data: results });
  } catch (err) {
    console.error('checkAvailability error:', err);
    res.status(500).json({ message: err.message });
  }
};