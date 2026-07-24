import { useState, useEffect, useRef } from 'react';
import { X, Search, Sparkles, Bell, Info } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../services/api';
import { useModalTrap, useScrollLock } from '../../../hooks/useBackHandler';

const formatExp = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
};

const getLocalCurrentDateTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

export default function CreateOfferModal({ isOpen, onClose, prefillBatch, onSave }) {
  useModalTrap(isOpen, { onBackClose: onClose, customId: 'createOfferModal' });
  useScrollLock(isOpen);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const searchTimeout = useRef(null);

  const [totalQty, setTotalQty] = useState('');
  const [freeQty, setFreeQty] = useState('');
  const [offerPTR, setOfferPTR] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState('percent'); 
  const [notifyClients, setNotifyClients] = useState(true); 

  useEffect(() => {
    if (prefillBatch) {
      setSelectedBatch(prefillBatch);
      if (prefillBatch.offer) {
        // 1. IF EDITING AN EXISTING OFFER: Keep the original start date
        setTotalQty(prefillBatch.offer.minBuyQty || '');
        setFreeQty(prefillBatch.offer.freeQty || '');
        setOfferPTR(prefillBatch.offer.offerPTR || '');
        setStartDate(prefillBatch.offer.startDate ? prefillBatch.offer.startDate.slice(0, 16) : '');
        setEndDate(prefillBatch.offer.endDate ? prefillBatch.offer.endDate.slice(0, 16) : '');
        
        if (prefillBatch.offer.discountPercent > 0) {
          setDiscountValue(prefillBatch.offer.discountPercent);
          setDiscountType('percent');
        } else if (prefillBatch.offer.discountAmount > 0) {
          setDiscountValue(prefillBatch.offer.discountAmount);
          setDiscountType('amount');
        }
      } else {
        // 2. IF MAKING A NEW OFFER (From Batch Card): Set Start Date to NOW
        setTotalQty(''); setFreeQty(''); setOfferPTR(''); setDiscountValue(''); setDiscountType('percent');
        setStartDate(getLocalCurrentDateTime()); // 👈 SETS TO NOW
        setEndDate('');
      }
    } else {
      // 3. IF MAKING A NEW OFFER (From 'Make Custom Offer' Button): Set Start Date to NOW
      setSelectedBatch(null); setSearchQuery(''); setSearchResults([]);
      setTotalQty(''); setFreeQty(''); setOfferPTR(''); setDiscountValue(''); setDiscountType('percent');
      setStartDate(getLocalCurrentDateTime()); // 👈 SETS TO NOW
      setEndDate('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillBatch, isOpen]);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (val.trim().length <= 2) { 
      setSearchResults([]); 
      return; 
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await api.getProductsWithBatches(); 
        const matched = res.data.filter(p => p.name.toLowerCase().includes(val.toLowerCase()));
        
        const flatBatches = matched.flatMap(prod => 
          prod.batches.map(b => ({
            id: b._id, 
            productId: prod.id, 
            productName: prod.name, 
            company: prod.company,
            batchNumber: b.no, 
            expiryDate: b.expiry, 
            mrp: b.mrp, 
            sellingRate: prod.defaultRate, 
            remainingUnits: b.stock
          }))
        );
        setSearchResults(flatBatches);
      } catch { }
    }, 300);
  };

  const generateOfferText = () => {
    let parts = [];
    const tQty = Number(totalQty) || 0;
    const fQty = Number(freeQty) || 0;
    const dVal = Number(discountValue) || 0;

    if (tQty > 0) {
      if (fQty > 0 && tQty > fQty) parts.push(`Order ${tQty}, Pay for ${tQty - fQty} (${fQty} Free)`);
      else if (fQty >= tQty) parts.push(`Order ${tQty} (100% Free)`); 
      else parts.push(`Min Order: ${tQty}`); 
    } else if (fQty > 0) parts.push(`Get ${fQty} Free`); 
    
    if (dVal > 0) parts.push(discountType === 'percent' ? `${dVal}% Off` : `₹${dVal} Off`);
    if (Number(offerPTR) > 0) parts.push(`@ PTR ₹${offerPTR}`);

    if (parts.length === 0) return "Fill fields below to generate offer.";
    return parts.join(' + ').replace('+ @', '@'); 
  };

  const handleSaveData = async (isDraft) => {
    if (!selectedBatch) return toast.error("Please select a batch.");
    
    const tQty = Number(totalQty) || 0;
    const fQty = Number(freeQty) || 0;
    const dVal = Number(discountValue) || 0;
    const ptr = Number(offerPTR) || 0;

    if (tQty === 0 && fQty === 0 && dVal === 0 && ptr === 0) {
      return toast.error("Please fill out at least one detail to create an offer.");
    }

    if (fQty > 0 && tQty < fQty) {
      return toast.error("Total Order Qty must be greater than or equal to the Free Qty.");
    }

    const offerText = generateOfferText();

    try {
      const payload = {
        notifyClients: notifyClients && !isDraft,
        offer: {
          isActive: !isDraft,
          minBuyQty: tQty,
          freeQty: fQty,
          discountPercent: discountType === 'percent' ? dVal : 0,
          discountAmount: discountType === 'amount' ? dVal : 0,
          offerPTR: ptr > 0 ? ptr : null,
          description: offerText,
          startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : null
        }
      };

      await api.updateBatchOffer(selectedBatch.id, payload);
      
      if (!isDraft && notifyClients) toast.success("Offer Activated and clients notified!");
      else toast.success(isDraft ? "Draft Saved." : "Offer Activated silently.");

      onSave();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save offer.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-[1.5rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="text-amber-500" size={20} /> {prefillBatch?.offer ? 'Edit Scheme' : 'Make Offer'}
          </h2>
          <button onClick={onClose} className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
          
          {prefillBatch?.offer && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl flex gap-3 items-start shadow-sm">
              <Info size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm font-bold leading-tight">Previous offer data has been prefilled. You may modify the details below.</p>
            </div>
          )}

          {!selectedBatch && (
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Search Target Batch</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  autoFocus type="text" value={searchQuery} onChange={handleSearch}
                  placeholder="Type product name..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-sm font-semibold transition-colors"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-52 overflow-y-auto mt-2">
                  {searchResults.map(b => (
                    <button key={b.id} onClick={() => setSelectedBatch(b)} className="w-full text-left p-3 hover:bg-slate-50 border-b last:border-0 border-slate-100 transition-colors">
                      <p className="font-bold text-slate-900 text-sm">{b.productName}</p>
                      <p className="text-sm font-semibold text-slate-500 mt-1">Batch: {b.batchNumber} <span className="mx-1">|</span> Exp: {formatExp(b.expiryDate)} <span className="mx-1">|</span> Stock: {b.remainingUnits}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedBatch && (
            <div className="bg-slate-900 rounded-xl p-4 text-white shadow-md relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-sm text-emerald-400 font-bold uppercase tracking-widest mb-1">Target Batch</p>
                <h3 className="text-xl font-black">{selectedBatch.productName}</h3>
                <p className="text-sm text-slate-300 font-medium mt-1.5 flex flex-wrap items-center gap-2">
                  <span>Batch: <span className="text-white font-bold">{selectedBatch.batchNumber}</span></span>
                  <span className="text-slate-600">•</span>
                  <span>Exp: <span className="text-white font-bold">{formatExp(selectedBatch.expiryDate)}</span></span>
                  <span className="text-slate-600">•</span>
                  <span>Stock: <span className="text-white font-bold">{selectedBatch.remainingUnits}</span></span>
                </p>
                <p className="text-sm text-slate-400 font-medium mt-1">
                  {selectedBatch.company} | MRP: ₹{selectedBatch.mrp}
                </p>
              </div>
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/20 blur-2xl rounded-full"></div>
            </div>
          )}

          {selectedBatch && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Orders Total (Qty)</label>
                  <input type="number" placeholder="15" value={totalQty} onChange={e => setTotalQty(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-lg font-black text-slate-900 focus:outline-none focus:border-slate-400 shadow-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-emerald-600 uppercase tracking-wide">Free (Qty)</label>
                  <input type="number" placeholder="2" value={freeQty} onChange={e => setFreeQty(e.target.value)} className="w-full px-3 py-2.5 border border-emerald-300 bg-emerald-50 rounded-xl text-lg font-black text-emerald-900 focus:outline-none focus:border-emerald-500 shadow-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-blue-600 uppercase tracking-wide">Offer PTR (₹)</label>
                  <input type="number" placeholder="e.g. 35" value={offerPTR} onChange={e => setOfferPTR(e.target.value)} className="w-full px-3 py-2.5 border border-blue-200 bg-blue-50/50 rounded-xl text-lg font-bold text-blue-900 focus:outline-none focus:border-blue-400" />
                  <p className="text-sm font-semibold text-slate-500 mt-1">Std PTR: ₹{selectedBatch.sellingRate}</p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-bold text-amber-600 uppercase tracking-wide">Discount</label>
                  <div className="flex items-stretch shadow-sm rounded-xl h-[46px]">
                    <input 
                      type="number" placeholder="0" value={discountValue} onChange={e => setDiscountValue(e.target.value)} 
                      className="flex-1 w-full px-3 h-full border border-amber-200 border-r-0 bg-amber-50/50 rounded-l-xl text-lg font-bold text-amber-900 focus:outline-none focus:border-amber-400" 
                    />
                    <button 
                      onClick={() => setDiscountType(t => t === 'percent' ? 'amount' : 'percent')} 
                      className="px-4 h-full bg-white border border-slate-300 rounded-r-xl text-sm font-black text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {discountType === 'percent' ? '%' : '₹'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Start Date</label>
                  <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 shadow-sm" />
                  <p className="text-sm text-slate-400 font-semibold mt-1">Blank = start immediately.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">End Date</label>
                  <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 shadow-sm" />
                  <p className="text-sm text-slate-400 font-semibold mt-1">Blank = no expiry.</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-center">
                <p className="text-sm font-bold text-slate-700 text-center">
                  Preview: <span className="text-emerald-600">"{generateOfferText()}"</span>
                </p>
              </div>

              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox" checked={notifyClients} onChange={(e) => setNotifyClients(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-slate-300"
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Bell size={16} className="text-amber-500"/> Notify Clients
                  </p>
                </div>
              </label>

            </div>
          )}
        </div>

        {selectedBatch && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2 w-full">
            <button onClick={onClose} className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors shadow-sm">
              Cancel
            </button>
            <button onClick={() => handleSaveData(true)} className="flex-1 bg-blue-50 border border-blue-200 text-blue-700 py-3 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors shadow-sm">
              Save Draft
            </button>
            <button onClick={() => handleSaveData(false)} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95">
              {prefillBatch?.offer?.isActive ? 'Update' : 'Activate'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}



// import { useState, useEffect, useRef } from 'react';
// import { X, Search, Sparkles, Bell, Info } from 'lucide-react';
// import { toast } from 'sonner';
// import { api } from '../../../services/api';
// import { useModalTrap, useScrollLock } from '../../../hooks/useBackHandler';

// const formatExp = (dateStr) => {
//   if (!dateStr) return '—';
//   const date = new Date(dateStr);
//   return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
// };

// export default function CreateOfferModal({ isOpen, onClose, prefillBatch, onSave }) {
//   useModalTrap(isOpen, { onBackClose: onClose, customId: 'createOfferModal' });
//   useScrollLock(isOpen);

//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [selectedBatch, setSelectedBatch] = useState(null);
//   const searchTimeout = useRef(null);

//   // Form State
//   const [totalQty, setTotalQty] = useState('');
//   const [freeQty, setFreeQty] = useState('');
//   const [offerPTR, setOfferPTR] = useState('');
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [discountValue, setDiscountValue] = useState('');
//   const [discountType, setDiscountType] = useState('percent'); 
//   const [notifyClients, setNotifyClients] = useState(true); 

//   useEffect(() => {
//     if (prefillBatch) {
//       setSelectedBatch(prefillBatch);
//       if (prefillBatch.offer) {
//         setTotalQty(prefillBatch.offer.minBuyQty || '');
//         setFreeQty(prefillBatch.offer.freeQty || '');
//         setOfferPTR(prefillBatch.offer.offerPTR || '');
//         setStartDate(prefillBatch.offer.startDate ? prefillBatch.offer.startDate.slice(0, 16) : '');
//         setEndDate(prefillBatch.offer.endDate ? prefillBatch.offer.endDate.slice(0, 16) : '');
        
//         if (prefillBatch.offer.discountPercent > 0) {
//           setDiscountValue(prefillBatch.offer.discountPercent);
//           setDiscountType('percent');
//         } else if (prefillBatch.offer.discountAmount > 0) {
//           setDiscountValue(prefillBatch.offer.discountAmount);
//           setDiscountType('amount');
//         }
//       } else {
//         setTotalQty(''); setFreeQty(''); setOfferPTR(''); setDiscountValue(''); setDiscountType('percent');
//         setStartDate(''); setEndDate('');
//       }
//     } else {
//       setSelectedBatch(null); setSearchQuery(''); setSearchResults([]);
//       setTotalQty(''); setFreeQty(''); setOfferPTR(''); setDiscountValue(''); setDiscountType('percent');
//       setStartDate(''); setEndDate('');
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [prefillBatch, isOpen]);

//   const handleSearch = (e) => {
//     const val = e.target.value;
//     setSearchQuery(val);
    
//     if (searchTimeout.current) clearTimeout(searchTimeout.current);
//     if (val.trim().length <= 2) { 
//       setSearchResults([]); 
//       return; 
//     }

//     searchTimeout.current = setTimeout(async () => {
//       try {
//         const res = await api.getProductsWithBatches(); 
//         const matched = res.data.filter(p => p.name.toLowerCase().includes(val.toLowerCase()));
        
//         const flatBatches = matched.flatMap(prod => 
//           prod.batches.map(b => ({
//             id: b._id, 
//             productId: prod.id, 
//             productName: prod.name, 
//             company: prod.company,
//             batchNumber: b.no, 
//             expiryDate: b.expiry, 
//             mrp: b.mrp, 
//             sellingRate: prod.defaultRate, 
//             remainingUnits: b.stock
//           }))
//         );
//         setSearchResults(flatBatches);
//       } catch { }
//     }, 300);
//   };

//   const generateOfferText = () => {
//     let parts = [];
//     const tQty = Number(totalQty) || 0;
//     const fQty = Number(freeQty) || 0;
//     const dVal = Number(discountValue) || 0;

//     if (tQty > 0) {
//       if (fQty > 0 && tQty > fQty) parts.push(`Order ${tQty}, Pay for ${tQty - fQty} (${fQty} Free)`);
//       else if (fQty >= tQty) parts.push(`Order ${tQty} (100% Free)`); 
//       else parts.push(`Min Order: ${tQty}`); 
//     } else if (fQty > 0) parts.push(`Get ${fQty} Free`); 
    
//     if (dVal > 0) parts.push(discountType === 'percent' ? `${dVal}% Off` : `₹${dVal} Off`);
//     if (Number(offerPTR) > 0) parts.push(`@ PTR ₹${offerPTR}`);

//     if (parts.length === 0) return "Fill fields below to generate offer.";
//     return parts.join(' + ').replace('+ @', '@'); 
//   };

//   const handleSaveData = async (isDraft) => {
//     if (!selectedBatch) return toast.error("Please select a batch.");
    
//     const tQty = Number(totalQty) || 0;
//     const fQty = Number(freeQty) || 0;
//     const dVal = Number(discountValue) || 0;
//     const ptr = Number(offerPTR) || 0;

//     if (tQty === 0 && fQty === 0 && dVal === 0 && ptr === 0) {
//       return toast.error("Please fill out at least one detail to create an offer.");
//     }

//     if (fQty > 0 && tQty < fQty) {
//       return toast.error("Total Order Qty must be greater than or equal to the Free Qty.");
//     }

//     const offerText = generateOfferText();

//     try {
//       const payload = {
//         offer: {
//           isActive: !isDraft,
//           minBuyQty: tQty,
//           freeQty: fQty,
//           discountPercent: discountType === 'percent' ? dVal : 0,
//           discountAmount: discountType === 'amount' ? dVal : 0,
//           offerPTR: ptr > 0 ? ptr : null,
//           description: offerText,
//           startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
//           endDate: endDate ? new Date(endDate).toISOString() : null
//         }
//       };

//       await api.updateBatchOffer(selectedBatch.id, payload);
      
//       if (!isDraft && notifyClients) toast.success("Offer Activated and clients notified!");
//       else toast.success(isDraft ? "Draft Saved." : "Offer Activated silently.");

//       onSave();
//       onClose();
//     } catch (err) {
//       toast.error(err.message || "Failed to save offer.");
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
//       <div className="bg-white rounded-[1.5rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
//         <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
//           <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
//             <Sparkles className="text-amber-500" size={20} /> {prefillBatch?.offer ? 'Edit Scheme' : 'Make Offer'}
//           </h2>
//           <button onClick={onClose} className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
//             <X size={20} />
//           </button>
//         </div>

//         <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
          
//           {prefillBatch?.offer && (
//             <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl flex gap-3 items-start shadow-sm">
//               <Info size={20} className="shrink-0 mt-0.5" />
//               <p className="text-sm font-bold leading-tight">Previous offer data has been prefilled. You may modify the details below.</p>
//             </div>
//           )}

//           {!selectedBatch && (
//             <div className="space-y-3">
//               <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Search Target Batch</label>
//               <div className="relative">
//                 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//                 <input 
//                   autoFocus type="text" value={searchQuery} onChange={handleSearch}
//                   placeholder="Type product name..."
//                   className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-sm font-semibold transition-colors"
//                 />
//               </div>
//               {searchResults.length > 0 && (
//                 <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-52 overflow-y-auto mt-2">
//                   {searchResults.map(b => (
//                     <button key={b.id} onClick={() => setSelectedBatch(b)} className="w-full text-left p-3 hover:bg-slate-50 border-b last:border-0 border-slate-100 transition-colors">
//                       <p className="font-bold text-slate-900 text-sm">{b.productName}</p>
//                       <p className="text-sm font-semibold text-slate-500 mt-1">Batch: {b.batchNumber} <span className="mx-1">|</span> Exp: {formatExp(b.expiryDate)} <span className="mx-1">|</span> Stock: {b.remainingUnits}</p>
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}

//           {selectedBatch && (
//             <div className="bg-slate-900 rounded-xl p-4 text-white shadow-md relative overflow-hidden">
//               <div className="relative z-10">
//                 <p className="text-sm text-emerald-400 font-bold uppercase tracking-widest mb-1">Target Batch</p>
//                 <h3 className="text-xl font-black">{selectedBatch.productName}</h3>
//                 <p className="text-sm text-slate-300 font-medium mt-1.5 flex flex-wrap items-center gap-2">
//                   <span>Batch: <span className="text-white font-bold">{selectedBatch.batchNumber}</span></span>
//                   <span className="text-slate-600">•</span>
//                   <span>Exp: <span className="text-white font-bold">{formatExp(selectedBatch.expiryDate)}</span></span>
//                   <span className="text-slate-600">•</span>
//                   <span>Stock: <span className="text-white font-bold">{selectedBatch.remainingUnits}</span></span>
//                 </p>
//                 <p className="text-sm text-slate-400 font-medium mt-1">
//                   {selectedBatch.company} | MRP: ₹{selectedBatch.mrp}
//                 </p>
//               </div>
//               <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/20 blur-2xl rounded-full"></div>
//             </div>
//           )}

//           {selectedBatch && (
//             <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
//               <div className="grid grid-cols-2 gap-3">
//                 <div className="space-y-1">
//                   <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Orders Total (Qty)</label>
//                   <input type="number" placeholder="15" value={totalQty} onChange={e => setTotalQty(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-lg font-black text-slate-900 focus:outline-none focus:border-slate-400 shadow-sm" />
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-sm font-bold text-emerald-600 uppercase tracking-wide">Free (Qty)</label>
//                   <input type="number" placeholder="2" value={freeQty} onChange={e => setFreeQty(e.target.value)} className="w-full px-3 py-2.5 border border-emerald-300 bg-emerald-50 rounded-xl text-lg font-black text-emerald-900 focus:outline-none focus:border-emerald-500 shadow-sm" />
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <div className="space-y-1">
//                   <label className="text-sm font-bold text-blue-600 uppercase tracking-wide">Offer PTR (₹)</label>
//                   <input type="number" placeholder="e.g. 35" value={offerPTR} onChange={e => setOfferPTR(e.target.value)} className="w-full px-3 py-2.5 border border-blue-200 bg-blue-50/50 rounded-xl text-lg font-bold text-blue-900 focus:outline-none focus:border-blue-400" />
//                   <p className="text-sm font-semibold text-slate-500 mt-1">Std PTR: ₹{selectedBatch.sellingRate}</p>
//                 </div>
                
//                 <div className="space-y-1">
//                   <label className="text-sm font-bold text-amber-600 uppercase tracking-wide">Discount</label>
//                   <div className="flex items-stretch shadow-sm rounded-xl h-[46px]">
//                     <input 
//                       type="number" placeholder="0" value={discountValue} onChange={e => setDiscountValue(e.target.value)} 
//                       className="flex-1 w-full px-3 h-full border border-amber-200 border-r-0 bg-amber-50/50 rounded-l-xl text-lg font-bold text-amber-900 focus:outline-none focus:border-amber-400" 
//                     />
//                     <button 
//                       onClick={() => setDiscountType(t => t === 'percent' ? 'amount' : 'percent')} 
//                       className="px-4 h-full bg-white border border-slate-300 rounded-r-xl text-sm font-black text-slate-700 hover:bg-slate-50 transition-colors"
//                     >
//                       {discountType === 'percent' ? '%' : '₹'}
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
//                 <div className="space-y-1">
//                   <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Start Date</label>
//                   <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 shadow-sm" />
//                   <p className="text-sm text-slate-400 font-semibold mt-1">Blank = start immediately.</p>
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">End Date</label>
//                   <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 shadow-sm" />
//                   <p className="text-sm text-slate-400 font-semibold mt-1">Blank = no expiry.</p>
//                 </div>
//               </div>

//               <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-center">
//                 <p className="text-sm font-bold text-slate-700 text-center">
//                   Preview: <span className="text-emerald-600">"{generateOfferText()}"</span>
//                 </p>
//               </div>

//               <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
//                 <input 
//                   type="checkbox" checked={notifyClients} onChange={(e) => setNotifyClients(e.target.checked)}
//                   className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-slate-300"
//                 />
//                 <div className="flex-1">
//                   <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
//                     <Bell size={16} className="text-amber-500"/> Notify Clients
//                   </p>
//                 </div>
//               </label>

//             </div>
//           )}
//         </div>

//         {selectedBatch && (
//           <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2 w-full">
//             <button onClick={onClose} className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors shadow-sm">
//               Cancel
//             </button>
//             <button onClick={() => handleSaveData(true)} className="flex-1 bg-blue-50 border border-blue-200 text-blue-700 py-3 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors shadow-sm">
//               Save Draft
//             </button>
//             <button onClick={() => handleSaveData(false)} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95">
//               {prefillBatch?.offer?.isActive ? 'Update' : 'Activate'}
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }