import { motion } from 'framer-motion';
import { MapPin, User, Phone, Building2 } from 'lucide-react';

export const CompanyCardContent = ({ company }) => {
  const city = company.city || company.address?.city || 'Location not specified';
  const status = company.status || 'Active';
  const isActive = status.toLowerCase() === 'active';
  const fallbackText = (company.shortCode || company.companyName).substring(0, 3).toUpperCase();

  const primaryRep = company.representatives?.[0];
  const repName = primaryRep?.name || 'No Rep Assigned';
  const repPhone = primaryRep?.phone || '—';

  return (
    <div className="relative flex flex-col w-full h-full p-4 pt-7">
      
      {/* 
        TOP MIDDLE STATUS BADGE 
        Hangs down from the very top border, freeing up the corners for more breathing room.
      */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-50 px-2 rounded-b-xl border-x border-b border-slate-200 shadow-sm z-10">
        <span className={`text-sm font-black uppercase tracking-wider ${isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {status}
        </span>
      </div>

      {/* BODY: Logo & Name */}
      <div className="flex items-center gap-4 mb-3">
        
        {/* ✨ Logo: The "Goldilocks" fix! Nudged up exactly 8px (-translate-y-2) to perfectly split the difference */}
        {company.logoUrl ? (
          <div className="w-14 h-14 rounded-full border border-slate-200 overflow-hidden shrink-0 shadow-sm bg-slate-50 relative z-10 -translate-y-2">
            <img src={company.logoUrl} alt={company.companyName} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm relative z-10 -translate-y-2">
            <Building2 size={24} className="text-slate-400" />
          </div>
        )}
        
        {/* NAME & SUBSCRIPT SHORT CODE */}
        <div className="flex flex-col w-fit min-w-0 max-w-full">
          <h3 className="text-slate-900 font-black text-xl leading-none truncate pb-1">
            {company.companyName}
          </h3>
          <div className="w-full text-right">
            <span className="text-slate-500 text-sm font-bold tracking-widest uppercase">
              {company.shortCode || fallbackText}
            </span>
          </div>
        </div>

      </div>

      {/* FOOTER: Rep & Location (Side-by-Side with text-sm minimums) */}
      <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center gap-4">
        
        {/* Left: Rep Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-slate-100 p-2 rounded-full text-slate-500 shrink-0 border border-slate-200">
            <User size={16} />
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="text-slate-900 text-sm font-bold truncate">{repName}</span>
            <span className="text-slate-500 text-sm font-bold flex items-center gap-1.5 truncate mt-0.5">
              <Phone size={14} /> {repPhone}
            </span>
          </div>
        </div>

        {/* Right: City Badge */}
        <div className="shrink-0 flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg text-slate-600">
          <MapPin size={16} className="text-slate-400 shrink-0" />
          <span className="text-sm font-bold truncate max-w-[140px]">{city}</span>
        </div>
        
      </div>

    </div>
  );
};

export const CompanyCard = ({ company, index, onClick }) => {
  return (
    <motion.div
      layoutId={`company-card-${company._id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow h-full flex relative"
    >
      <CompanyCardContent company={company} />
    </motion.div>
  );
};