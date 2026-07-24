// features/Admin/Settings/DocumentRequestsTab.jsx
//
// NOTE: this covers the request/approve/reject queue (documentRequests).
// It does NOT cover verifyClientDocument — the "tick off each document as
// verified" action — because that's a per-client action that belongs on
// your admin customer-detail page (where an admin is already looking at
// one client's full profile), which I haven't been shown. The backend
// endpoint (PUT /api/admin/clients/:clientId/documents/verify) is ready
// whenever you share that file and want it wired in.

import { useState, useEffect, useCallback } from 'react';
import { Clock, Check, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

const STATUS_FILTERS = ['pending', 'approved', 'rejected', 'completed'];

const DOC_LABELS = {
  gstCert: 'GST Certificate',
  dlCert: 'Drug License',
  aadhaarCard: 'Aadhaar Card',
  panCard: 'PAN Card',
};

const DocumentRequestsTab = ({ authAxios }) => {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // request object or null
  const [note, setNote] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authAxios.get('/api/admin/documents/requests', { params: { status: statusFilter } });
      setRequests(res.data.data || []);
    } catch (err) {
      toast.error('Could not load document requests.');
    } finally {
      setLoading(false);
    }
  }, [authAxios, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const approve = async (req) => {
    setActioningId(req._id);
    try {
      await authAxios.put(`/api/admin/documents/requests/${req._id}`, {
        status: 'approved',
        clientId: req.clientObjectId,
      });
      toast.success('Request approved.');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve.');
    } finally {
      setActioningId(null);
    }
  };

  const openReject = (req) => {
    setNote('');
    setRejectModal(req);
  };

  const submitReject = async () => {
    setActioningId(rejectModal._id);
    try {
      await authAxios.put(`/api/admin/documents/requests/${rejectModal._id}`, {
        status: 'rejected',
        clientId: rejectModal.clientObjectId,
        note,
      });
      toast.success('Request rejected.');
      setRejectModal(null);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject.');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-sm font-semibold capitalize
              ${statusFilter === s ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-10 flex justify-center text-slate-400">
          <Spinner />
        </div>
      ) : requests.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-10">No {statusFilter} requests.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req._id} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 text-sm font-semibold">{req.establishmentName}</p>
                  <p className="text-slate-500 text-sm">
                    {DOC_LABELS[req.documentType] || req.documentType} · {req.clientCode}
                  </p>
                  {req.reason && <p className="text-slate-600 text-sm mt-1">&ldquo;{req.reason}&rdquo;</p>}
                  <p className="text-slate-400 text-sm mt-1 flex items-center gap-1">
                    <Clock size={11} /> {new Date(req.requestedAt).toLocaleDateString()}
                  </p>
                  {req.status === 'rejected' && req.rejectionNote && (
                    <p className="text-red-500 text-sm mt-1">Rejected: {req.rejectionNote}</p>
                  )}
                </div>
              </div>

              {req.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => approve(req)}
                    disabled={actioningId === req._id}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 text-white text-sm font-semibold py-2 rounded-xl disabled:opacity-50"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    onClick={() => openReject(req)}
                    disabled={actioningId === req._id}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-600 text-sm font-semibold py-2 rounded-xl disabled:opacity-50"
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-[80] bg-slate-950/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-slate-900 font-bold text-base">Reject request</h3>
              <button onClick={() => setRejectModal(null)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Reason for rejection (shown to the client)…"
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={submitReject}
              disabled={actioningId === rejectModal._id}
              className="w-full bg-red-500 text-white font-semibold text-sm py-2.5 rounded-xl disabled:opacity-50"
            >
              {actioningId === rejectModal._id ? 'Rejecting…' : 'Confirm Reject'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentRequestsTab;