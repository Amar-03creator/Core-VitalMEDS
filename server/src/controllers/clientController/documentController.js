// server/src/controllers/clientController/documentController.js
const Client = require('../../models/Client');
const { notifyClient } = require('./clientHelpers');

exports.createDocumentRequest = async (req, res) => {
  try {
    const { message, documentType = 'other' } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'A message describing what you need is required.' });
    }

    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    const newRequest = {
      message: message.trim(),
      documentType,
      isActive: true,
      status: 'pending',
      requestedBy: req.admin?._id,
    };
    
    client.documentRequests.push(newRequest);
    await client.save();

    const savedRequest = client.documentRequests[client.documentRequests.length - 1];

    await notifyClient(client._id, {
      type: 'alert',
      title: 'Action needed on your account',
      message: message.trim(),
      link: '/client-dashboard',
    });

    res.status(201).json({ success: true, data: savedRequest });
  } catch (err) {
    console.error('createDocumentRequest error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getActiveDocumentRequests = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    const activeRequests = client.documentRequests
      .filter(req => req.isActive)
      .sort((a, b) => b.requestedAt - a.requestedAt);

    res.json({ success: true, count: activeRequests.length, data: activeRequests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resolveDocumentRequest = async (req, res) => {
  try {
    const { id, requestId } = req.params;
    const client = await Client.findById(id);
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    const request = client.documentRequests.id(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found.' });

    if (request.isActive) {
      request.isActive = false;
      request.status = 'dismissed'; 
      request.resolvedAt = new Date();
      request.resolvedBy = req.admin?._id;
      request.resolutionReason = 'dismissed';
      await client.save();
    }

    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};