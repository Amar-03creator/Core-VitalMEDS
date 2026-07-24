import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function NoticeBanner({ notice, onDismiss }) {
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [notice, onDismiss]);

  if (!notice) return null;
  const isError = notice.type === 'error';
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-base font-semibold mb-2
      ${isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
      <span>{notice.message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100"><X size={18} /></button>
    </div>
  );
}