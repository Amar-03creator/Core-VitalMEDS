const Client = require('../models/Client');
const getNextClientCode = require('../helpers/nextClientCode');
exports.registerClient = async (req, res) => {
  try {
    const {
      establishmentName, businessType,
      contacts, billingAddress, shippingAddress, city, pincode,
      gstin, panNumber, drugLicense20B, drugLicense21B
    } = req.body;

    const clientId = await getNextClientCode();

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

exports.getClientFilterOptions = async (req, res) => {
  try {
    const { line, city } = req.query;

    const lines = await Client.distinct('line', { line: { $nin: [null, ''] } });
    const cities = await Client.distinct('city', { city: { $nin: [null, ''] } });

    // Resolves which City a given Line belongs to
    let cityForLine = null;
    if (line) {
      const sample = await Client.findOne({ line, city: { $nin: [null, ''] } }, 'city');
      cityForLine = sample?.city || null;
    }

    const partyFilter = {};
    if (line) partyFilter.line = line;
    if (city) partyFilter.city = city;
    const parties = await Client.find(partyFilter, 'establishmentName city line _id')
      .sort({ establishmentName: 1 });

    res.status(200).json({
      success: true,
      lines: lines.sort(),
      cities: cities.sort(),
      cityForLine,
      parties,
    });
  } catch (error) {
    console.error('getClientFilterOptions error:', error);
    res.status(500).json({ message: error.message });
  }
};