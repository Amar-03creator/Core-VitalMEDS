const Company = require('../models/Company');
const Client = require('../models/Client');
const PurchaseBill = require('../models/PurchaseBill');
const DebitNote = require('../models/DebitNote');

/* ── Format validators ─────────────────────────────────────── */
const isValidGSTIN = (v) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
const isValidPAN = (v) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
const isValidAadhaar = (v) => /^[2-9][0-9]{11}$/.test(v);
const isValidDL = (v) => /^[A-Za-z0-9\/\s\-]{5,30}$/.test(v);
const isValidEmail = (v) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
const isValidDrugsBazaarId = (v) => /^[A-Za-z0-9\-]{5,20}$/.test(v);
const isValidMobile = (v) => /^[6-9]\d{9}$/.test(v);
const isValidIFSC = (v) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v.toUpperCase());
const isValidAccountNumber = (v) => /^\d{9,18}$/.test(v);

/* ── Uniqueness helpers ──────────────────────────────────── */
// excludeId lets edit-mode checks ignore the record being edited.
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

const findPhoneOwner = async (phone, excludeId = null) => {
    const normalised = phone.replace(/^\+91/, '').replace(/\D/g, '');
    const companyQuery = {
        $or: [
            { whatsapp: normalised },
            { phone: normalised },
            { 'representatives.phone': normalised },
        ],
    };
    if (excludeId) companyQuery._id = { $ne: excludeId };
    const company = await Company.findOne(companyQuery);
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

const strip91 = (num) => (num ? num.replace(/^\+91/, '').replace(/\D/g, '') : undefined);

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
            bankDetails,
        } = req.body;

        const errors = [];

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

        if (bankDetails && Array.isArray(bankDetails)) {
            bankDetails.forEach((b, i) => {
                const hasAny = b.bankName || b.accountNumber || b.ifscCode || b.branch;
                const hasAll = b.bankName && b.accountNumber && b.ifscCode && b.branch;
                if (hasAny && !hasAll) {
                    errors.push(`Bank #${i + 1}: all fields (Name, Account No., IFSC, Branch) are required when adding a bank.`);
                } else if (hasAll) {
                    if (!isValidAccountNumber(b.accountNumber)) errors.push(`Bank #${i + 1}: account number must be 9-18 digits.`);
                    if (!isValidIFSC(b.ifscCode)) errors.push(`Bank #${i + 1}: invalid IFSC code (e.g., SBIN0001234).`);
                }
            });
        }

        if (errors.length > 0) {
            return res.status(400).json({ message: errors.join(' ') });
        }

        const uniqueChecks = [];
        if (gstin) uniqueChecks.push(findOwnerOf('gstin', gstin, null).then(o => o && `GSTIN already registered with ${o}.`));
        if (pan) uniqueChecks.push(findOwnerOf('pan', pan, null).then(o => o && `PAN already registered with ${o}.`));
        if (aadhaar) uniqueChecks.push(findOwnerOf('aadhaar', aadhaar, null).then(o => o && `Aadhaar already registered with ${o}.`));
        if (shortCode) uniqueChecks.push(findOwnerOf('shortCode', shortCode, null).then(o => o && `Short Code already registered with ${o}.`));
        if (drugsBazaarId) uniqueChecks.push(findOwnerOf('drugsBazaarId', drugsBazaarId, null).then(o => o && `DrugsBazaar ID already registered with ${o}.`));

        if (whatsapp) {
            uniqueChecks.push(findPhoneOwner(whatsapp, null).then(o => o && `WhatsApp number already registered with ${o}.`));
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

        const newCompany = new Company({
            companyName, shortCode, status,
            representatives: representatives.map(rep => ({ ...rep, phone: strip91(rep.phone) })),
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
            bankDetails: (bankDetails || []).filter(b => b.bankName && b.accountNumber && b.ifscCode && b.branch),
        });

        await newCompany.save();
        res.status(201).json({ message: 'Company created successfully!', data: newCompany });
    } catch (error) {
        console.error('createCompany error:', error);
        res.status(500).json({ error: error.message });
    }
};

