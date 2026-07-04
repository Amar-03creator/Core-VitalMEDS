import { Phone, MessageCircle, ChevronRight } from 'lucide-react';

/**
 * CompanyListItem
 * Single row/card for the Companies list page.
 * Per spec: clicking navigates to the Company Detail page — no inline
 * accordion, no dropdown menu.
 */
export const CompanyListItem = ({ company, onClick }) => {
  const mainRep = company.representatives?.[0];
  const contactNumber = mainRep?.phone || company.whatsapp;
  const isWhatsApp = !mainRep?.phone && !!company.whatsapp;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] p-4 flex items-center gap-3"
    >
      <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
        <span className="text-emerald-400 font-bold text-xs">
          {(company.shortCode || company.companyName).slice(0, 3).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-slate-900 font-semibold text-base truncate">{company.companyName}</p>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              company.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {company.status}
          </span>
        </div>

        <p className="text-slate-500 text-sm truncate">{company.gstin || 'No GSTIN on file'}</p>

        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {contactNumber && (
            <span className="flex items-center gap-1 text-sm text-slate-600">
              {isWhatsApp ? (
                <MessageCircle size={13} className="text-emerald-500" />
              ) : (
                <Phone size={13} className="text-slate-400" />
              )}
              {contactNumber}
            </span>
          )}
          {mainRep?.name && <span className="text-sm text-slate-400">{mainRep.name}</span>}
        </div>
      </div>

      <ChevronRight size={18} className="text-slate-300 shrink-0" />
    </button>
  );
};