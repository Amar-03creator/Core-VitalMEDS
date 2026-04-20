// 1. Import the blueprint (Model) we created earlier
const Company = require('../models/Company'); 

// 2. Export a function that handles the creation of a company
exports.createCompany = async (req, res) => {
    try {
        // 3. The data sent from the frontend/Postman lives inside the request 'body'.
        // Let's extract the companyName, shortCode, and gstin from it.
        const { companyName, 
            shortCode, 
            gstin, 
            drugLicense, 
            billingAddress, 
            leadTimeDays } = req.body; 

        // 4. Create a new memory instance of the Company
        const newCompany = new Company({
            companyName, 
            shortCode, 
            gstin, 
            drugLicense, 
            billingAddress, 
            leadTimeDays
        });

        // 5. Ask Mongoose to physically save this to MongoDB Atlas
        await newCompany.save();

        // 6. Send a success response back to the user with a 201 (Created) status code
        res.status(201).json({ 
            message: "Company created successfully!", 
            data: newCompany 
        });

    } catch (error) {
        // 7. If anything fails (like a missing required field), send a 500 (Server Error)
        res.status(500).json({ error: error.message });
    }
};

exports.getAllCompanies = async (req, res) => {
    try {
        // 1. Tell Mongoose to "find" every document inside the Company collection.
        // We use await because fetching from the cloud takes a few milliseconds.
        const companies = await Company.find(); 

        // 2. Send a 200 (OK) status and attach the array of companies to the response.
        res.status(200).json({
            success: true,
            count: companies.length,
            data: companies
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};