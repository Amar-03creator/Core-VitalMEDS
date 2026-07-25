// server/src/controllers/clientController/workflowController.js
const Client = require('../../models/Client');
const { notifyClient } = require('./clientHelpers');

exports.approveClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    
    client.status = 'Active';
    if (!client.accountApprovedAt) client.accountApprovedAt = new Date();

    if (client.documentRequests && client.documentRequests.length > 0) {
      client.documentRequests.forEach(req => {
        if (req.isActive) {
          req.isActive = false;
          req.status = 'completed';
          req.resolvedAt = new Date();
          req.resolutionReason = 'client_approved';
          req.resolvedBy = req.admin?._id; 
        }
      });
    }
    
    await client.save();

    await notifyClient(client._id, {
      type: 'registration',
      title: 'Account approved',
      message: 'Your account has been approved. You can now place orders.',
      link: '/client-dashboard',
    });

    res.json({ success: true, message: 'Client approved successfully.' });
  } catch (err) {
    console.error("Approval Error:", err);
    res.status(500).json({ error: err.message || 'Failed to approve client' }); 
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