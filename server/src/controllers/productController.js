const Product = require('../models/Product');
const mongoose = require('mongoose');

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
    const { search, companyId, category, type, gstRate, page = 1, limit = 10 } = req.query;

    const matchStage = {};

    // Free-text search across multiple fields
    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { hsnCode: { $regex: search, $options: 'i' } },
        { categories: { $regex: search, $options: 'i' } }
      ];
    }

    // Exact matches for filters
    if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
      matchStage.companyId = new mongoose.Types.ObjectId(companyId);
    }
    if (category && category !== 'All') matchStage.categories = category;
    if (type && type !== 'All') matchStage.type = type;
    if (gstRate && gstRate !== 'All') matchStage.gstRate = Number(gstRate);

    const skip = (Number(page) - 1) * Number(limit);

    // Aggregation pipeline for clean pagination and A-Z sorting
    const pipeline = [
      { $match: matchStage },
      { $sort: { name: 1 } }, // Always sort A-Z as requested
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: skip }, 
            { $limit: Number(limit) },
            // Populate company details if needed for UI
            { $lookup: { from: 'companies', localField: 'companyId', foreignField: '_id', as: 'companyDetails' } }
          ]
        }
      }
    ];

    const results = await Product.aggregate(pipeline);
    const products = results[0].data;
    const totalCount = results[0].metadata[0]?.total || 0;

    res.status(200).json({
      success: true,
      count: products.length,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
      data: products
    });
  } catch (error) {
    console.error('[getAllProducts] error:', error);
    res.status(500).json({ error: error.message });
  }
};

/* ── Update Product ─────────────────────────────────────────────────────── */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }

    // Optional: If they are trying to change the name, ensure the new name isn't taken by another product
    if (updateData.name) {
      const trimmedName = updateData.name.trim();
      const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      const exists = await Product.findOne({
        name: { $regex: `^${escapedName}$`, $options: 'i' },
        _id: { $ne: id } // Exclude the current product from the duplicate check
      });

      if (exists) {
        return res.status(409).json({ message: `"${exists.name}" already exists in the catalog.` });
      }
      updateData.name = trimmedName;
    }

    // Format fields just like in createProduct
    if (updateData.compositions && Array.isArray(updateData.compositions)) {
      updateData.compositions = updateData.compositions.filter(c => c?.trim());
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.status(200).json({ message: 'Product updated successfully!', data: updatedProduct });

  } catch (error) {
    console.error('[updateProduct] error:', error);
    res.status(500).json({ error: error.message });
  }
};