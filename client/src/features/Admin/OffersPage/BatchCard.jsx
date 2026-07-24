import { AlertTriangle, Clock, CheckCircle2, ChevronRight } from 'lucide-react';

const getExpiryBadge = (dateStr) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr); expiry.setHours(0, 0, 0, 0);
  const timeDiff = expiry.getTime() - today.getTime();
  const monthsLeft = (expiry.getFullYear() - today.getFullYear()) * 12 + (expiry.getMonth() - today.getMonth());
  
  if (timeDiff < 0) return { text: 'Expired', style: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle };
  if (monthsLeft <= 1) return { text: '≤ 1 Month', style: 'bg-rose-100 text-rose-700 border-rose-200', icon: AlertTriangle };
  if (monthsLeft <= 3) return { text: '≤ 3 Months', style: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock };
  if (monthsLeft <= 6) return { text: '≤ 6 Months', style: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock };
  return { text: 'Valid', style: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
};

const formatExp = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
};

export default function BatchCard({ batch, index, onOpenModal, onToggleStatus, onDeleteOffer }) {
  const badge = getExpiryBadge(batch.expiryDate);
  const BadgeIcon = badge.icon;

  let statusBadge = null;
  if (batch.offer) {
    const isScheduled = batch.offer.isActive && new Date(batch.offer.startDate) > new Date();
    if (!batch.offer.isActive) {
      statusBadge = <span className="bg-orange-100 text-orange-700 border border-orange-200 px-3 py-0.5 rounded-md text-base font-black shadow-sm">PAUSED</span>;
    } else if (isScheduled) {
      const d = new Date(batch.offer.startDate);
      const formattedTime = `Scheduled at ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)} and ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      statusBadge = <span className="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-0.5 rounded-md text-sm font-black shadow-sm">{formattedTime}</span>;
    } else {
      statusBadge = <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-0.5 rounded-md text-base font-black shadow-sm">ACTIVE</span>;
    }
  } else {
    statusBadge = <span className="bg-slate-100 text-slate-500 border border-slate-200 px-3 py-0.5 rounded-md text-base font-black shadow-sm">NO OFFER</span>;
  }

  return (
    <div className="relative flex flex-col md:flex-row bg-white rounded-2xl border border-slate-200 shadow-sm group hover:border-slate-300 transition-colors p-2.5">
      
      <div className="absolute top-0 left-0 bg-slate-800 text-white text-sm font-bold px-2 py-1 rounded-br-2xl rounded-tl-xl shadow-sm z-20">
        #{index + 1}
      </div>

      <div className={`absolute top-0 right-0 flex items-center gap-1.5 px-3 py-1 rounded-bl-2xl rounded-tr-xl text-base font-bold shadow-sm z-20 ${badge.style}`}>
        <BadgeIcon size={14} /> {badge.text}
      </div>

      <div className="flex-1 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 pr-0 md:pr-4">
        
        <div className="w-full rounded-xl p-2 bg-slate-50 border border-slate-200 shrink-0 md:mt-0">
          <p className="font-black text-slate-900 text-lg md:text-xl leading-tight truncate px-4 md:px-28">
            {batch.productName}
          </p>
        </div>

        <div className="flex justify-around items-center mt-2 w-full px-2">
          <p className="text-base font-bold text-slate-500">BATCH: {batch.batchNumber}</p>
          <p className="text-base font-bold text-slate-500">{batch.companyShortCode || batch.company}</p>
        </div>

        <div className="flex justify-between items-center mt-3 w-full px-2">
          <span className="text-base font-bold text-slate-700">📦 {batch.remainingUnits} Units</span>
          <span className="text-base font-bold text-slate-700">Exp: {formatExp(batch.expiryDate)}</span>
          <span className="text-base font-bold text-slate-700">MRP: ₹{batch.mrp?.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center mt-3 w-full px-2 pb-2 md:pb-0">
          <span className="text-base font-black text-slate-900">PTR: ₹{batch.sellingRate?.toFixed(2)}</span>
          {statusBadge}
        </div>
      </div>

      <div className="w-full md:w-60 pl-0 md:pl-4 pt-4 md:pt-0 flex flex-col justify-center gap-2">
        {batch.offer ? (
          <>
            <div className="bg-white border border-emerald-200 rounded-lg p-2.5 shadow-sm text-center">
              <p className="text-base font-bold text-slate-800 line-clamp-2">{batch.offer.description}</p>
            </div>
            
            <div className="flex flex-col gap-2 mt-1">
              <button 
                onClick={() => onOpenModal(batch)} 
                className="w-full py-2 bg-white border border-slate-300 rounded-lg text-base font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
              >
                Edit
              </button>
              
              <div className="flex gap-2 w-full">
                <button 
                  onClick={() => onToggleStatus(batch)} 
                  className={`flex-1 py-1.5 border rounded-lg text-sm font-bold shadow-sm transition-colors ${batch.offer.isActive ? 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100' : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'}`}
                >
                  {batch.offer.isActive ? 'Pause' : 'Activate'}
                </button>
                <button 
                  onClick={() => onDeleteOffer(batch.id)} 
                  className="flex-1 py-1.5 bg-red-50 border border-red-300 rounded-lg text-sm font-bold text-red-600 hover:bg-red-100 transition-colors shadow-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col justify-center py-2 h-full">
            <button 
              onClick={() => onOpenModal(batch)}
              className="w-full flex items-center justify-center gap-1.5 py-4 bg-slate-900 text-white rounded-xl font-bold shadow-md hover:bg-slate-800 transition-all active:scale-95 text-base"
            >
              Make Offer <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}



// import { AlertTriangle, Clock, CheckCircle2, ChevronRight } from 'lucide-react';

// const getExpiryBadge = (dateStr) => {
//   const today = new Date(); today.setHours(0, 0, 0, 0);
//   const expiry = new Date(dateStr); expiry.setHours(0, 0, 0, 0);
//   const timeDiff = expiry.getTime() - today.getTime();
//   const monthsLeft = (expiry.getFullYear() - today.getFullYear()) * 12 + (expiry.getMonth() - today.getMonth());
  
//   if (timeDiff < 0) return { text: 'Expired', style: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle };
//   if (monthsLeft <= 1) return { text: '≤ 1 Month', style: 'bg-rose-100 text-rose-700 border-rose-200', icon: AlertTriangle };
//   if (monthsLeft <= 3) return { text: '≤ 3 Months', style: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock };
//   if (monthsLeft <= 6) return { text: '≤ 6 Months', style: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock };
//   return { text: 'Valid', style: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
// };

// const formatExp = (dateStr) => {
//   if (!dateStr) return '—';
//   const date = new Date(dateStr);
//   return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
// };

// export default function BatchCard({ batch, index, onOpenModal, onToggleStatus, onDeleteOffer }) {
//   const badge = getExpiryBadge(batch.expiryDate);
//   const BadgeIcon = badge.icon;

//   // Derive Offer Status Logic
//   let statusBadge = null;
//   if (batch.offer) {
//     const isScheduled = batch.offer.isActive && new Date(batch.offer.startDate) > new Date();
//     if (!batch.offer.isActive) {
//       statusBadge = <span className="bg-orange-100 text-orange-700 border border-orange-200 px-3 py-0.5 rounded-md text-base font-black shadow-sm">SUSPENDED</span>;
//     } else if (isScheduled) {
//       statusBadge = <span className="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-0.5 rounded-md text-base font-black shadow-sm">SCHEDULED</span>;
//     } else {
//       statusBadge = <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-0.5 rounded-md text-base font-black shadow-sm">ACTIVE</span>;
//     }
//   } else {
//     statusBadge = <span className="bg-slate-100 text-slate-500 border border-slate-200 px-3 py-0.5 rounded-md text-base font-black shadow-sm">NO OFFER</span>;
//   }

//   return (
//     <div className="relative flex flex-col md:flex-row bg-white rounded-2xl border border-slate-200 shadow-sm group hover:border-slate-300 transition-colors p-2.5">
      
//       <div className="absolute top-0 left-0 bg-slate-800 text-white text-sm font-bold px-2 py-1 rounded-br-2xl rounded-tl-xl shadow-sm z-20">
//         #{index + 1}
//       </div>

//       <div className={`absolute top-0 right-0 flex items-center gap-1.5 px-3 py-1 rounded-bl-2xl rounded-tr-xl text-base font-bold shadow-sm z-20 ${badge.style}`}>
//         <BadgeIcon size={14} /> {badge.text}
//       </div>

//       {/* Left Side: Product Info */}
//       <div className="flex-1 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 pr-0 md:pr-4">
        
//         <div className="w-full rounded-xl p-2 bg-slate-50 border border-slate-200 shrink-0 md:mt-0">
//           <p className="font-black text-slate-900 text-lg md:text-xl leading-tight truncate px-4 md:px-28">
//             {batch.productName}
//           </p>
//         </div>

//         <div className="flex justify-around items-center mt-2 w-full px-2">
//           <p className="text-base font-bold text-slate-500">BATCH: {batch.batchNumber}</p>
//           <p className="text-base font-bold text-slate-500">{batch.companyShortCode || batch.company}</p>
//         </div>

//         <div className="flex justify-between items-center mt-3 w-full px-2">
//           <span className="text-base font-bold text-slate-700">📦 {batch.remainingUnits} Units</span>
//           <span className="text-base font-bold text-slate-700">Exp: {formatExp(batch.expiryDate)}</span>
//           <span className="text-base font-bold text-slate-700">MRP: ₹{batch.mrp?.toFixed(2)}</span>
//         </div>

//         <div className="flex justify-between items-center mt-3 w-full px-2 pb-2 md:pb-0">
//           <span className="text-base font-black text-slate-900">PTR: ₹{batch.sellingRate?.toFixed(2)}</span>
//           {statusBadge}
//         </div>
//       </div>

//       {/* Right Side: Action Area */}
//       <div className="w-full md:w-60 pl-0 md:pl-4 pt-4 md:pt-0 flex flex-col justify-center gap-2">
//         {batch.offer ? (
//           <>
//             <div className="bg-white border border-emerald-200 rounded-lg p-2.5 shadow-sm text-center">
//               <p className="text-base font-bold text-slate-800 line-clamp-2">{batch.offer.description}</p>
//             </div>
            
//             {/* The 3-Button Layout */}
//             <div className="flex flex-col gap-2 mt-1">
//               <button 
//                 onClick={() => onOpenModal(batch)} 
//                 className="w-full py-2 bg-white border border-slate-300 rounded-lg text-base font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
//               >
//                 Edit Details
//               </button>
              
//               <div className="flex gap-2 w-full">
//                 <button 
//                   onClick={() => onToggleStatus(batch)} 
//                   className={`flex-1 py-1.5 border rounded-lg text-sm font-bold shadow-sm transition-colors ${batch.offer.isActive ? 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100' : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'}`}
//                 >
//                   {batch.offer.isActive ? 'Suspend' : 'Activate'}
//                 </button>
//                 <button 
//                   onClick={() => onDeleteOffer(batch.id)} 
//                   className="flex-1 py-1.5 bg-red-50 border border-red-300 rounded-lg text-sm font-bold text-red-600 hover:bg-red-100 transition-colors shadow-sm"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           </>
//         ) : (
//           <div className="flex flex-col justify-center py-2 h-full">
//             <button 
//               onClick={() => onOpenModal(batch)}
//               className="w-full flex items-center justify-center gap-1.5 py-4 bg-slate-900 text-white rounded-xl font-bold shadow-md hover:bg-slate-800 transition-all active:scale-95 text-base"
//             >
//               Make Offer <ChevronRight size={18} />
//             </button>
//           </div>
//         )}
//       </div>

//     </div>
//   );
// }