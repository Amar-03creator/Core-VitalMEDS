import { useState } from 'react';
import { FileCheck2, Clock, AlertCircle, UploadCloud, RotateCcw, X, RefreshCw, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import { DocumentViewerModal } from '../../Admin/CustomersPage/modals/DocumentViewerModal';

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
  if (latest?.status === 'rejected') return { key: 'rejected', label: 'Document Rejected (Please Re-upload)', request: latest };
  if (profile.documentVerification?.[type]) return { key: 'verified', label: 'Verified' };
  return { key: 'pending_verify', label: 'Pending verification' };
}

// ✨ NEW: Matches backend fields
const FIELD_MAP = {
  gstCert: 'gstin',
  panCard: 'panNumber',
  aadhaarCard: 'aadhaarNumber',
  dlCert: 'drugLicenses'
};

const isValidID = (type, val) => {
  if (!val) return false;
  if (type === 'gstCert') return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{2}[0-9A-Z]{1}$/.test(val);
  if (type === 'panCard') return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val);
  if (type === 'aadhaarCard') return /^[2-9][0-9]{11}$/.test(val);
  if (type === 'dlCert') return /^[A-Za-z0-9\/\s\-]{5,40}$/.test(val);
  return true;
};

// ✨ NEW: Protects privacy on the dashboard
const maskId = (type, val) => {
  if (!val) return '';
  if (type === 'panCard') return val.replace(/^(.{2}).*(.{2})$/, '$1XXXXXX$2');
  if (type === 'aadhaarCard') return 'XXXX-XXXX-' + val.slice(-4);
  if (type === 'gstCert') return val.substring(0, 2) + 'XXXXX' + val.substring(7);
  return val;
};

