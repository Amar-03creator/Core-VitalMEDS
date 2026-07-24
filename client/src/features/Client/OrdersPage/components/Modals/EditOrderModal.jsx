// src/features/Client/OrdersPage/components/Modals/EditOrderModal.jsx
import { useState, useEffect } from 'react';
import { X, Trash2, Loader2, Save, Clock, AlertTriangle, XCircle, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../../../services/api';
import { useScrollLock, useModalTrap } from '../../../../../hooks/useBackHandler';
import { formatMoney, productLabel } from '../../utils';

export default function EditOrderModal({ order, onClose, onSuccess }) {
  useScrollLock(true);

  const [items, setItems] = useState([]);
  const [clientNote, setClientNote] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [expired, setExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const CACHE_KEY = `draft_edit_${order._id}`;

  const handleSoftClose = () => {
    onSuccess(); 
  };

  const handleDiscardAndUnlock = async () => {
    setSaving(true);
    try { 
      await api.cancelEditOrder(order._id); 
      sessionStorage.removeItem(CACHE_KEY); 
    } catch (e) { /* ignore */ }
    onSuccess(); 
  };

  useModalTrap(true, { onBackClose: handleSoftClose, customId: `edit_${order._id}` });

  useEffect(() => {
    let active = true;
    setLoading(true);
    
    Promise.all([
      api.startEditOrder(order._id),
      api.getProductsWithBatches()
    ])
      .then(([editRes, catalogRes]) => {
        if (!active) return;
        if (editRes.data.editWindowExpiresAt) {
          setExpiresAt(new Date(editRes.data.editWindowExpiresAt).getTime());
        }
        
        const catalogProducts = catalogRes.data || [];
        
        const initialItems = (order.items || []).map(i => {
          const plannedBatchObj = i.plannedBatches?.[0]?.batchId;
          const bId = plannedBatchObj?._id || plannedBatchObj;
          const matchedProduct = catalogProducts.find(p => String(p.productId) === String(i.productId?._id || i.productId));
          
          const currentQty = i.finalQty ?? i.chargeableQty ?? i.requestedQty ?? 0;
          let maxQty = 9999;

          if (matchedProduct) {
            if (bId) {
              const specificBatch = matchedProduct.batches.find(b => String(b._id) === String(bId) || String(b.no) === String(bId));
              maxQty = (specificBatch ? specificBatch.stock : 0) + currentQty;
            } else {
              maxQty = (matchedProduct.totalStock || 0) + currentQty;
            }
          }

          // ✨ FIX: Prioritize exact Offer Batch Expiry over the Order Snapshot
          const exactBatchExpiry = plannedBatchObj?.expiryDate || plannedBatchObj?.expiry;
          const snapshotExpiry = exactBatchExpiry || i.expiryDate || i.closestExpiry;

          return {
            _id: i._id || Math.random().toString(),
            productId: i.productId?._id || i.productId,
            name: i.productId?.name || 'Product',
            shortCode: i.productId?.companyId?.shortCode || i.productId?.company || '',
            packing: i.productId?.packing || '',
            unitPrice: i.finalPrice || i.adminOfferedPTR || i.estimatedPrice || 0,
            qty: currentQty,
            maxQty: maxQty, 
            batchId: bId,
            isOffer: !!bId,
            displayExpiry: snapshotExpiry
          };
        });

        const cachedData = sessionStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          initialItems.forEach(initItem => {
            const cachedItem = parsed.items.find(ci => ci.productId === initItem.productId && ci.batchId === initItem.batchId);
            if (cachedItem && cachedItem.qty <= initItem.maxQty) {
              initItem.qty = cachedItem.qty; 
            }
          });
          setClientNote(parsed.clientNote || '');
        } else {
          setClientNote(order.clientNote || '');
        }
        
        setItems(initialItems);
      })
      .catch(err => {
        if (active) {
          toast.error(err.message || 'Cannot edit this order right now.');
          onClose();
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [order, onClose, CACHE_KEY]);

  useEffect(() => {
    if (!expiresAt) return;
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = expiresAt - now;
      if (diff <= 0) {
        setExpired(true);
        setTimeLeft('00:00');
        clearInterval(timer);
        toast.error("Editing window expired. The original order will be retained.");
        sessionStorage.removeItem(CACHE_KEY); 
        onSuccess(); 
      } else {
        const m = Math.floor(diff / 60000).toString().padStart(2, '0');
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        setTimeLeft(`${m}:${s}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, onSuccess, CACHE_KEY]);

  const handleQtyChange = (idx, delta) => {
    const copy = [...items];
    const newQty = copy[idx].qty + delta;
    
    if (newQty < 1) return;
    
    if (newQty > copy[idx].maxQty) {
      toast.error(`Maximum available stock is ${copy[idx].maxQty}.`);
      return;
    }
    
    copy[idx].qty = newQty;
    setItems(copy);
  };

  const handleRemove = (idx) => {
    const copy = [...items];
    copy.splice(idx, 1);
    setItems(copy);
  };

  const handleSave = async () => {
    if (items.length === 0) {
      toast.error('Order must have at least one item. Cancel the order completely instead.');
      return;
    }
    setSaving(true);
    try {
      const payloadItems = items.map(i => ({
        productId: i.productId,
        requestedQty: i.qty,
        qty: i.qty, 
        estimatedPrice: i.unitPrice,
        batchId: i.batchId
      }));

      await api.updateOrder(order._id, { items: payloadItems, clientNote });
      toast.success('Order updated successfully!');
      sessionStorage.removeItem(CACHE_KEY); 
      onSuccess(); 
    } catch (err) {
      toast.error(err.message || 'Failed to update order.');
    } finally {
      setSaving(false);
    }
  };

  const newTotal = items.reduce((sum, i) => sum + (i.unitPrice * i.qty), 0);

  return (
    <div className="fixed inset-0 z-[130] bg-black/50 flex items-end md:items-center justify-center md:p-4" onClick={handleSoftClose}>
      <div className="w-full md:max-w-2xl bg-white rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[82dvh]" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex justify-between items-center bg-slate-50 px-5 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h3 className="font-bold text-xl text-slate-900">Edit Order</h3>
            <p className="text-sm text-slate-500 font-medium mt-0.5">{order.orderId}</p>
          </div>
          <button onClick={handleSoftClose} disabled={saving} className="p-2 rounded-full hover:bg-slate-200 transition-colors bg-white border border-slate-200 shadow-sm disabled:opacity-50">
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50">
            <Loader2 size={30} className="animate-spin text-emerald-500 mb-3" />
            <p className="text-slate-500 font-bold">Locking order for editing...</p>
          </div>
        ) : (
          <>
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50/50 flex-1">
              
              {expiresAt && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${expired ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                  {expired ? <AlertTriangle size={20} className="shrink-0" /> : <Clock size={20} className="shrink-0" />}
                  <div>
                    <p className="font-bold text-sm sm:text-base">{expired ? 'Editing window expired' : `Editing window closes in ${timeLeft}`}</p>
                    <p className="text-xs sm:text-sm mt-0.5 opacity-90">{expired ? 'This order is confirmed and can no longer be edited.' : 'Admin confirmation is paused while you edit.'}</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {items.map((item, idx) => {
                  // ✨ FIX: Label shifts to "Exp:" if it is an offer batch!
                  let expiryLabel = item.isOffer ? 'Exp:' : 'Est. Exp:';
                  let expiryText = 'Standard';
                  
                  if (item.displayExpiry) {
                    const d = new Date(item.displayExpiry);
                    if (!isNaN(d)) {
                      expiryText = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
                    }
                  }
                  
                  return (
                    <div key={item._id} className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-base flex items-center flex-wrap gap-2">
                          {productLabel(item)}
                          {item.isOffer && (
                            <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                              <Tag size={10} /> Scheme
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-slate-500 font-medium truncate mt-0.5">
                          {item.shortCode} · {item.packing} · {expiryLabel} {expiryText}
                        </p>
                        <p className="text-emerald-600 font-bold text-sm mt-1">{formatMoney(item.unitPrice)} / unit</p>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                        <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-lg border border-slate-200">
                          <button 
                            onClick={() => handleQtyChange(idx, -1)} 
                            disabled={item.qty <= 1 || expired || saving}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-slate-700 font-bold disabled:opacity-50 hover:bg-slate-50"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-slate-900">{item.qty}</span>
                          <button 
                            onClick={() => handleQtyChange(idx, 1)} 
                            disabled={expired || saving || item.qty >= item.maxQty}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-slate-700 font-bold disabled:opacity-50 hover:bg-slate-50"
                          >
                            +
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => handleRemove(idx)} 
                          disabled={expired || saving}
                          className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-100 disabled:opacity-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm mt-4">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Client Note</label>
                <textarea
                    value={clientNote}
                    onChange={(e) => setClientNote(e.target.value)}
                    placeholder="Add additional instructions..."
                    className="w-full mt-2 text-base border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none shadow-sm"
                    rows={2}
                />
              </div>

            </div>

            <div className="bg-white border-t border-slate-200 p-4 flex flex-col gap-3 shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] z-20">
              
              <div className="flex items-end justify-between">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Updated Total</p>
                <p className="text-2xl font-black text-slate-900 leading-none">{formatMoney(newTotal)}</p>
              </div>

              <div className="flex gap-2 sm:gap-3 w-full mt-2">
                <button 
                  onClick={handleDiscardAndUnlock} 
                  disabled={saving}
                  className="flex-1 py-3 px-2 sm:px-4 rounded-xl text-sm sm:text-base font-bold border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <XCircle size={18} className="shrink-0" /> Revert & Close
                </button>

                <button 
                  onClick={handleSave} 
                  disabled={expired || saving || items.length === 0}
                  className="flex-1 py-3 px-2 sm:px-4 rounded-xl text-sm sm:text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm whitespace-nowrap"
                >
                  {saving ? <Loader2 size={18} className="animate-spin shrink-0" /> : <Save size={18} className="shrink-0" />}
                  Save Updates
                </button>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}


// // src/features/Client/OrdersPage/components/Modals/EditOrderModal.jsx
// import { useState, useEffect } from 'react';
// import { X, Trash2, Loader2, Save, Clock, AlertTriangle, XCircle } from 'lucide-react';
// import { toast } from 'sonner';
// import { api } from '../../../../../services/api';
// import { useScrollLock, useModalTrap } from '../../../../../hooks/useBackHandler';
// import { formatMoney, productLabel } from '../../utils';

// export default function EditOrderModal({ order, onClose, onSuccess }) {
//   useScrollLock(true);

//   const [items, setItems] = useState([]);
//   const [clientNote, setClientNote] = useState('');
//   const [expiresAt, setExpiresAt] = useState(null);
//   const [expired, setExpired] = useState(false);
//   const [timeLeft, setTimeLeft] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);

//   const CACHE_KEY = `draft_edit_${order._id}`;

//   const handleSoftClose = () => {
//     onSuccess(); 
//   };

//   const handleDiscardAndUnlock = async () => {
//     setSaving(true);
//     try { 
//       await api.cancelEditOrder(order._id); 
//       sessionStorage.removeItem(CACHE_KEY); 
//     } catch (e) { /* ignore */ }
//     onSuccess(); 
//   };

//   useModalTrap(true, { onBackClose: handleSoftClose, customId: `edit_${order._id}` });

//   useEffect(() => {
//     let active = true;
//     setLoading(true);
    
//     api.startEditOrder(order._id)
//       .then(res => {
//         if (!active) return;
//         if (res.data.editWindowExpiresAt) {
//           setExpiresAt(new Date(res.data.editWindowExpiresAt).getTime());
//         }
        
//         const cachedData = sessionStorage.getItem(CACHE_KEY);
//         if (cachedData) {
//           const parsed = JSON.parse(cachedData);
//           setItems(parsed.items);
//           setClientNote(parsed.clientNote || '');
//         } else {
//           const initial = (order.items || []).map(i => ({
//             _id: i._id || Math.random().toString(),
//             productId: i.productId?._id || i.productId,
//             name: i.productId?.name || 'Product',
//             shortCode: i.productId?.companyId?.shortCode || i.productId?.company || '',
//             packing: i.productId?.packing || '',
//             // ✨ FIX: Safely grabs the price no matter what state the order is in, preventing the ₹0 bug!
//             unitPrice: i.finalPrice || i.adminOfferedPTR || i.estimatedPrice || 0,
//             qty: i.finalQty ?? i.chargeableQty ?? i.requestedQty ?? 0,
//             batchId: i.plannedBatches?.[0]?.batchId?._id || undefined,
//             closestExpiry: i.closestExpiry
//           }));
          
//           setItems(initial);
//           setClientNote(order.clientNote || '');
//         }
//       })
//       .catch(err => {
//         if (active) {
//           toast.error(err.message || 'Cannot edit this order right now.');
//           onClose();
//         }
//       })
//       .finally(() => {
//         if (active) setLoading(false);
//       });

//     return () => { active = false; };
//   }, [order, onClose, CACHE_KEY]);

//   useEffect(() => {
//     if (!loading) {
//       sessionStorage.setItem(CACHE_KEY, JSON.stringify({ items, clientNote }));
//     }
//   }, [items, clientNote, loading, CACHE_KEY]);

//   useEffect(() => {
//     if (!expiresAt) return;
//     const timer = setInterval(() => {
//       const now = Date.now();
//       const diff = expiresAt - now;
//       if (diff <= 0) {
//         setExpired(true);
//         setTimeLeft('00:00');
//         clearInterval(timer);
//         toast.error("Editing window expired. The original order will be retained.");
//         sessionStorage.removeItem(CACHE_KEY); 
//         onSuccess(); 
//       } else {
//         const m = Math.floor(diff / 60000).toString().padStart(2, '0');
//         const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
//         setTimeLeft(`${m}:${s}`);
//       }
//     }, 1000);
//     return () => clearInterval(timer);
//   }, [expiresAt, onSuccess, CACHE_KEY]);

//   const handleQtyChange = (idx, delta) => {
//     const copy = [...items];
//     const newQty = copy[idx].qty + delta;
//     if (newQty < 1) return;
//     copy[idx].qty = newQty;
//     setItems(copy);
//   };

//   const handleRemove = (idx) => {
//     const copy = [...items];
//     copy.splice(idx, 1);
//     setItems(copy);
//   };

//   const handleSave = async () => {
//     if (items.length === 0) {
//       toast.error('Order must have at least one item. Cancel the order completely instead.');
//       return;
//     }
//     setSaving(true);
//     try {
//       const payloadItems = items.map(i => ({
//         productId: i.productId,
//         requestedQty: i.qty,
//         qty: i.qty, // ✨ WE ADDED THIS! Now the backend can do the math!
//         estimatedPrice: i.unitPrice,
//         batchId: i.batchId
//       }));

//       await api.updateOrder(order._id, { items: payloadItems, clientNote });
//       toast.success('Order updated successfully!');
//       sessionStorage.removeItem(CACHE_KEY); 
//       onSuccess(); // <--- This already successfully fetches the fresh data for the Orders List!
//     } catch (err) {
//       toast.error(err.message || 'Failed to update order.');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const newTotal = items.reduce((sum, i) => sum + (i.unitPrice * i.qty), 0);

//   return (
//     <div className="fixed inset-0 z-[130] bg-black/50 flex items-end md:items-center justify-center md:p-4" onClick={handleSoftClose}>
//       <div className="w-full md:max-w-2xl bg-white rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
//         <div className="flex justify-between items-center bg-slate-50 px-5 py-4 border-b border-slate-200 shrink-0">
//           <div>
//             <h3 className="font-bold text-xl text-slate-900">Edit Order</h3>
//             <p className="text-sm text-slate-500 font-medium mt-0.5">{order.orderId}</p>
//           </div>
//           <button onClick={handleSoftClose} disabled={saving} className="p-2 rounded-full hover:bg-slate-200 transition-colors bg-white border border-slate-200 shadow-sm disabled:opacity-50">
//             <X size={20} className="text-slate-600" />
//           </button>
//         </div>

//         {loading ? (
//           <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50">
//             <Loader2 size={30} className="animate-spin text-emerald-500 mb-3" />
//             <p className="text-slate-500 font-bold">Locking order for editing...</p>
//           </div>
//         ) : (
//           <>
//             <div className="p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50/50 flex-1">
              
//               {expiresAt && (
//                 <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${expired ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
//                   {expired ? <AlertTriangle size={20} className="shrink-0" /> : <Clock size={20} className="shrink-0" />}
//                   <div>
//                     <p className="font-bold text-sm sm:text-base">{expired ? 'Editing window expired' : `Editing window closes in ${timeLeft}`}</p>
//                     <p className="text-xs sm:text-sm mt-0.5 opacity-90">{expired ? 'This order is confirmed and can no longer be edited.' : 'Admin confirmation is paused while you edit.'}</p>
//                   </div>
//                 </div>
//               )}

//               <div className="space-y-3">
//                 {items.map((item, idx) => {
//                   let expiryText = 'Est. Exp: Standard';
//                   if (item.closestExpiry) {
//                       expiryText = `Est. Exp: ${new Date(item.closestExpiry).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
//                   }
                  
//                   return (
//                     <div key={item._id} className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//                       <div className="flex-1 min-w-0">
//                         <p className="font-bold text-slate-900 text-base">{productLabel(item)}</p>
//                         <p className="text-sm text-slate-500 font-medium truncate mt-0.5">
//                           {item.shortCode} · {item.packing} · {expiryText}
//                         </p>
//                         <p className="text-emerald-600 font-bold text-sm mt-1">{formatMoney(item.unitPrice)} / unit</p>
//                       </div>
                      
//                       <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
//                         <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-lg border border-slate-200">
//                           <button 
//                             onClick={() => handleQtyChange(idx, -1)} 
//                             disabled={item.qty <= 1 || expired || saving}
//                             className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-slate-700 font-bold disabled:opacity-50"
//                           >
//                             -
//                           </button>
//                           <span className="w-8 text-center font-bold text-slate-900">{item.qty}</span>
//                           <button 
//                             onClick={() => handleQtyChange(idx, 1)} 
//                             disabled={expired || saving}
//                             className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-slate-700 font-bold disabled:opacity-50"
//                           >
//                             +
//                           </button>
//                         </div>
                        
//                         <button 
//                           onClick={() => handleRemove(idx)} 
//                           disabled={expired || saving}
//                           className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-100 disabled:opacity-50"
//                         >
//                           <Trash2 size={18} />
//                         </button>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>

//               <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm mt-4">
//                 <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Client Note</label>
//                 <textarea
//                     value={clientNote}
//                     onChange={(e) => setClientNote(e.target.value)}
//                     placeholder="Add additional instructions..."
//                     className="w-full mt-2 text-base border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none shadow-sm"
//                     rows={2}
//                 />
//               </div>

//             </div>

//             <div className="bg-white border-t border-slate-200 p-4 flex flex-col gap-3 shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] z-20">
              
//               <div className="flex items-end justify-between">
//                 <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Updated Total</p>
//                 <p className="text-2xl font-black text-slate-900 leading-none">{formatMoney(newTotal)}</p>
//               </div>

//               {/* ✨ FIX: Buttons are exactly 50% width and will never stack unevenly */}
//               <div className="flex gap-2 sm:gap-3 w-full mt-2">
//                 <button 
//                   onClick={handleDiscardAndUnlock} 
//                   disabled={saving}
//                   className="flex-1 py-3 px-2 sm:px-4 rounded-xl text-sm sm:text-base font-bold border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
//                 >
//                   <XCircle size={18} className="shrink-0" /> Revert & Close
//                 </button>

//                 <button 
//                   onClick={handleSave} 
//                   disabled={expired || saving || items.length === 0}
//                   className="flex-1 py-3 px-2 sm:px-4 rounded-xl text-sm sm:text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm whitespace-nowrap"
//                 >
//                   {saving ? <Loader2 size={18} className="animate-spin shrink-0" /> : <Save size={18} className="shrink-0" />}
//                   Save Updates
//                 </button>
//               </div>

//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }