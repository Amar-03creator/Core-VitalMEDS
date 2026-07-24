// client/src/features/Admin/CustomersPage/modals/DocumentViewerModal.jsx
import { X, FileX2, ExternalLink } from 'lucide-react';

/*
 * Opened by clicking a document-backed field (GSTIN, PAN, Aadhaar, DL 20B,
 * DL 21B) in the Business Information card. Actual upload/storage (S3 or
 * Cloudinary) isn't wired up yet — this just renders whatever URL already
 * lives on client.documentUrls.*, with a clean empty state when there
 * isn't one yet so the UI doesn't dead-end once uploads are wired in.
 */
const isPdf = (url = '') => url.toLowerCase().split('?')[0].endsWith('.pdf');

export const DocumentViewerModal = ({ label, url, onClose }) => (
  <>
    <div className="fixed inset-0 z-[80] bg-black/60" onClick={onClose} />
    <div className="fixed inset-x-0 bottom-0 sm:inset-0 z-[80] flex sm:items-center sm:justify-center">
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[85dvh] sm:max-h-[80vh] overflow-hidden flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base truncate pr-2">{label}</h3>
          <div className="flex items-center gap-3 shrink-0">
            {url && (
              <a href={url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-600" aria-label="Open in new tab">
                <ExternalLink size={18} />
              </a>
            )}
            <button onClick={onClose} aria-label="Close"><X size={20} className="text-slate-400" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center min-h-[240px]">
          {!url ? (
            <div className="text-center py-16 px-6 text-slate-400">
              <FileX2 size={36} className="mx-auto mb-3 opacity-50" />
              <p className="text-base font-semibold text-slate-500">Not uploaded yet</p>
              <p className="text-sm mt-1">The client hasn't provided this document.</p>
            </div>
          ) : isPdf(url) ? (
            <iframe src={url} title={label} className="w-full h-[70vh] sm:h-[60vh] border-0" />
          ) : (
            <img src={url} alt={label} className="max-w-full max-h-[70vh] sm:max-h-[60vh] object-contain" />
          )}
        </div>
      </div>
    </div>
  </>
);