/* ── getAllCompanies ──────────────────────────────────────────
   ★ UPDATED: now also returns lightweight per-company stats
   (pendingRefunds total comes straight off the Company doc;
   outstanding-to-supplier is computed ON THE FLY as
   (netAmount - paidAmount) per bill, NOT read from the stored
   dueAmount field — createPurchaseBill never initializes that
   field, so trusting it directly would always return 0. See the
   comment on recordPurchasePayment for the full explanation.)   */
exports.getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.find().sort({ companyName: 1 }).lean();

        const outstandingAgg = await PurchaseBill.aggregate([
            { $match: { isCancelled: { $ne: true }, paymentStatus: { $ne: 'PAID' } } },
            {
                $project: {
                    supplierId: 1,
                    amountDue: { $max: [{ $subtract: ['$netAmount', { $ifNull: ['$paidAmount', 0] }] }, 0] },
                },
            },
            { $match: { amountDue: { $gt: 0 } } },
            { $group: { _id: '$supplierId', totalDue: { $sum: '$amountDue' }, billCount: { $sum: 1 } } },
        ]);
        const outstandingMap = new Map(outstandingAgg.map(o => [String(o._id), o]));

        const data = companies.map(c => ({
            ...c,
            outstandingToSupplier: outstandingMap.get(String(c._id))?.totalDue || 0,
            unpaidBillCount: outstandingMap.get(String(c._id))?.billCount || 0,
        }));

        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        console.error('getAllCompanies error:', error);
        res.status(500).json({ error: error.message });
    }
};

/* ── getCompanyById ───────────────────────────────────────── ★ NEW
   Same on-the-fly due-amount computation as getAllCompanies — see
   the comment there for why we don't trust the stored dueAmount field. */
exports.getCompanyById = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id).lean();
        if (!company) return res.status(404).json({ message: 'Company not found.' });

        const [outstanding, pendingDebitNotes] = await Promise.all([
            PurchaseBill.aggregate([
                { $match: { supplierId: company._id, isCancelled: { $ne: true }, paymentStatus: { $ne: 'PAID' } } },
                {
                    $project: {
                        amountDue: { $max: [{ $subtract: ['$netAmount', { $ifNull: ['$paidAmount', 0] }] }, 0] },
                    },
                },
                { $match: { amountDue: { $gt: 0 } } },
                { $group: { _id: null, totalDue: { $sum: '$amountDue' }, billCount: { $sum: 1 } } },
            ]),
            DebitNote.countDocuments({ supplierId: company._id, status: 'Pending Adjustment' }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                ...company,
                outstandingToSupplier: outstanding[0]?.totalDue || 0,
                unpaidBillCount: outstanding[0]?.billCount || 0,
                pendingDebitNoteCount: pendingDebitNotes,
            },
        });
    } catch (error) {
        console.error('getCompanyById error:', error);
        res.status(500).json({ error: error.message });
    }
};

/* ── updateCompany ───────────────────────────────────────── ★ NEW
   Same validation + uniqueness logic as createCompany, but every
   uniqueness check excludes this company's own _id.               */