const DocumentsTab = ({ profile, authAxios, onUpdated }) => {
  const [requestModal, setRequestModal] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  
  const [sessionUploads, setSessionUploads] = useState({});

  // ✨ NEW: Upload Modal States
  const [uploadModal, setUploadModal] = useState(null); // { key, label }
  const [uploadNumber, setUploadNumber] = useState('');
  const [uploadFiles, setUploadFiles] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

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
      // ✨ FIX: Changed 'reason' to 'message' to match Mongoose schema
      await authAxios.post('/api/clients/me/documents/request', { documentType: requestModal, message: reason });
      toast.success('Request sent to admin.');
      setRequestModal(null);
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send request.');
    } finally {
      setSubmitting(false);
    }
  };

  // ✨ NEW: Intercepts the click to open the ID + File upload modal
  const openUploadModal = (key, label) => {
    const fieldName = FIELD_MAP[key];
    const fieldVal = profile[fieldName];
    const currentVal = Array.isArray(fieldVal) ? fieldVal[0] : fieldVal;
    
    setUploadNumber(currentVal || '');
    setUploadFiles(null);
    setUploadModal({ key, label });
  };

  // ✨ NEW: Handles the full submission from the Upload Modal
  const confirmUploadSubmit = async () => {
    if (!isValidID(uploadModal.key, uploadNumber)) {
      toast.error(`Invalid format for ${uploadModal.label} number.`);
      return;
    }
    if (!uploadFiles || uploadFiles.length === 0) {
      toast.error('Please attach the document file.');
      return;
    }

    let fileArray = Array.from(uploadFiles).slice(0, 3);
    const MAX_PDF_SIZE_MB = 2;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      if (file.type === 'application/pdf' && file.size > (MAX_PDF_SIZE_MB * 1024 * 1024)) {
        toast.error(`PDFs must be under ${MAX_PDF_SIZE_MB}MB. Please compress your file.`);
        return; 
      }
    }

    setIsUploading(true);
    const type = uploadModal.key;

    try {
      const uploadedUrls = [];
      let lastKey = '';

      for (let i = 0; i < fileArray.length; i++) {
        let file = fileArray[i];

        if (file.type.startsWith('image/')) {
          const options = {
            maxSizeMB: 0.8,
            maxWidthOrHeight: 1920,
            useWebWorker: true
          };
          try {
            file = await imageCompression(file, options);
          } catch (error) {
            console.error('Compression failed, uploading original', error);
          }
        }

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

        uploadedUrls.push(fileUrl);
        lastKey = key;
      }

      await authAxios.post('/api/clients/me/documents/confirm', {
        documentType: type,
        fileKey: lastKey,
        fileUrl: uploadedUrls.join(','),
        documentNumber: uploadNumber // ✨ NEW: Send ID number to backend
      });

      setSessionUploads(prev => ({ ...prev, [type]: Date.now() }));
      toast.success('Document uploaded successfully.');
      setUploadModal(null);
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const ALL_DOCS = [
    { key: 'gstCert', label: 'GST Certificate' },
    { key: 'dlCert', label: 'Drug License' },
    { key: 'panCard', label: 'PAN Card' },
    { key: 'aadhaarCard', label: 'Aadhaar Card' }
  ];

  const isMandatory = (key) => {
    if (key === 'gstCert') return !!profile.gstin;
    if (key === 'dlCert') return !!(profile.drugLicenses && profile.drugLicenses.length > 0);
    if (key === 'panCard') return !!profile.panNumber;
    if (key === 'aadhaarCard') return !!profile.aadhaarNumber;
    return false;
  };

  return (
    <div className="space-y-3">
      {ALL_DOCS.map(({ key, label }) => {
        const status = statusFor(profile, key);
        const style = STATUS_STYLES[status.key];
        const mandatory = isMandatory(key);

        const isGracePeriodActive = sessionUploads[key] && ((Date.now() - sessionUploads[key]) / 60000 < 10);
        const inGracePeriod = status.key === 'pending_verify' && isGracePeriodActive;
        
        const canUploadDirectly = status.key === 'missing' || status.key === 'approved' || status.key === 'rejected' || inGracePeriod;
        const canRequest = status.key === 'verified';
        
        // ✨ NEW: Safely extract the current ID number for display if it exists
        const fieldVal = profile[FIELD_MAP[key]];
        const displayVal = Array.isArray(fieldVal) ? fieldVal[0] : fieldVal;

        return (
          <div key={key} className="bg-white rounded-2xl border border-slate-200 p-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              <div className="flex items-start gap-3 w-full sm:w-auto">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${style.bg}`}>
                  <AlertCircle size={17} className={style.color} />
                </div>
                <div>
                  <p className="text-slate-900 text-sm font-semibold flex items-center gap-2">
                    {label}
                    {mandatory ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">Required</span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">Optional</span>
                    )}
                  </p>

                  <p className={`text-sm mt-0.5 ${style.color}`}>
                    {status.label}
                    {inGracePeriod && <span className="text-xs text-slate-400 ml-2">(10 min grace period)</span>}
                  </p>

                  {/* ✨ NEW: Render the masked ID safely */}
                  {displayVal && (
                    <p className="text-xs font-mono text-slate-500 mt-1.5 bg-slate-50 inline-block px-2.5 py-1 rounded-md border border-slate-200">
                      ID: {maskId(key, displayVal)}
                    </p>
                  )}

                  {status.key === 'rejected' && status.request?.rejectionNote && (
                    <p className="text-slate-500 text-sm mt-2 bg-red-50 p-2 rounded-lg border border-red-100">Reason: {status.request.rejectionNote}</p>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                {profile.documentUrls?.[key] && (
                  <button
                    onClick={() => setViewingDoc({ label, url: profile.documentUrls[key] })}
                    className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    <Eye size={14} /> View
                  </button>
                )}
                
                {/* ✨ FIX: Changed label wrapper to a button opening the modal */}
                {canUploadDirectly && (
                  <button
                    onClick={() => openUploadModal(key, label)}
                    className={`flex-1 sm:flex-none flex justify-center items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-colors
                    ${inGracePeriod ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                  >
                    {inGracePeriod ? <RefreshCw size={14} /> : <UploadCloud size={14} />}
                    {inGracePeriod ? 'Update File & ID' : 'Upload'}
                  </button>
                )}
                
                {canRequest && (
                  <button
                    onClick={() => openRequestModal(key)}
                    className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    <RotateCcw size={14} /> Request Update
                  </button>
                )}
              </div>

            </div>
          </div>
        );
      })}

      {/* ✨ NEW: Upload Modal (Captures ID Number + File) */}
      {uploadModal && (
        <div className="fixed inset-0 z-[80] bg-slate-950/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-slate-900 font-bold text-base">Upload {uploadModal.label}</h3>
              <button onClick={() => setUploadModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{uploadModal.label} Number</label>
                <input 
                  type="text" 
                  value={uploadNumber}
                  onChange={(e) => setUploadNumber(e.target.value.toUpperCase())}
                  placeholder={`Enter ${uploadModal.label} number`}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400 uppercase font-mono"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Document File</label>
                <input 
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple={uploadModal.key === 'dlCert'}
                  onChange={(e) => setUploadFiles(e.target.files)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-600 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {uploadModal.key === 'dlCert' && <p className="text-xs text-slate-400 mt-1.5">Hold Ctrl/Cmd to select up to 3 files.</p>}
              </div>
            </div>

            <button
              onClick={confirmUploadSubmit}
              disabled={isUploading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm py-2.5 rounded-xl disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
            >
              {isUploading ? <><Loader2 size={16} className="animate-spin"/> Uploading...</> : 'Save & Upload'}
            </button>
          </div>
        </div>
      )}

      {requestModal && (
        <div className="fixed inset-0 z-[80] bg-slate-950/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-slate-900 font-bold text-base">Request document update</h3>
              <button onClick={() => setRequestModal(null)} className="text-slate-400 hover:text-slate-600">
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
              placeholder="e.g. Uploaded wrong file, forgot second page..."
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400 resize-none"
            />
            <button
              onClick={submitRequest}
              disabled={submitting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm py-2.5 rounded-xl disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Sending…' : 'Send Request'}
            </button>
          </div>
        </div>
      )}
      
      {viewingDoc && (
        <DocumentViewerModal
          label={viewingDoc.label}
          url={viewingDoc.url}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
};

export default DocumentsTab;