// features/Client/Profile/DocumentsTab.jsx
import { useState } from 'react';
import { FileCheck2, Clock, AlertCircle, UploadCloud, RotateCcw, X } from 'lucide-react';
import { toast } from 'sonner';

const DOC_TYPES = [
  { key: 'gstCert', label: 'GST Certificate' },
  { key: 'dlCert', label: 'Drug License' },
  { key: 'aadhaarCard', label: 'Aadhaar Card' },
  { key: 'panCard', label: 'PAN Card' },
];

const STATUS_STYLES = {
  missing: { color: 'text-slate-400', bg: 'bg-slate-100', icon: AlertCircle },
  pending_verify: { color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
  verified: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: FileCheck2 },
  pending_request: { color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
  approved: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: FileCheck2 },
  rejected: { color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle },
};

function statusFor(profile, type) {
  const firstUploaded = profile.documentFirstUploaded?.[type];
  if (!firstUploaded) return { key: 'missing', label: 'Not uploaded' };

  const requests = (profile.documentRequests || []).filter((r) => r.documentType === type);
  const latest = requests.slice().sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))[0];

  if (latest?.status === 'pending') return { key: 'pending_request', label: 'Update requested — awaiting admin', request: latest };
  if (latest?.status === 'approved') return { key: 'approved', label: 'Approved — you can re-upload now', request: latest };
  if (latest?.status === 'rejected') return { key: 'rejected', label: 'Update request rejected', request: latest };

  if (profile.documentVerification?.[type]) return { key: 'verified', label: 'Verified' };
  return { key: 'pending_verify', label: 'Pending verification' };
}

const DocumentsTab = ({ profile, authAxios, onUpdated }) => {
  const [requestModal, setRequestModal] = useState(null); // documentType or null
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingType, setUploadingType] = useState(null);

  const openRequestModal = (type) => {
    setReason('');
    setRequestModal(type);
  };

  const submitRequest = async () => {
    if (!reason.trim()) {
      toast.error('Please tell us why you need to update this document.');
      return;
    }
    setSubmitting(true);
    try {
      await authAxios.post('/api/clients/me/documents/request', { documentType: requestModal, reason });
      toast.success('Request sent to admin.');
      setRequestModal(null);
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelected = async (type, file) => {
    if (!file) return;
    setUploadingType(type);
    try {
      const ticketRes = await authAxios.get('/api/clients/me/documents/upload-ticket', {
        params: { documentType: type, contentType: file.type },
      });
      const { uploadUrl, key, fileUrl } = ticketRes.data;

      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error('Upload to storage failed.');

      await authAxios.post('/api/clients/me/documents/confirm', { documentType: type, fileKey: key, fileUrl });
      toast.success('Document uploaded. Pending verification.');
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Upload failed. Please try again.');
    } finally {
      setUploadingType(null);
    }
  };

  return (
    <div className="space-y-3">
      {DOC_TYPES.map(({ key, label }) => {
        const status = statusFor(profile, key);
        const style = STATUS_STYLES[status.key];
        const Icon = style.icon;
        const canUploadDirectly = status.key === 'missing' || status.key === 'approved';
        const canRequest = status.key === 'pending_verify' || status.key === 'verified' || status.key === 'rejected';
        const isUploading = uploadingType === key;

        return (
          <div key={key} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${style.bg}`}>
                  <Icon size={17} className={style.color} />
                </div>
                <div>
                  <p className="text-slate-900 text-sm font-semibold">{label}</p>
                  <p className={`text-sm mt-0.5 ${style.color}`}>{status.label}</p>
                  {status.key === 'rejected' && status.request?.rejectionNote && (
                    <p className="text-slate-500 text-sm mt-1">Reason: {status.request.rejectionNote}</p>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                {canUploadDirectly && (
                  <label
                    className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl cursor-pointer
                      ${isUploading ? 'bg-slate-100 text-slate-400' : 'bg-emerald-500 text-white'}`}
                  >
                    <UploadCloud size={14} />
                    {isUploading ? 'Uploading…' : 'Upload'}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => handleFileSelected(key, e.target.files?.[0])}
                    />
                  </label>
                )}
                {canRequest && (
                  <button
                    onClick={() => openRequestModal(key)}
                    className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl bg-slate-100 text-slate-600"
                  >
                    <RotateCcw size={14} /> Request Update
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Request-update modal */}
      {requestModal && (
        <div className="fixed inset-0 z-[80] bg-slate-950/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-slate-900 font-bold text-base">Request document update</h3>
              <button onClick={() => setRequestModal(null)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>
            <p className="text-slate-500 text-sm">
              Tell us why you need to update this document. An admin will review before you can re-upload.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. License renewed, updated GST address…"
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={submitRequest}
              disabled={submitting}
              className="w-full bg-emerald-500 text-white font-semibold text-sm py-2.5 rounded-xl disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;