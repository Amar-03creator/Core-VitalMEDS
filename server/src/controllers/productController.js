// 1. Import the Product model blueprint
const Product = require('../models/Product'); // Hint: The exact name of your model file

// --- CREATE PRODUCT (POST) ---
exports.createProduct = async (req, res) => {
  try {
    // 1. Extract ALL the mandatory fields you set in the schema
    const {
      name,
      company,
      companyId,
      composition,
      category,
      type,
      packing,
      hsnCode,
      sku,
      gstRate,
      // If you want to let him override the defaults at creation, extract these too:
      shortExpiryThreshold,
      lowStockThreshold
    } = req.body;

    // 2. Map them all into the new Product memory instance
    const newProduct = new Product({
      name,
      company,
      companyId,
      composition,
      category,
      type,
      packing,
      hsnCode,
      sku,
      gstRate,
      // 3. Only pass these if the frontend actually sent them. 
      // If they are undefined, Mongoose will safely use the defaults (90 and 50)!
      shortExpiryThreshold,
      lowStockThreshold
    });

    // 4. Save it physically to MongoDB Atlas
    await newProduct.save(); // Hint: Mongoose command to save

    // 5. Send success response
    res.status(201).json({
      message: "Medicine added to the catalog!",
      data: newProduct
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- GET ALL PRODUCTS (GET) ---
exports.getAllProducts = async (req, res) => {
  try {
    // Fetch all products from the database
    const products = await Product.find();

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};