// client/src/features/Admin/CustomersPage/modals/TakeActionModal.jsx
import { useState, useEffect } from 'react';
import { X, FileQuestion, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../../services/api';

export const TakeActionModal = ({ client, onClose, onApprove, onReject }) => {
  const [view, setView] = useState('choose'); // 'choose' | 'ask'
  const [message, setMessage] = useState('');
  const [documentType, setDocumentType] = useState('other'); // ✨ Added to match backend schema
  const [sending, setSending] = useState(false);
  const [activeRequests, setActiveRequests] = useState(null); 

  useEffect(() => {
    api.getActiveDocumentRequests(client._id)
      .then((res) => setActiveRequests(res.data || []))
      .catch(() => setActiveRequests([]));
  }, [client._id]);

  const handleApproveClick = () => {
    onApprove(client);
    onClose();
  };

  const handleRejectClick = () => {
    onReject(client);
    onClose();
  };

  const handleSendRequest = async () => {
    if (!message.trim()) {
      toast.error('Describe what you need from the client first.');
      return;
    }
    setSending(true);
    try {
      // ✨ FIX: Passing a proper payload object matching clientApi.js and the backend
      await api.createDocumentRequest(client._id, { 
        message: message.trim(), 
        documentType 
      });
      toast.success('Request sent to client');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to send request');
      setSending(false);
    }
  };

  // Helper to make the enum readable in the UI
  const formatDocType = (type) => {
    const map = {
      gstCert: 'GST Certificate',
      dlCert: 'Drug License',
      aadhaarCard: 'Aadhaar Card',
      panCard: 'PAN Card',
      other: 'Other / General'
    };
    return map[type] || type;
  };

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-2xl px-5 pt-4 pb-6 max-h-[85dvh] overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-4" />

        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-slate-900 text-lg">Take Action</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        <p className="text-slate-500 text-sm mb-4">{client?.establishmentName}</p>

        {activeRequests && activeRequests.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 space-y-2">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
              <Clock size={12} /> Already waiting on {activeRequests.length} thing{activeRequests.length > 1 ? 's' : ''}
            </p>
            {activeRequests.map((r) => (
              <div key={r._id} className="border-t border-amber-200/50 pt-2 mt-2 first:border-0 first:pt-0 first:mt-0">
                <span className="text-xs font-bold bg-amber-200/50 text-amber-800 px-2 py-0.5 rounded mr-2">
                  {formatDocType(r.documentType)}
                </span>
                <p className="text-sm text-amber-900 mt-1">{r.message}</p>
              </div>
            ))}
          </div>
        )}

        {view === 'choose' ? (
          <div className="space-y-2.5">
            <button
              onClick={() => setView('ask')}
              className="w-full flex items-center gap-3 bg-blue-50 text-blue-700 font-semibold text-base px-4 py-3.5 rounded-xl hover:bg-blue-100"
            >
              <FileQuestion size={20} /> Ask for more documents
            </button>
            <button
              onClick={handleApproveClick}
              className="w-full flex items-center gap-3 bg-emerald-500 text-white font-bold text-base px-4 py-3.5 rounded-xl hover:bg-emerald-600"
            >
              <CheckCircle2 size={20} /> Approve Account
            </button>
            <button
              onClick={handleRejectClick}
              className="w-full flex items-center gap-3 bg-red-50 text-red-600 font-semibold text-base px-4 py-3.5 rounded-xl hover:bg-red-100"
            >
              <XCircle size={20} /> Reject Account
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ✨ NEW: Document Type Selector */}
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">
                Which document is missing or invalid?
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-base text-slate-800 outline-none focus:border-blue-400"
              >
                <option value="gstCert">GST Certificate</option>
                <option value="dlCert">Drug License (20B / 21B)</option>
                <option value="panCard">PAN Card</option>
                <option value="aadhaarCard">Aadhaar Card</option>
                <option value="other">Other / General Requirement</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">
                Message to Client
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Please upload a clearer photo of your Drug Licence — the current one is unreadable."
                rows={4}
                autoFocus
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-blue-400 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setView('choose')} className="flex-1 bg-slate-100 text-slate-700 font-semibold py-3 rounded-xl">
                Back
              </button>
              <button
                onClick={handleSendRequest}
                disabled={sending}
                className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : null} Send Request
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};