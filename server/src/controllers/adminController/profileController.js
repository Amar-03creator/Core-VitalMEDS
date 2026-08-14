// server/src/controllers/admin/profileController.js
const { findSelfAdmin, isWithinGracePeriod, cognito } = require('./adminUtils');
const { sendMail } = require('../../utils/mailer');
const Admin = require('../../models/Admin');
const Client = require('../../models/Client'); // ✨ NEW: Needed for broadcasting
const Notification = require('../../models/Notification'); // ✨ NEW: Needed for broadcasting

// ✨ THE UPGRADED GLOBAL BROADCAST HELPER WITH RADAR
const broadcastToClients = async (title, message) => {
  try {
    console.log("\n================================================");
    console.log("🚨 BROADCAST RADAR: INITIATED");
    
    // 1. Remove the strict 'Active' filter temporarily to see if clients exist at all
    const activeClients = await Client.find({}, '_id status');
    console.log(`-> Found ${activeClients.length} total clients in the database.`);
    
    if (activeClients.length > 0) {
        console.log(`-> Example Client Status in DB: "${activeClients[0].status || 'No Status Field'}"`);
    }

    if (activeClients.length === 0) {
        console.log("❌ ABORTING: No clients found to notify!");
        console.log("================================================\n");
        return;
    }

    const notifications = activeClients.map(client => ({
      recipientId: client._id,
      recipientRole: 'client',
      type: 'alert',
      title: title,
      message: message
    }));

    const result = await Notification.insertMany(notifications);
    console.log(`✅ SUCCESS: Created ${result.length} notifications in the DB!`);
    console.log("================================================\n");

  } catch (err) {
    console.error('🚨 BROADCAST RADAR CRASH:', err);
  }
};

const archiveStaff = (admin, role, personObj, reason) => {
  if (!personObj || !personObj.emails || personObj.emails.length === 0) return;
  
  if (!admin.staffHistory) admin.staffHistory = [];
  
  admin.staffHistory.push({
    role: role,
    name: personObj.name,
    emails: personObj.emails,
    phones: personObj.phones,
    joinedAt: personObj.legalIdsAddedAt,
    leftAt: new Date(),
    reason: reason
  });
};

exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await findSelfAdmin(req);
    if (!admin) return res.status(404).json({ message: 'Admin profile not found.' });

    const loginEmail = req.user.email.toLowerCase();
    const propEmail = admin.proprietor?.emails?.[0]?.toLowerCase();
    const cpEmail = admin.competentPerson?.emails?.[0]?.toLowerCase();

    let sessionRole = 'UNAUTHORIZED';
    if (admin.isProprietorAlsoCP && loginEmail === propEmail) {
      sessionRole = 'DUAL_OWNER';
    } else if (loginEmail === propEmail) {
      sessionRole = 'PROPRIETOR';
    } else if (loginEmail === cpEmail) {
      sessionRole = 'COMPETENT_PERSON';
    } else if (loginEmail === admin.email.toLowerCase()) {
      sessionRole = 'SYSTEM_ADMIN';
    }

    if (sessionRole === 'COMPETENT_PERSON' && admin.competentPerson && !admin.competentPerson.hasClaimedAccount) {
      admin.competentPerson.hasClaimedAccount = true;
      await admin.save();
    }

    const payload = admin.toObject();
    payload.sessionRole = sessionRole;
    payload.isBusinessVaultLocked = !isWithinGracePeriod(admin.businessLegalAddedAt);
    payload.isProprietorVaultLocked = !isWithinGracePeriod(admin.proprietor?.legalIdsAddedAt);

    const cpGracePassed = !isWithinGracePeriod(admin.competentPerson?.legalIdsAddedAt);
    const propLockedOut = (sessionRole === 'PROPRIETOR' && admin.competentPerson?.hasClaimedAccount);
    payload.isCPVaultLocked = cpGracePassed || propLockedOut;

    res.json({ success: true, data: payload });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateAdminProfile = async (req, res) => {
  try {
    const admin = await findSelfAdmin(req);
    if (!admin) return res.status(404).json({ message: 'Admin profile not found.' });

    const { target, data } = req.body; 

    if ((target === 'PROPRIETOR' || target === 'COMPETENT_PERSON') && !admin.isProprietorAlsoCP) {
      const incomingEmail = data.emails?.[0]?.toLowerCase();
      const incomingPhone = data.phones?.[0];
      
      const otherEmail = target === 'PROPRIETOR' ? admin.competentPerson?.emails?.[0]?.toLowerCase() : admin.proprietor?.emails?.[0]?.toLowerCase();
      const otherPhone = target === 'PROPRIETOR' ? admin.competentPerson?.phones?.[0] : admin.proprietor?.phones?.[0];

      if (incomingEmail && incomingEmail === otherEmail) {
        return res.status(400).json({ message: "Proprietor and Competent Person cannot share the same email unless 'Dual Role' is checked." });
      }
      if (incomingPhone && incomingPhone === otherPhone) {
        return res.status(400).json({ message: "Proprietor and Competent Person cannot share the same phone number." });
      }
    }

    if (target === 'BUSINESS') {
      if (!isWithinGracePeriod(admin.businessLegalAddedAt)) return res.status(403).json({ message: 'Vault is locked. Request an OTP to change business details.' });
      
      let changed = false;
      if (data.establishmentName && data.establishmentName !== admin.establishmentName) changed = true;
      if (data.address && JSON.stringify(data.address) !== JSON.stringify(admin.address)) changed = true;

      if (data.establishmentName) admin.establishmentName = data.establishmentName;
      if (data.gstinAdmin !== undefined) admin.gstinAdmin = data.gstinAdmin;
      if (data.drugLicenses) admin.drugLicenses = data.drugLicenses;
      if (data.address) admin.address = data.address;

      // ✨ NEW: Broadcast Business Changes
      if (changed) {
        await broadcastToClients(
          'Business Details Updated',
          `Notice: ${admin.establishmentName} has updated their registered address or business name. Please update your records.`
        );
      }
    } 
    else if (target === 'PROPRIETOR') {
      if (!isWithinGracePeriod(admin.proprietor?.legalIdsAddedAt)) return res.status(403).json({ message: 'Vault is locked. Request an OTP.' });
      
      const oldPropEmail = admin.proprietor?.emails?.[0]?.toLowerCase();
      const newPropEmail = data.emails?.[0]?.toLowerCase();
      if (oldPropEmail && newPropEmail && oldPropEmail !== newPropEmail) {
        archiveStaff(admin, 'Proprietor', admin.proprietor, 'Ownership Transferred');

        // ✨ NEW: Broadcast Ownership Transfer
        await broadcastToClients(
          'Ownership Transferred',
          `Notice: Ownership of ${admin.establishmentName} has been transferred to a new proprietor.`
        );
      }
      
      admin.proprietor = { ...admin.proprietor, ...data };
    }
    else if (target === 'COMPETENT_PERSON') {
      const cpGracePassed = !isWithinGracePeriod(admin.competentPerson?.legalIdsAddedAt);
      const isProprietor = req.user.email.toLowerCase() === admin.proprietor?.emails?.[0]?.toLowerCase();
      const propLockedOut = isProprietor && admin.competentPerson?.hasClaimedAccount;

      if (cpGracePassed || propLockedOut) return res.status(403).json({ message: 'Vault is locked. Request an OTP.' });
      
      const oldCpEmail = admin.competentPerson?.emails?.[0]?.toLowerCase();
      const newCpEmail = data.emails?.[0]?.toLowerCase();
      if (oldCpEmail && newCpEmail && oldCpEmail !== newCpEmail) {
        archiveStaff(admin, 'Competent Person', admin.competentPerson, 'Replaced by new Competent Person');
      }

      admin.competentPerson = { ...admin.competentPerson, ...data };
    }
    else if (target === 'TOGGLE_ROLE') {
      if (!isWithinGracePeriod(admin.businessLegalAddedAt)) return res.status(403).json({ message: 'Vault is locked. Request an OTP.' });
      
      admin.isProprietorAlsoCP = data.isProprietorAlsoCP;
      if (data.isProprietorAlsoCP && admin.competentPerson) {
        archiveStaff(admin, 'Competent Person', admin.competentPerson, 'Role Revoked (Proprietor assumed dual role)');
        
        const departingCpEmail = admin.competentPerson.emails?.[0];
        admin.competentPerson = undefined; 
        
        if (departingCpEmail) {
          try {
            await cognito.adminDeleteUser({ UserPoolId: process.env.COGNITO_USER_POOL_ID, Username: departingCpEmail }).promise();
            await sendMail(departingCpEmail, "Notice: Access Revoked", "You have been removed as the Competent Person. Your login access has been revoked.");
          } catch (err) { console.error("Cognito Delete Error:", err.message); }
        }
      }
    }
    else if (target === 'TOGGLE_CP_SUSPENSION') {
      const isProprietor = req.user.email.toLowerCase() === admin.proprietor?.emails?.[0]?.toLowerCase();
      if (!isProprietor) return res.status(403).json({ message: 'Only the Proprietor can suspend access.' });

      if (admin.competentPerson) {
        admin.competentPerson.isSuspended = data.isSuspended;
        const cpEmail = admin.competentPerson.emails?.[0];
        
        if (cpEmail) {
          try {
            if (data.isSuspended) {
              await cognito.adminDisableUser({ UserPoolId: process.env.COGNITO_USER_POOL_ID, Username: cpEmail }).promise();
            } else {
              await cognito.adminEnableUser({ UserPoolId: process.env.COGNITO_USER_POOL_ID, Username: cpEmail }).promise();
            }
          } catch (err) {
            console.error("Cognito Suspend Error:", err.message);
          }
        }
      }
    }

    await admin.save();
    res.json({ success: true, message: 'Profile updated instantly.', data: admin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.precheckAdminContact = async (req, res) => {
  try {
    const { email } = req.body;
    if (email && email.toLowerCase() !== req.user.email.toLowerCase()) {
      const existingAdmin = await Admin.findOne({ email: new RegExp(`^${email.trim()}$`, 'i') });
      if (existingAdmin) {
        return res.status(400).json({ message: 'This email is already in use by another admin.' });
      }
    }
    res.json({ success: true, message: 'Email is available.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error verifying email availability.' });
  }
};

exports.updateAdminContact = async (req, res) => {
  try {
    const { email, phone } = req.body;
    const admin = await findSelfAdmin(req);

    if (!admin) return res.status(404).json({ message: 'Admin profile not found.' });

    if (email) admin.email = email.trim();
    if (phone) admin.phone = phone.replace(/^\+91/, '').replace(/\D/g, '');

    await admin.save();
    res.json({ success: true, message: 'Contact details updated successfully.' });
  } catch (error) {
    console.error('[updateAdminContact] error:', error);
    res.status(500).json({ message: error.message || 'Failed to sync contact updates.' });
  }
};

exports.updateLegalInfo = async (req, res) => {
  try {
    const admin = await findSelfAdmin(req);
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });

    const { gstinAdmin, drugsBazaarId, drugLicenses } = req.body;

    const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
    const lastChange = admin.lastLegalInfoChangeDate ? new Date(admin.lastLegalInfoChangeDate).getTime() : 0;
    const countHasReset = (Date.now() - lastChange) > ONE_YEAR_MS;

    let currentCount = countHasReset ? 0 : (admin.legalInfoChangeCount || 0);
    if (currentCount >= 2) {
      return res.status(403).json({ message: 'Yearly change limit reached for legal information.' });
    }

    const changes = [];

    if (gstinAdmin !== undefined && gstinAdmin !== admin.gstinAdmin) {
      changes.push({ field: 'GSTIN', oldValue: admin.gstinAdmin, newValue: gstinAdmin });
      admin.gstinAdmin = gstinAdmin;
    }

    if (drugsBazaarId !== undefined && drugsBazaarId !== admin.drugsBazaarId) {
      changes.push({ field: 'DrugsBazaar ID', oldValue: admin.drugsBazaarId, newValue: drugsBazaarId });
      admin.drugsBazaarId = drugsBazaarId;
    }

    if (drugLicenses) {
      changes.push({ field: 'Drug Licenses', oldValue: 'Previous Records', newValue: 'Updated Records' });
      admin.drugLicenses = drugLicenses;
    }

    if (changes.length > 0) {
      admin.legalInfoChangeCount = currentCount + 1;
      admin.lastLegalInfoChangeDate = new Date();
      if (!admin.legalInfoChanges) admin.legalInfoChanges = [];
      admin.legalInfoChanges.push(...changes);

      // ✨ NEW: Broadcast Legal Changes
      await broadcastToClients(
        'Legal Information Updated',
        `Notice: ${admin.establishmentName} has updated their GSTIN or Drug Licenses. Please ensure your records match for GST compliance.`
      );
    }

    await admin.save();
    res.json({ success: true, message: 'Legal info updated successfully.', data: admin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};