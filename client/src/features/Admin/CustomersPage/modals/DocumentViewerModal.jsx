import { useState, useEffect } from 'react';
import { X, FileX2, CheckCircle2, AlertCircle, Loader2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../../services/api';
import { useBackHandler, useScrollLock } from '../../../../hooks/useBackHandler'; 

const isPdf = (url = '') => url.toLowerCase().split('?')[0].endsWith('.pdf');

export const DocumentViewerModal = ({ client, docKey, label, url, onClose }) => {
  const urls = url ? url.split(',') : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // ✨ NEW: State to track if the current media is downloading
  const [mediaLoading, setMediaLoading] = useState(true);
  
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [loading, setLoading] = useState(false);

  useScrollLock(true); 
  useBackHandler(true, onClose, `docViewer_${docKey}`);

  const isVerified = client?.documentVerification?.[docKey] === true;
  const currentUrl = urls[currentIndex];

  // ✨ NEW: Reset loading state to true whenever the user changes the page
  useEffect(() => {
    setMediaLoading(true);
  }, [currentIndex, currentUrl]);

  const requests = (client?.documentRequests || []).filter(r => r.documentType === docKey);
  const latestRequest = requests.slice().sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))[0];
  const isAlreadyRejected = latestRequest?.status === 'rejected';

  const handleNext = () => setCurrentIndex((prev) => (prev < urls.length - 1 ? prev + 1 : prev));
  const handlePrev = () => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));

  const handleDownload = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const ext = fileUrl.split('.').pop().split('?')[0] || 'pdf';
      link.download = `${fileName.replace(/\s+/g, '_')}_${currentIndex + 1}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(fileUrl, '_blank');
    }
  };

  const onRequestChangesClick = () => {
    if (isAlreadyRejected) {
      toast.error('You already asked for changes for this document.');
      return;
    }
    setIsRejecting(true);
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      await api.verifyClientDocument(client._id, docKey, true);
      toast.success(`${label} verified successfully!`);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error('Failed to verify document.');
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionNote.trim()) {
      toast.error('Please provide a reason for rejecting the document.');
      return;
    }
    
    if (rejectionNote.length > 50) {
      toast.error(`Reason must be under 50 characters. (Currently ${rejectionNote.length})`);
      return;
    }

    setLoading(true);
    try {
      await api.verifyClientDocument(client._id, docKey, false, rejectionNote);
      toast.success(`Request sent for new ${label}.`);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error('Failed to reject document.');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 z-[9999] flex sm:items-center sm:justify-center pt-16 sm:pt-14 px-0 sm:px-4">
        <div className="w-full sm:max-w-5xl bg-white rounded-t-2xl sm:rounded-2xl h-[90dvh] sm:h-[85vh] overflow-hidden flex flex-col shadow-2xl">
          
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3 pr-2">
              <h3 className="font-bold text-slate-900 text-lg truncate">{label}</h3>
              {urls.length > 1 && (
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                  {currentIndex + 1} of {urls.length}
                </span>
              )}
              {isVerified && (
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={12} /> Verified
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {currentUrl && (
                <button 
                  onClick={() => handleDownload(currentUrl, label)}
                  className="flex items-center gap-1.5 text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                >
                  <Download size={16} /> <span>Download</span>
                </button>
              )}
              <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-900 transition-colors p-1.5 bg-slate-50 rounded-full hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Document Viewer Area with Pager */}
          <div className="flex-1 overflow-hidden bg-slate-100 relative flex items-center justify-center p-2 sm:p-4">
            {urls.length === 0 ? (
              <div className="text-center p-6 text-slate-400">
                <FileX2 size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-base font-semibold text-slate-500">Not uploaded yet</p>
              </div>
            ) : (
              <>
                {urls.length > 1 && currentIndex > 0 && (
                  <button onClick={handlePrev} className="absolute left-2 sm:left-4 z-20 p-2 sm:p-3 bg-white/90 hover:bg-white rounded-full shadow-lg text-slate-800 transition-transform hover:scale-105">
                    <ChevronLeft size={28} />
                  </button>
                )}

                <div className="w-full h-full flex items-center justify-center bg-white rounded-lg shadow-inner overflow-hidden relative">
                  
                  {/* ✨ NEW: Loading Overlay Spinner */}
                  {mediaLoading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50">
                      <Loader2 size={36} className="animate-spin text-blue-500 mb-3" />
                      <p className="text-sm font-semibold text-slate-400 animate-pulse">Loading document...</p>
                    </div>
                  )}

                  {isPdf(currentUrl) ? (
                    <>
                      {/* ✨ FIX: Added onLoad handlers and smooth opacity transitions */}
                      <object 
                        data={currentUrl} 
                        type="application/pdf" 
                        onLoad={() => setMediaLoading(false)}
                        className={`w-full h-full border-0 hidden sm:block transition-opacity duration-300 ${mediaLoading ? 'opacity-0' : 'opacity-100'}`}
                      >
                        <div className="text-center p-6 bg-slate-50 flex flex-col items-center justify-center h-full">
                          <p className="text-slate-500 mb-3">Your browser does not support inline PDF previews.</p>
                          <button onClick={() => handleDownload(currentUrl, label)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">
                            Download to View
                          </button>
                        </div>
                      </object>
                      <iframe 
                        src={`https://docs.google.com/gview?url=${encodeURIComponent(currentUrl)}&embedded=true`} 
                        title={`${label} Mobile`} 
                        onLoad={() => setMediaLoading(false)}
                        className={`w-full h-full border-0 block sm:hidden transition-opacity duration-300 ${mediaLoading ? 'opacity-0' : 'opacity-100'}`} 
                      />
                    </>
                  ) : (
                    <img 
                      src={currentUrl} 
                      alt={label} 
                      onLoad={() => setMediaLoading(false)}
                      onError={() => setMediaLoading(false)} // Stops the spinner if image breaks
                      className={`w-full h-full object-contain bg-slate-50 transition-opacity duration-300 ${mediaLoading ? 'opacity-0' : 'opacity-100'}`} 
                    />
                  )}
                </div>

                {urls.length > 1 && currentIndex < urls.length - 1 && (
                  <button onClick={handleNext} className="absolute right-2 sm:right-4 z-20 p-2 sm:p-3 bg-white/90 hover:bg-white rounded-full shadow-lg text-slate-800 transition-transform hover:scale-105">
                    <ChevronRight size={28} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Action Footer Bar */}
          {urls.length > 0 && client && docKey && (
            <div className="shrink-0 bg-white border-t border-slate-200 p-4">
              {isRejecting ? (
                <div className="animate-in slide-in-from-bottom-2 duration-200">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700 block">Why is this document invalid?</label>
                    <span className={`text-[10px] font-bold ${rejectionNote.length > 50 ? 'text-red-500' : 'text-slate-400'}`}>
                      {rejectionNote.length} / 50
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      autoFocus
                      maxLength={50}
                      placeholder="e.g., Image is blurry..."
                      value={rejectionNote}
                      onChange={(e) => setRejectionNote(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-red-400 text-sm"
                    />
                    <div className="flex gap-2 shrink-0 mt-2 sm:mt-0">
                      <button 
                        onClick={() => setIsRejecting(false)} 
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleReject}
                        disabled={loading}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <AlertCircle size={14} />}
                        Send Request
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs text-slate-500 hidden sm:block">
                    {isVerified ? "This document is verified." : "Review document carefully."}
                  </p>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={onRequestChangesClick}
                      className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors
                        ${isAlreadyRejected ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'text-red-600 bg-red-50 hover:bg-red-100'}`}
                    >
                      {isAlreadyRejected ? 'Changes Requested' : 'Request Changes'}
                    </button>
                    
                    {!isVerified && (
                      <button 
                        onClick={handleVerify}
                        disabled={loading}
                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-bold text-white bg-emerald-500 hover:bg-emerald-600 text-sm flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                      >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Verify
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};