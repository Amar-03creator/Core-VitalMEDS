// server/src/controllers/stockController.js
const Product = require('../models/Product');
const { computeStockTier } = require('../helpers/stockTier');

/* ── POST /api/stock/check-availability ───────────────────────────────
 * body: { items: [{ productId, requestedQty }] }
 *
 * Called by the Cart/Inquiry review list every time a quantity changes,
 * and again as a final guard right before /api/inquiries or /api/orders
 * is hit. Returns a tier + message per item — never a raw stock number
 * unless the tier is 'critical' (where disclosure is explicitly allowed).
 *
 * NOTE: this reads Product.totalStock directly. If totalStock in your
 * project isn't kept live-synced with the Batch collection, swap the
 * `Product.find` below for an aggregation over Batch instead — the tier
 * logic itself (stockTier.js) doesn't care where the number comes from.
 */
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
    const byId = new Map(products.map((p) => [String(p._id), p]));

    const results = items.map(({ productId, requestedQty }) => {
      const product = byId.get(String(productId));
      if (!product) {
        return { productId, tier: 'unavailable', availableQty: null, message: 'Product not found.' };
      }

      const { tier, availableQty, message } = computeStockTier({
        requestedQty,
        currentStock: product.totalStock,
        lowStockThreshold: product.lowStockThreshold,
        criticalThresholdPercent: product.criticalStockThresholdPercent,
      });

      return {
        productId,
        productName: product.name,
        tier,
        availableQty, // populated only for 'critical' — enforced inside the helper
        message: message ? `${product.name} ${message}` : null,
      };
    });

    res.json({ success: true, data: results });
  } catch (err) {
    console.error('checkAvailability error:', err);
    res.status(500).json({ message: err.message });
  }
};