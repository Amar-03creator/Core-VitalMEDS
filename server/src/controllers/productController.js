const Product = require('../models/Product');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

// ✨ CLOUDINARY CONFIG (Make sure to add these to your .env file and AWS variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ── Generate Cloudinary Signature (NEW) ────────────────────────────────── */
exports.getUploadSignature = (req, res) => {
  try {
    const timestamp = Math.round((new Date).getTime() / 1000);
    // Folder name setup kar rahe hain taaki saari images ek jagah organize rahein
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: 'vitalmeds_products' },
      process.env.CLOUDINARY_API_SECRET
    );
    
    res.status(200).json({
      timestamp,
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY
    });
  } catch (error) {
    console.error('[getUploadSignature] error:', error);
    res.status(500).json({ error: error.message });
  }
};

/* ── Create ──────────────────────────────────────────────────────────────── */
exports.createProduct = async (req, res) => {
  try {
    const {
      name, company, companyId,
      compositions, categories,
      type, packing, hsnCode, gstRate,
      shortExpiryThreshold, lowStockThreshold,
      description, usageTips,
      images // ✨ Extract images from body
    } = req.body;

    if (!name || !companyId || !type || !packing || !hsnCode || gstRate === undefined) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ message: 'Invalid companyId.' });
    }

    const trimmedName = name.trim();
    const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
      images: Array.isArray(images) ? images : [] // ✨ Save images
    });

    await newProduct.save();
    res.status(201).json({ message: 'Product created successfully!', data: newProduct });

  } catch (error) {
    console.error('[createProduct] error:', error);
    if (error.code === 11000) {
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

    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { hsnCode: { $regex: search, $options: 'i' } },
        { categories: { $regex: search, $options: 'i' } }
      ];
    }

    if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
      matchStage.companyId = new mongoose.Types.ObjectId(companyId);
    }
    if (category && category !== 'All') matchStage.categories = category;
    if (type && type !== 'All') matchStage.type = type;
    if (gstRate && gstRate !== 'All') matchStage.gstRate = Number(gstRate);

    const skip = (Number(page) - 1) * Number(limit);

    const pipeline = [
      { $match: matchStage },
      { $sort: { name: 1 } }, 
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: skip }, 
            { $limit: Number(limit) },
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }

    if (updateData.name) {
      const trimmedName = updateData.name.trim();
      const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      const exists = await Product.findOne({
        name: { $regex: `^${escapedName}$`, $options: 'i' },
        _id: { $ne: id } 
      });

      if (exists) {
        return res.status(409).json({ message: `"${exists.name}" already exists in the catalog.` });
      }
      updateData.name = trimmedName;
    }

    if (updateData.compositions && Array.isArray(updateData.compositions)) {
      updateData.compositions = updateData.compositions.filter(c => c?.trim());
    }

    // ✨ NEW: CLOUDINARY GARBAGE COLLECTOR
    // 1. Fetch the existing product BEFORE we update it to compare images
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // 2. Compare arrays. If the user deleted images, tell Cloudinary to safely destroy them!
    if (updateData.images && existingProduct.images) {
      // Map all the publicIds that were sent from the frontend
      const newPublicIds = updateData.images.map(img => img.publicId).filter(Boolean);
      
      // Find any old publicIds that are missing from the newly submitted list
      const imagesToDelete = existingProduct.images.filter(
        oldImg => oldImg.publicId && !newPublicIds.includes(oldImg.publicId)
      );

      // Securely wipe the orphaned images from Cloudinary storage
      for (const img of imagesToDelete) {
        try {
          await cloudinary.uploader.destroy(img.publicId);
          console.log(`Garbage Collector: Wiped orphaned image ${img.publicId} from Cloudinary`);
        } catch (cloudinaryErr) {
          console.error(`Failed to delete Cloudinary image ${img.publicId}:`, cloudinaryErr);
        }
      }
    }

    // 3. Save the new data to MongoDB
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: 'Product updated successfully!', data: updatedProduct });

  } catch (error) {
    console.error('[updateProduct] error:', error);
    res.status(500).json({ error: error.message });
  }
};