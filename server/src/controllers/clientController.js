const Client = require('../models/Client');

exports.registerClient = async (req, res) => {
  try {
    const {
      establishmentName, businessType, clientId,
      contacts, billingAddress, shippingAddress, city, pincode,
      gstin, panNumber, drugLicense20B, drugLicense21B
    } = req.body;

    const newClient = new Client({
      establishmentName, businessType, clientId,
      contacts, billingAddress, shippingAddress, city, pincode,
      gstin, panNumber, drugLicense20B, drugLicense21B
    });

    await newClient.save();

    res.status(201).json({
      message: "Client registered successfully!",
      data: newClient
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "A client with this Customer ID already exists." });
    }
    res.status(400).json({ message: error.message });
  }
};

exports.getAllClients = async (req, res) => {
  try {
    const clients = await Client.find();
    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Client not found." });
    }
    res.status(200).json({ data: client });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};