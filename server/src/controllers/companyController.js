const Company = require('../models/Company');
const Client = require('../models/Client');

/* ── Format validators ─────────────────────────────────────── */
const isValidGSTIN = (v) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
const isValidPAN = (v) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
const isValidAadhaar = (v) => /^[2-9][0-9]{11}$/.test(v);
const isValidDL = (v) => /^[A-Za-z0-9\/\s\-]{5,30}$/.test(v);
const isValidEmail = (v) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
const isValidDrugsBazaarId = (v) => /^[A-Za-z0-9\-]{5,20}$/.test(v);
const isValidMobile = (v) => /^[6-9]\d{9}$/.test(v);
// ★ New bank validators
const isValidIFSC = (v) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v.toUpperCase());
const isValidAccountNumber = (v) => /^\d{9,18}$/.test(v);

/* ── Uniqueness helpers ──────────────────────────────────── */
const findOwnerOf = async (field, value, excludeId = null) => {
    const query = { [field]: { $regex: `^${value}$`, $options: 'i' } };
    if (excludeId) query._id = { $ne: excludeId };
    const company = await Company.findOne(query);
    if (company) return `Supplier "${company.companyName}"`;
    const clientFieldMap = { shortCode: 'shortCode', gstin: 'gstin', pan: 'pan', aadhaar: 'aadhaar' };
    const clientField = clientFieldMap[field];
    if (clientField) {
        const client = await Client.findOne({ [clientField]: { $regex: `^${value}$`, $options: 'i' } });
        if (client) return `Client "${client.establishmentName}"`;
    }
    return null;
};

const findPhoneOwner = async (phone) => {
    const normalised = phone.replace(/^\+91/, '').replace(/\D/g, '');
    const company = await Company.findOne({
        $or: [
            { whatsapp: normalised },
            { phone: normalised },
            { 'representatives.phone': normalised },
        ],
    });
    if (company) return `Supplier "${company.companyName}"`;
    const client = await Client.findOne({
        $or: [
            { phone: normalised },
            { whatsapp: normalised },
            { 'representatives.phone': normalised },
        ],
    });
    if (client) return `Client "${client.establishmentName}"`;
    return null;
};

