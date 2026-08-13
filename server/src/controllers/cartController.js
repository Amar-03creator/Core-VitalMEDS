const Cart = require('../models/Cart');
const Client = require('../models/Client');
const Product = require('../models/Product');
const Batch = require('../models/Batch');

/*
  FIX (issue #3 — "batches not populated"):
  Batch documents reference their Product via `productId` (Batch.productId
  -> Product). Product does NOT hold a `batches` array field, so the old
  `Product.find(...).populate('batches')` was populating a path that
  doesn't exist on the schema — it silently returned nothing useful (or,
  depending on your Mongoose strictPopulate setting, could throw). This
  version queries Batch directly and groups the results by productId
  instead, so it works regardless of what Product's schema looks like.

  Field names below (batchNumber, expiryDate, mrp, sellingRate,
  totalStockQuantity, offer, nearExpiry) match the real Batch schema.
  The previous version selected a field called `stock`, which doesn't
  exist on Batch (it's `totalStockQuantity`) — harmless no-op before,
  but wrong if you rely on it now, so it's fixed here too.
*/
const enrichCartItems = async (items) => {
  if (!items.length) return [];

  const productIds = items.map((i) => i.productId);

  const products = await Product.find({ _id: { $in: productIds } })
    .select('name company companyShortCode packing mrp defaultRate totalStock images offer')
    .lean();

  // Full batch list per product (for the batch selector, expiry, live stock, etc.)
  const allBatches = await Batch.find({ productId: { $in: productIds }, isActive: true })
    .select('productId batchNumber expiryDate mrp sellingRate totalStockQuantity offer nearExpiry')
    .lean();

  const batchesByProduct = new Map();
  allBatches.forEach((b) => {
    const key = b.productId.toString();
    if (!batchesByProduct.has(key)) batchesByProduct.set(key, []);
    batchesByProduct.get(key).push(b);
  });

  // A cart item can optionally pin one specific batch (offer items) — fetch those too
  const batchIds = items.filter((i) => i.batchId).map((i) => i.batchId);
  const pinnedBatches = batchIds.length
    ? await Batch.find({ _id: { $in: batchIds } })
        .select('batchNumber expiryDate mrp sellingRate totalStockQuantity offer')
        .lean()
    : [];

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  const pinnedBatchMap = new Map(pinnedBatches.map((b) => [b._id.toString(), b]));

  return items
    .map((item) => {
      const product = productMap.get(item.productId.toString());
      if (!product) return null; // product deleted/discontinued since it was added to the cart

      const specificBatch = item.batchId ? pinnedBatchMap.get(item.batchId.toString()) : null;
      const itemBatches = batchesByProduct.get(product._id.toString()) || [];

      // ✨ THE FIX: Safely derive MRP and Default Rate from the Batches!
      // 1. Try the specific pinned batch first (if it's an offer).
      // 2. Try the first active batch from the array (standard items).
      // 3. Fallback to product.mrp (legacy safety net).
      const safeMrp = specificBatch?.mrp || (itemBatches.length > 0 ? itemBatches[0].mrp : product.mrp) || 0;
      const safeDefaultRate = product.defaultRate || (itemBatches.length > 0 ? itemBatches[0].sellingRate : 0) || 0;

      return {
        productId: product._id,
        batchId: item.batchId || null,
        type: item.type,
        quantity: item.quantity,
        name: product.name,
        company: product.company,
        companyShortCode: product.companyShortCode || product.company,
        packing: product.packing,
        mrp: safeMrp, // 🚀 Fully Hydrated
        defaultRate: safeDefaultRate, // 🚀 Fully Hydrated
        totalStock: product.totalStock,
        images: product.images || [],
        batches: itemBatches,
        offer: specificBatch ? specificBatch.offer : product.offer || null,
        offerApplied: specificBatch ? !!specificBatch.offer : !!product.offer,
      };
    })
    .filter(Boolean);
};

// Helper to resolve the clientId from the authenticated user
const resolveClientId = async (user) => {
  // 1. Try the Cognito custom attribute
  if (user.clientId) return user.clientId;

  // 2. Fallback: look up by email (same logic as requireActiveClient)
  const client = await Client.findOne({
    'contacts.email': new RegExp(`^${user.email}$`, 'i')
  });
  if (!client) throw new Error('Client not found');

  return client._id;
};

// GET /api/cart
exports.getCart = async (req, res) => {
  try {
    const clientId = await resolveClientId(req.user);

    let cart = await Cart.findOne({ clientId }).lean();
    if (!cart) {
      return res.json({ success: true, data: { inquiryItems: [], orderItems: [] } });
    }

    const enriched = await enrichCartItems(cart.items);
    res.json({
      success: true,
      data: {
        inquiryItems: enriched.filter(i => i.type === 'inquiry'),
        orderItems: enriched.filter(i => i.type === 'order'),
      },
    });
  } catch (err) {
    console.error('getCart error:', err);
    res.status(err.message === 'Client not found' ? 404 : 500).json({ message: err.message });
  }
};

// PUT /api/cart
exports.syncCart = async (req, res) => {
  try {
    const clientId = await resolveClientId(req.user);
    let { items } = req.body;

    // Guard against null / undefined
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Invalid or missing items array.' });
    }

    // Filter out any bad entries silently (optional, but keeps cart clean)
    const validItems = items.filter(item =>
      item.productId && item.type && item.quantity && item.quantity >= 1 &&
      ['order', 'inquiry'].includes(item.type)
    );

    const cart = await Cart.findOneAndUpdate(
      { clientId },
      { $set: { items: validItems } },
      { upsert: true, new: true }
    ).lean();

    const enriched = await enrichCartItems(cart.items);
    res.json({
      success: true,
      data: {
        inquiryItems: enriched.filter(i => i.type === 'inquiry'),
        orderItems: enriched.filter(i => i.type === 'order'),
      },
    });
  } catch (err) {
    console.error('syncCart error:', err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/cart
exports.clearCart = async (req, res) => {
  try {
    const clientId = await resolveClientId(req.user);
    await Cart.findOneAndDelete({ clientId });
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) {
    console.error('clearCart error:', err);
    res.status(err.message === 'Client not found' ? 404 : 500).json({ message: err.message });
  }
};