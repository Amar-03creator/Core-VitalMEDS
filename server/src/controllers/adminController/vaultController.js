// server/src/controllers/admin/vaultController.js
const { findSelfAdmin, cognito } = require('./adminUtils');
const { sendMail } = require('../../utils/mailer');
const Client = require('../../models/Client'); 
const Notification = require('../../models/Notification'); 

// ✨ The Global Broadcast Helper 
const broadcastToClients = async (title, message, linkUrl) => {
  try {
    const activeClients = await Client.find({ status: 'Active' }, '_id');
    if (activeClients.length === 0) return;

    const notifications = activeClients.map(client => ({
      recipientId: client._id,
      recipientRole: 'client',
      type: 'alert', 
      title: title,
      message: message,
      link: linkUrl
    }));

    await Notification.insertMany(notifications);
  } catch (err) {
    console.error('Broadcast Error:', err);
  }
};

exports.requestVaultChange = async (req, res) => {
  res.json({ success: true }); 
};

exports.verifyVaultChange = async (req, res) => {
  try {
    const admin = await findSelfAdmin(req);
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });

    const { actionType, proposedData, password } = req.body;
    const propEmail = admin.proprietor?.emails?.[0];
    
    if (!propEmail) return res.status(400).json({ message: 'Proprietor email missing. Cannot authorize.' });
    if (!password) return res.status(400).json({ message: 'Password is required to authorize this action.' });

    try {
      await cognito.adminInitiateAuth({
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        ClientId: process.env.COGNITO_CLIENT_ID,
        AuthParameters: { USERNAME: propEmail, PASSWORD: password }
      }).promise();
    } catch (authError) {
      if (authError.code === 'NotAuthorizedException') {
        return res.status(401).json({ message: 'Incorrect password. Authorization denied.' });
      }
      throw authError;
    }

    // ✨ DYNAMIC NOTIFICATION BUILDER
    let broadcastNeeded = false;
    let broadcastTitle = '';
    let broadcastMessage = '';
    let broadcastLink = '/client-dashboard/about'; // Default link to the About Us page

    const shopName = admin.establishmentName;

    // ── 1. BUSINESS INFO CHANGES ──
    if (actionType === 'CHANGE_BUSINESS_LEGAL') {
      const newName = proposedData.establishmentName;
      
      const nameChanged = newName && newName !== shopName;
      const addressChanged = proposedData.address && JSON.stringify(proposedData.address) !== JSON.stringify(admin.address);
      const gstinChanged = proposedData.gstinAdmin !== undefined && proposedData.gstinAdmin !== admin.gstinAdmin;

      if (nameChanged) {
        broadcastNeeded = true;
        broadcastTitle = 'Business Name Changed';
        broadcastMessage = `"${shopName}" has decided to change their official business name to "${newName}". Check the About Us page for more info.`;
      } 
      else if (addressChanged || gstinChanged) {
        broadcastNeeded = true;
        broadcastTitle = 'Business Details Updated';
        
        let updates = [];
        if (addressChanged) updates.push('registered address');
        if (gstinChanged) updates.push('GSTIN');
        
        broadcastMessage = `"${shopName}" has updated their ${updates.join(' and ')}. Please update your billing records to ensure GST compliance.`;
      }

      if (newName) admin.establishmentName = newName;
      if (proposedData.gstinAdmin !== undefined) admin.gstinAdmin = proposedData.gstinAdmin;
      if (proposedData.drugLicenses) admin.drugLicenses = proposedData.drugLicenses;
      if (proposedData.address) admin.address = proposedData.address;
      if (proposedData.drugsBazaarId) admin.drugsBazaarId = proposedData.drugsBazaarId;
    }
    
    // ── 2. PROPRIETOR CHANGES ──
    else if (actionType === 'CHANGE_PROP_INFO') {
      const oldPropName = admin.proprietor?.name;
      const newPropName = proposedData.name;
      
      if (oldPropName && newPropName && oldPropName !== newPropName) {
        broadcastNeeded = true;
        broadcastTitle = 'Ownership Transferred';
        broadcastMessage = `Notice: Official ownership of "${shopName}" has been transferred from ${oldPropName} to ${newPropName}.`;
      }

      admin.proprietor = { ...admin.proprietor, ...proposedData };
    }
    
    // ── 3. COMPETENT PERSON CHANGES ──
    else if (actionType === 'CHANGE_CP_INFO') {
      const oldCpName = admin.competentPerson?.name;
      const newCpName = proposedData.name;

      if (oldCpName && newCpName && oldCpName !== newCpName) {
        // The CP completely changed
        broadcastNeeded = true;
        broadcastTitle = 'Competent Person Updated';
        broadcastMessage = `Notice: "${shopName}" has appointed a new Competent Person (${newCpName}). Check the About Us page for updated contact details.`;
      } 
      else if (proposedData.phones || proposedData.emails) {
        // Just contact info changed
        broadcastNeeded = true;
        broadcastTitle = 'Contact Info Updated';
        broadcastMessage = `Notice: Contact information for the Competent Person at "${shopName}" has been updated.`;
      }

      admin.competentPerson = { ...admin.competentPerson, ...proposedData };
    }
    
    // ── 4. DUAL ROLE CHANGES ──
    else if (actionType === 'TOGGLE_DUAL_ROLE') {
      admin.isProprietorAlsoCP = proposedData.isProprietorAlsoCP;
      
      if (admin.isProprietorAlsoCP === true && admin.competentPerson) {
        const departingCpName = admin.competentPerson.name;
        const departingCpEmail = admin.competentPerson.emails?.[0];
        const propName = admin.proprietor?.name || 'The Proprietor';

        // Notify that the Proprietor has fired the CP and taken over
        broadcastNeeded = true;
        broadcastTitle = 'Competent Person Updated';
        broadcastMessage = `Notice: ${propName} has officially assumed the role of Competent Person for "${shopName}", replacing ${departingCpName}.`;

        admin.competentPerson = undefined;
        
        if (departingCpEmail) {
          try {
            await cognito.adminDeleteUser({ UserPoolId: process.env.COGNITO_USER_POOL_ID, Username: departingCpEmail }).promise();
            await sendMail(departingCpEmail, "Notice: Access Revoked", "You have been removed as the Competent Person. Your login access has been revoked.");
          } catch (err) { console.error("Cognito Delete Error:", err.message); }
        }
      }
    }

    admin.pendingSecurityAction = undefined; 
    await admin.save();

    // ✨ FIRE THE PRECISE BROADCAST
    if (broadcastNeeded) {
      await broadcastToClients(broadcastTitle, broadcastMessage, broadcastLink);
    }

    res.json({ success: true, message: 'Authorization successful. Changes applied permanently.', data: admin });
  } catch (err) {
    console.error('Vault Execution Error:', err);
    res.status(500).json({ message: err.message });
  }
};