/* ── createCompany ───────────────────────────────────────── */
exports.createCompany = async (req, res) => {
    try {
        const {
            companyName, shortCode, status,
            representatives,
            gstin, pan, drugLicenses, drugLicenseExpiry,
            email, whatsapp, phone,
            billingAddress, city, state, pincode,
            aadhaar, drugsBazaarId,
            leadTimeDays, minimumOrderValue,
            bankDetails,       // ★ new
        } = req.body;

        const errors = [];

        /* ── Format validation ─────────────────────────── */
        if (gstin && !isValidGSTIN(gstin)) errors.push('Invalid GSTIN format.');
        if (pan && !isValidPAN(pan)) errors.push('Invalid PAN format.');
        if (aadhaar && !isValidAadhaar(aadhaar)) errors.push('Invalid Aadhaar format.');
        if (drugsBazaarId && !isValidDrugsBazaarId(drugsBazaarId)) errors.push('Invalid DrugsBazaar ID format.');
        if (email && !isValidEmail(email)) errors.push('Invalid email format.');

        if (whatsapp) {
            const waNorm = whatsapp.replace(/^\+91/, '').replace(/\D/g, '');
            if (!isValidMobile(waNorm)) {
                errors.push('WhatsApp must be a valid 10-digit Indian mobile number (starts with 6–9).');
            }
        }

        if (drugLicenses && Array.isArray(drugLicenses)) {
            drugLicenses.forEach((lic, i) => {
                if (lic && !isValidDL(lic)) errors.push(`Drug Licence #${i + 1}: invalid format.`);
            });
        }

        if (!representatives || representatives.length === 0) {
            errors.push('At least one representative is required.');
        } else {
            representatives.forEach((rep, i) => {
                if (!rep.name || (!rep.phone && !rep.email)) {
                    errors.push(`Representative ${i + 1}: name and at least phone or email are required.`);
                }
            });
        }

        /* ── Bank details validation ────────────────────── */
        if (bankDetails && Array.isArray(bankDetails)) {
            bankDetails.forEach((b, i) => {
                const hasAny = b.bankName || b.accountNumber || b.ifscCode || b.branch;
                const hasAll = b.bankName && b.accountNumber && b.ifscCode && b.branch;
                if (hasAny && !hasAll) {
                    errors.push(`Bank #${i + 1}: all fields (Name, Account No., IFSC, Branch) are required when adding a bank.`);
                } else if (hasAll) {
                    if (!isValidAccountNumber(b.accountNumber)) {
                        errors.push(`Bank #${i + 1}: account number must be 9-18 digits.`);
                    }
                    if (!isValidIFSC(b.ifscCode)) {
                        errors.push(`Bank #${i + 1}: invalid IFSC code (e.g., SBIN0001234).`);
                    }
                }
            });
        }

        if (errors.length > 0) {
            return res.status(400).json({ message: errors.join(' ') });
        }

        /* ── Uniqueness checks ────────────────────────── */
        const uniqueChecks = [];
        if (gstin) uniqueChecks.push(findOwnerOf('gstin', gstin, null).then(o => o && `GSTIN already registered with ${o}.`));
        if (pan) uniqueChecks.push(findOwnerOf('pan', pan, null).then(o => o && `PAN already registered with ${o}.`));
        if (aadhaar) uniqueChecks.push(findOwnerOf('aadhaar', aadhaar, null).then(o => o && `Aadhaar already registered with ${o}.`));
        if (shortCode) uniqueChecks.push(findOwnerOf('shortCode', shortCode, null).then(o => o && `Short Code already registered with ${o}.`));
        if (drugsBazaarId) uniqueChecks.push(findOwnerOf('drugsBazaarId', drugsBazaarId, null).then(o => o && `DrugsBazaar ID already registered with ${o}.`));

        if (whatsapp) {
            uniqueChecks.push(
                findPhoneOwner(whatsapp).then(o => o && `WhatsApp number already registered with ${o}.`)
            );
        }

        if (drugLicenses && Array.isArray(drugLicenses)) {
            drugLicenses.forEach((lic, i) => {
                if (!lic) return;
                uniqueChecks.push(
                    Company.findOne({ drugLicenses: lic }).then(c => {
                        if (c) return `Drug Licence #${i + 1} already registered with Supplier "${c.companyName}".`;
                        return Client.findOne({ $or: [{ drugLicense20B: lic }, { drugLicense21B: lic }] }).then(cl => {
                            if (cl) return `Drug Licence #${i + 1} already registered with Client "${cl.establishmentName}".`;
                            return null;
                        });
                    })
                );
            });
        }

        const dupeMessages = (await Promise.all(uniqueChecks)).filter(Boolean);
        if (dupeMessages.length > 0) {
            return res.status(409).json({ message: dupeMessages.join(' ') });
        }

        /* ── Normalise & save ─────────────────────────── */
        const strip91 = (num) => (num ? num.replace(/^\+91/, '').replace(/\D/g, '') : undefined);

        const newCompany = new Company({
            companyName, shortCode, status,
            representatives: representatives.map(rep => ({
                ...rep,
                phone: strip91(rep.phone),
            })),
            gstin, pan,
            drugLicenses: (drugLicenses || []).filter(l => l?.trim()),
            drugLicenseExpiry: drugLicenseExpiry ? new Date(drugLicenseExpiry) : undefined,
            email,
            whatsapp: strip91(whatsapp),
            phone: strip91(phone) || strip91(representatives[0]?.phone),
            billingAddress, city, state, pincode,
            aadhaar, drugsBazaarId,
            leadTimeDays: leadTimeDays ? parseInt(leadTimeDays) : undefined,
            minimumOrderValue: minimumOrderValue ? parseFloat(minimumOrderValue) : undefined,
            // ★ Only save complete & valid bank entries
            bankDetails: (bankDetails || []).filter(b => b.bankName && b.accountNumber && b.ifscCode && b.branch),
        });

        await newCompany.save();
        res.status(201).json({ message: 'Company created successfully!', data: newCompany });

    } catch (error) {
        console.error('createCompany error:', error);
        res.status(500).json({ error: error.message });
    }
};

/* ── getAllCompanies ──────────────────────────────────────── */
exports.getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.find();
        res.status(200).json({ success: true, count: companies.length, data: companies });
    } catch (error) {
        console.error('getAllCompanies error:', error);
        res.status(500).json({ error: error.message });
    }
};