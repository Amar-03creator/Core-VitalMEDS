import { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { api } from '../../../../services/api';
import { toast } from 'sonner';
import { DebitNoteCard } from '../components/DebitNoteCard';
import { ReturnToCompanyModal } from '../modals/ReturnToCompanyModal';

export const DebitNotesTab = ({ company, onCompanyUpdated }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await api.getDebitNotesBySupplier(company._id);
      setNotes(res.data || []);
    } catch {
      toast.error('Failed to load debit notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotes(); }, [company._id]);

  const handleMarkApplied = async (noteId) => {
    try {
      await api.markDebitNoteApplied(noteId);
      toast.success('Debit note marked as applied.');
      await fetchNotes();
      // Refresh the parent's pendingRefunds figure too, since it just changed server-side.
      const refreshed = await api.getCompanyById(company._id);
      onCompanyUpdated(refreshed.data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReturnSaved = async () => {
    await fetchNotes();
    const refreshed = await api.getCompanyById(company._id);
    onCompanyUpdated(refreshed.data);
  };

  if (loading) {
    return <p className="py-10 text-center text-slate-500 text-base">Loading debit notes…</p>;
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowReturnModal(true)}
        className="w-full flex items-center justify-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 font-semibold py-3 rounded-xl text-base"
      >
        <RotateCcw size={16} /> Return to Company (Debit Note)
      </button>

      {company.pendingRefunds > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-amber-700 font-semibold text-base">
            ₹{Math.round(company.pendingRefunds).toLocaleString('en-IN')} total refund pending
          </p>
          <p className="text-amber-600 text-sm mt-0.5">Across all unadjusted debit notes below</p>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-base bg-white rounded-2xl border border-slate-200">
          No returns recorded for this supplier
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <DebitNoteCard key={note._id} note={note} onMarkApplied={handleMarkApplied} />
          ))}
        </div>
      )}

      {showReturnModal && (
        <ReturnToCompanyModal
          company={company}
          onClose={() => setShowReturnModal(false)}
          onSaved={handleReturnSaved}
        />
      )}
    </div>
  );
};