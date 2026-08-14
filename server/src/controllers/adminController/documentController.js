// server/src/controllers/admin/documentController.js
const { findSelfAdmin } = require('./adminUtils');
const Client = require('../../models/Client');
const Notification = require('../../models/Notification');

exports.listDocumentRequests = async (req, res) => {
  try {
    const { status, clientId } = req.query;
    const match = clientId ? { _id: clientId } : {};

    const clients = await Client.find(match, 'establishmentName clientId documentRequests').lean();

    const requests = [];
    for (const c of clients) {
      for (const r of c.documentRequests || []) {
        if (status && r.status !== status) continue;
        requests.push({
          ...r,
          clientObjectId: c._id,
          clientCode: c.clientId,
          establishmentName: c.establishmentName,
        });
      }
    }
    requests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

    res.json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.approveRejectDocumentRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, note, rejectionNote } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'." });
    }

    const client = await Client.findOne({ "documentRequests._id": requestId });
    if (!client) return res.status(404).json({ message: 'Document request or Client not found.' });

    const request = client.documentRequests.id(requestId);
    const admin = await findSelfAdmin(req);

    const finalNote = note || rejectionNote;

    request.status = status;
    request.approvedBy = admin?._id;

    if (!request.message || request.message.trim() === '') {
      request.message = status === 'approved' ? 'Request Approved by Admin' : (finalNote || 'Request Rejected by Admin');
    }

    if (status === 'approved') {
      request.approvedAt = new Date();
    } else {
      request.rejectionNote = finalNote;
    }

    await client.save();

    await Notification.create({
      recipientId: client._id,
      recipientRole: 'client',
      type: 'document',
      title: status === 'approved' ? 'Document update approved' : 'Document update rejected',
      message:
        status === 'approved'
          ? `You can now upload your updated ${request.documentType}.`
          : `Your ${request.documentType} update request was rejected: ${finalNote || 'no reason given'}.`,
      link: '/client-dashboard/profile',
    });

    res.json({ success: true, data: request });
  } catch (err) {
    console.error('approveRejectDocumentRequest error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.verifyClientDocument = async (req, res) => {
  try {
    const { documentType, isVerified, rejectionNote } = req.body;
    const client = await Client.findById(req.params.clientId);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    if (!client.documentVerification) client.documentVerification = {};
    client.documentVerification[documentType] = isVerified;

    if (isVerified) {
      if (client.documentRequests) {
        client.documentRequests.forEach(r => {
          if (r.documentType === documentType && (r.status === 'pending' || r.status === 'rejected')) {
            r.status = 'completed';
            r.resolvedAt = new Date();
            r.resolutionReason = 'client_approved';
          }
        });
      }
    } else {
      client.documentRequests.push({
        documentType,
        message: rejectionNote || 'Document rejected by Admin',
        rejectionNote: rejectionNote || 'Document rejected by Admin',
        status: 'rejected',
        requestedAt: new Date()
      });
    }

    const requiredDocs = [];
    if (client.gstin) requiredDocs.push('gstCert');
    if (client.drugLicenses && client.drugLicenses.length > 0) requiredDocs.push('dlCert');
    if (client.panNumber) requiredDocs.push('panCard');
    if (client.aadhaarNumber) requiredDocs.push('aadhaarCard');

    client.documentsVerified = requiredDocs.every(doc => client.documentVerification[doc]);

    await client.save();
    res.json({ success: true, message: `Document ${isVerified ? 'verified' : 'rejected'} successfully.` });
  } catch (err) {
    console.error("verifyClientDocument Error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteDocumentHistory = async (req, res) => {
  try {
    const { clientId, historyId } = req.params;
    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    const request = client.documentRequests.id(historyId);
    if (!request) return res.status(404).json({ message: 'History entry not found.' });

    request.deleteOne();
    await client.save();

    res.json({ success: true, message: 'History entry deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};