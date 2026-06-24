const Product = require('../models/Product');
const mongoose = require('mongoose');

/* ── Create ──────────────────────────────────────────────────────────────── */
/* ── Create ──────────────────────────────────────────────────────────────── */
exports.createProduct = async (req, res) => {
  try {
    const {
      name, company, companyId,
      compositions, categories,
      type, packing, hsnCode, gstRate,
      shortExpiryThreshold, lowStockThreshold,
      description, usageTips,
    } = req.body;

    // Required field check
    if (!name || !companyId || !type || !packing || !hsnCode || gstRate === undefined) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Validate companyId
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ message: 'Invalid companyId.' });
    }

    const trimmedName = name.trim();
    const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // ★ GLOBAL uniqueness check – no companyId filter
    const exists = await Product.findOne({
      name: { $regex: `^${escapedName}$`, $options: 'i' },
    });

    if (exists) {
      return res.status(409).json({
        message: `"${exists.name}" already exists in the catalog.`,
      });
    }

    const newProduct = new Product({
      name:      trimmedName,
      company:   company || '',
      companyId: new mongoose.Types.ObjectId(companyId),
      compositions: Array.isArray(compositions) ? compositions.filter(c => c?.trim()) : [],
      categories:   Array.isArray(categories)   ? categories                          : [],
      type, packing, hsnCode,
      gstRate:              parseFloat(gstRate),
      shortExpiryThreshold: shortExpiryThreshold ? parseInt(shortExpiryThreshold) : undefined,
      lowStockThreshold:    lowStockThreshold    ? parseInt(lowStockThreshold)    : undefined,
      description,
      usageTips,
    });

    await newProduct.save();
    res.status(201).json({ message: 'Product created successfully!', data: newProduct });

  } catch (error) {
    console.error('[createProduct] error:', error);
    if (error.code === 11000) {
      // Mongoose unique index violation – also global
      return res.status(409).json({ message: 'A product with this name already exists.' });
    }
    res.status(500).json({ error: error.message });
  }
};

/* ── Get all  OR  filter by companyId ───────────────────────────────────── */
exports.getAllProducts = async (req, res) => {
  try {
    const { companyId } = req.query;

    if (companyId && !mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ message: 'Invalid companyId.' });
    }

    const filter = companyId ? { companyId: new mongoose.Types.ObjectId(companyId) } : {};
    const products = await Product.find(filter).populate('companyId', 'companyName');

    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('[getAllProducts] error:', error);
    res.status(500).json({ error: error.message });
  }
};