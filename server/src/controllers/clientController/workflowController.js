// server/src/controllers/clientController/workflowController.js
const Client = require('../../models/Client');
const { notifyClient } = require('./clientHelpers');

// exports.approveClient = async (req, res) => {
//   try {
//     const client = await Client.findById(req.params.id);
//     if (!client) return res.status(404).json({ message: 'Client not found' });
    
//     client.status = 'Active';
//     if (!client.accountApprovedAt) client.accountApprovedAt = new Date();

//     if (client.documentRequests && client.documentRequests.length > 0) {
//       client.documentRequests.forEach(req => {
//         if (req.isActive) {
//           req.isActive = false;
//           req.status = 'completed';
//           req.resolvedAt = new Date();
//           req.resolutionReason = 'client_approved';
//           req.resolvedBy = req.admin?._id; 
//         }
//       });
//     }
    
//     await client.save();

//     await notifyClient(client._id, {
//       type: 'registration',
//       title: 'Account approved',
//       message: 'Your account has been approved. You can now place orders.',
//       link: '/client-dashboard',
//     });

//     res.json({ success: true, message: 'Client approved successfully.' });
//   } catch (err) {
//     console.error("Approval Error:", err);
//     res.status(500).json({ error: err.message || 'Failed to approve client' }); 
//   }
// };


// server/src/controllers/clientController/workflowController.js

exports.approveClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    
    client.status = 'Active';
    if (!client.accountApprovedAt) client.accountApprovedAt = new Date();

    // ✨ THE JAILBREAK: Force unlock the client so they can order, even if docs are missing
    client.documentsUploaded = true;
    client.documentsVerified = true;

    // Resolve any pending document requests automatically
    if (client.documentRequests && client.documentRequests.length > 0) {
      client.documentRequests.forEach(req => {
        if (req.status === 'pending') {
          req.status = 'completed';
          req.resolvedAt = new Date();
          req.resolutionReason = 'client_approved_by_admin';
          req.resolvedBy = req.admin?._id; 
        }
      });
    }
    
    await client.save();

    // ✨ NOTIFY CLIENT: They are approved!
    await notifyClient(client._id, {
      type: 'registration',
      title: 'Account Approved! 🎉',
      message: 'Your account has been officially approved. You can now browse the catalog and place orders.',
      link: '/client-dashboard',
    });

    res.json({ success: true, message: 'Client approved successfully.' });
  } catch (err) {
    console.error("Approval Error:", err);
    res.status(500).json({ error: err.message || 'Failed to approve client' }); 
  }
};

// ✨ NEW: Admin explicitly asks for a document update (blurry, missing, etc.)
// ✨ NEW & FIXED: Admin asks for one or more document updates
exports.requestDocumentUpdate = async (req, res) => {
  try {
    const { requests, documentType, message } = req.body;
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Support the new array format from the UI, or fallback to the old single format
    const processList = requests || [{ documentType, note: message }];

    const typesRequested = [];

    for (const reqItem of processList) {
      if (!reqItem.documentType || !reqItem.note) continue;
      
      if (!client.documentVerification) client.documentVerification = {};
      client.documentVerification[reqItem.documentType] = false;

      client.documentRequests.push({
        documentType: reqItem.documentType,
        message: reqItem.note, // ✨ FIX: Mapped exactly to the Mongoose Schema requirement
        rejectionNote: reqItem.note,
        status: 'rejected',
        requestedAt: new Date(),
        admin: req.admin?._id
      });
      
      typesRequested.push(reqItem.documentType);
    }

    await client.save();

    // ✨ NOTIFY CLIENT
    await notifyClient(client._id, {
      type: 'document',
      title: 'Action Required: Document Update',
      message: `Admin requested updates for: ${typesRequested.join(', ')}. Please check your documents tab.`,
      link: '/client-dashboard/profile?tab=documents'
    });

    res.json({ success: true, message: 'Document requests sent to client.' });
  } catch(err) {
    console.error("Document Request Error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.rejectClient = async (req, res) => {
  try {
    const { reason } = req.body;
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    
    client.status = 'Suspended';
    if (reason) client.documentIssues = [reason];
    client.updatedBy = req.admin?._id;
    await client.save();

    await notifyClient(client._id, {
      type: 'registration',
      title: 'Account application update',
      message: reason ? `Your account application needs attention: ${reason}` : 'Your account application was not approved.',
      link: '/client-dashboard',
    });

    res.json({ success: true, data: client });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateClientStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ALLOWED = ['Pending', 'Active', 'Static', 'Credit Alert', 'Suspended'];
    if (!ALLOWED.includes(status)) return res.status(400).json({ message: `Invalid status: ${status}` });
    
    const client = await Client.findByIdAndUpdate(req.params.id, { status, updatedBy: req.admin?._id }, { new: true });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    
    res.json({ success: true, data: client });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};