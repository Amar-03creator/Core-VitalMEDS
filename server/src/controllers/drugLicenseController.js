const Company = require('../models/Company');
const Client = require('../models/Client');

exports.checkDrugLicense = async (req, res) => {
  try {
    const license = req.query.license;
    if (!license) return res.status(400).json({ message: 'License number is required' });

    const result = { exists: false, owner: null };

    // Check in companies (suppliers)
    const company = await Company.findOne({ drugLicenses: license });
    if (company) {
      result.exists = true;
      result.owner = {
        type: 'Supplier',
        name: company.companyName,
        city: company.city,
        state: company.state,
      };
      return res.status(200).json(result);
    }

    // Check in clients
    const client = await Client.findOne({
      $or: [
        { drugLicense20B: license },
        { drugLicense21B: license },
      ],
    });
    if (client) {
      result.exists = true;
      result.owner = {
        type: 'Client',
        name: client.establishmentName,
        city: client.city,
        state: '',
      };
      return res.status(200).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};