exports.updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await Company.findById(id);
        if (!existing) return res.status(404).json({ message: 'Company not found.' });

        const {
            companyName, shortCode, status,
            representatives,
            gstin, pan, drugLicenses, drugLicenseExpiry,
            email, whatsapp, phone,
            billingAddress, city, state, pincode,
            aadhaar, drugsBazaarId,
            leadTimeDays, minimumOrderValue,
            bankDetails,
        } = req.body;

        const errors = [];

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

        if (bankDetails && Array.isArray(bankDetails)) {
            bankDetails.forEach((b, i) => {
                const hasAny = b.bankName || b.accountNumber || b.ifscCode || b.branch;
                const hasAll = b.bankName && b.accountNumber && b.ifscCode && b.branch;
                if (hasAny && !hasAll) {
                    errors.push(`Bank #${i + 1}: all fields (Name, Account No., IFSC, Branch) are required when adding a bank.`);
                } else if (hasAll) {
                    if (!isValidAccountNumber(b.accountNumber)) errors.push(`Bank #${i + 1}: account number must be 9-18 digits.`);
                    if (!isValidIFSC(b.ifscCode)) errors.push(`Bank #${i + 1}: invalid IFSC code (e.g., SBIN0001234).`);
                }
            });
        }

        if (errors.length > 0) {
            return res.status(400).json({ message: errors.join(' ') });
        }

        const uniqueChecks = [];
        if (gstin) uniqueChecks.push(findOwnerOf('gstin', gstin, id).then(o => o && `GSTIN already registered with ${o}.`));
        if (pan) uniqueChecks.push(findOwnerOf('pan', pan, id).then(o => o && `PAN already registered with ${o}.`));
        if (aadhaar) uniqueChecks.push(findOwnerOf('aadhaar', aadhaar, id).then(o => o && `Aadhaar already registered with ${o}.`));
        if (shortCode) uniqueChecks.push(findOwnerOf('shortCode', shortCode, id).then(o => o && `Short Code already registered with ${o}.`));
        if (drugsBazaarId) uniqueChecks.push(findOwnerOf('drugsBazaarId', drugsBazaarId, id).then(o => o && `DrugsBazaar ID already registered with ${o}.`));
        if (whatsapp) uniqueChecks.push(findPhoneOwner(whatsapp, id).then(o => o && `WhatsApp number already registered with ${o}.`));

        if (drugLicenses && Array.isArray(drugLicenses)) {
            drugLicenses.forEach((lic, i) => {
                if (!lic) return;
                uniqueChecks.push(
                    Company.findOne({ drugLicenses: lic, _id: { $ne: id } }).then(c => {
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

        existing.companyName = companyName;
        existing.shortCode = shortCode;
        if (status) existing.status = status; // status toggle has its own dedicated endpoint, but allow it here too
        existing.representatives = representatives.map(rep => ({ ...rep, phone: strip91(rep.phone) }));
        existing.gstin = gstin;
        existing.pan = pan;
        existing.drugLicenses = (drugLicenses || []).filter(l => l?.trim());
        existing.drugLicenseExpiry = drugLicenseExpiry ? new Date(drugLicenseExpiry) : undefined;
        existing.email = email;
        existing.whatsapp = strip91(whatsapp);
        existing.phone = strip91(phone) || strip91(representatives[0]?.phone);
        existing.billingAddress = billingAddress;
        existing.city = city;
        existing.state = state;
        existing.pincode = pincode;
        existing.aadhaar = aadhaar;
        existing.drugsBazaarId = drugsBazaarId;
        existing.leadTimeDays = leadTimeDays ? parseInt(leadTimeDays) : undefined;
        existing.minimumOrderValue = minimumOrderValue ? parseFloat(minimumOrderValue) : undefined;
        existing.bankDetails = (bankDetails || []).filter(b => b.bankName && b.accountNumber && b.ifscCode && b.branch);

        await existing.save();
        res.status(200).json({ message: 'Company updated successfully!', data: existing });
    } catch (error) {
        console.error('updateCompany error:', error);
        res.status(500).json({ error: error.message });
    }
};

/* ── toggleCompanyStatus ──────────────────────────────────── ★ NEW
   Dedicated lightweight endpoint for the Active/Inactive switch
   so the UI doesn't need to resend the whole company payload.     */
exports.toggleCompanyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const company = await Company.findById(id);
        if (!company) return res.status(404).json({ message: 'Company not found.' });

        company.status = company.status === 'Active' ? 'Inactive' : 'Active';
        await company.save();

        res.status(200).json({ message: `Company marked ${company.status}.`, data: company });
    } catch (error) {
        console.error('toggleCompanyStatus error:', error);
        res.status(500).json({ error: error.message });
    }
};