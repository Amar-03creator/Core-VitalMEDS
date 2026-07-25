// // src/pages/Client/ClientCart.jsx
// import { useState, useEffect, useMemo, useRef } from 'react';
// import { useSearchParams, useNavigate } from 'react-router-dom';
// import { toast } from 'sonner';

// import { useCart } from '../../context/CartContext';
// import { useCurrentClient } from '../../hooks/useCurrentClient';
// import { useProductCatalog } from '../../features/Client/ProductsPage/hooks/useProductCatalog';
// import { api } from '../../services/api';
// import { useStockAvailability } from '../../features/Client/Cart/hooks/useStockAvailability';
// import { useEstimatedRates } from '../../features/Client/Cart/hooks/useEstimatedRates';
// import {
//   getMrpTotal,
//   getEstimatedTotal,
//   getEstimatedUnitPrice,
//   wouldExceedCreditLimit,
//   isNearCreditLimit,
// } from '../../features/Client/Cart/utils/cartMath';

// import CartTabs from '../../features/Client/Cart/components/CartTabs';
// import EditWindowBanner from '../../features/Client/Cart/components/EditWindowBanner';
// import ProductSearchAdd from '../../features/Client/Cart/components/ProductSearchAdd';
// import ReviewList from '../../features/Client/Cart/components/ReviewList';
// import AlertsPanel from '../../features/Client/Cart/components/AlertsPanel';
// import SummaryPanel from '../../features/Client/Cart/components/SummaryPanel';
// import BillPreferenceSelector from '../../features/Client/Cart/components/BillPreferenceSelector';
// import SubmitBar from '../../features/Client/Cart/components/SubmitBar';
// import EmptyCartState from '../../features/Client/Cart/components/EmptyCartState';
// import SubmitSuccessModal from '../../features/Client/Cart/components/SubmitSuccessModal';

// const mapOrderItemToCartItem = (orderItem, catalogProducts) => {
//   const pid = orderItem.productId?._id || orderItem.productId;
//   const catalogMatch = catalogProducts.find((p) => p.productId === String(pid));
//   return {
//     productId: String(pid),
//     batchId: orderItem.batchId || catalogMatch?.batchId, // ✨ Include batch tracking for order editing
//     name: orderItem.productId?.name || catalogMatch?.name || 'Product',
//     company: orderItem.productId?.company || catalogMatch?.company || '',
//     packing: orderItem.productId?.packing || catalogMatch?.packing || '',
//     mrp: catalogMatch?.mrp || 0,
//     defaultRate: catalogMatch?.defaultRate || 0,
//     requestedQty: orderItem.finalQty || 1,
//     totalStock: catalogMatch?.totalStock || 0,
//     images: catalogMatch?.images || [],
//     batches: catalogMatch?.batches || [],
//     offer: null,
//     offerApplied: false,
//   };
// };

// const ClientCart = () => {
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const editOrderId = searchParams.get('editOrderId');

//   const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('cartActiveTab') || 'order');
//   const [billPreference, setBillPreference] = useState(() => sessionStorage.getItem('cartBillPref') || 'Credit');
//   const [clientNote, setClientNote] = useState(() => sessionStorage.getItem('cartClientNote') || '');

//   const {
//     isApproved,
//     creditLimit,
//     totalOutstanding,
//     clientId,
//     hasSentInquiryToday,
//     loading: clientLoading
//   } = useCurrentClient();

//   const { products } = useProductCatalog();
  
//   // ✨ FIX: Removed toggleOffer, it is no longer needed in the new Composite Key architecture
//   const {
//     inquiryItems = [],
//     orderItems = [],
//     addItem,
//     updateQty,
//     removeItem,
//     clearTab,
//     loadItems,
//   } = useCart();

//   const [editingOrder, setEditingOrder] = useState(null);
//   const [editWindowExpiresAt, setEditWindowExpiresAt] = useState(null);
//   const [editLoading, setEditLoading] = useState(!!editOrderId);
//   const [editExpired, setEditExpired] = useState(false);

//   const [submitting, setSubmitting] = useState(false);
//   const [submitted, setSubmitted] = useState(null);
//   const prefillDoneRef = useRef(false);

//   useEffect(() => { sessionStorage.setItem('cartActiveTab', activeTab); }, [activeTab]);
//   useEffect(() => { sessionStorage.setItem('cartBillPref', billPreference); }, [billPreference]);
//   useEffect(() => { sessionStorage.setItem('cartClientNote', clientNote); }, [clientNote]);

//   useEffect(() => {
//     if (!editOrderId || prefillDoneRef.current || products.length === 0) return;

//     let cancelled = false;
//     (async () => {
//       try {
//         const [orderRes, editRes] = await Promise.all([
//           api.getOrderById(editOrderId),
//           api.startEditOrder(editOrderId),
//         ]);
//         if (cancelled) return;

//         const order = orderRes.data;
//         if (!['Placed', 'Confirmed'].includes(order.status)) {
//           toast.error('This order can no longer be edited.');
//           setEditLoading(false);
//           return;
//         }

//         setEditingOrder(order);
//         setEditWindowExpiresAt(editRes.data.editWindowExpiresAt);
//         setActiveTab('order');
//         loadItems('order', order.items.map((i) => mapOrderItemToCartItem(i, products)));

//         if (order.billPreference && !sessionStorage.getItem('cartBillPref')) setBillPreference(order.billPreference);
//         if (order.clientNote && !sessionStorage.getItem('cartClientNote')) setClientNote(order.clientNote);

//         prefillDoneRef.current = true;
//       } catch (err) {
//         if (!cancelled) toast.error(err.message || 'Could not load this order for editing.');
//       } finally {
//         if (!cancelled) setEditLoading(false);
//       }
//     })();

//     return () => { cancelled = true; };
//   }, [editOrderId, products]);

//   const rawItems = activeTab === 'order' ? orderItems : inquiryItems;

//   const items = useMemo(() => {
//     if (!rawItems || !Array.isArray(rawItems)) return [];
//     return rawItems.map((item) => {
//       const catalogMatch = products.find((p) => p.productId === item.productId);
//       return {
//         ...item,
//         companyShortCode: catalogMatch?.companyShortCode || item.companyShortCode || item.company,
//       };
//     });
//   }, [rawItems, products]);

//   const { tierByKey } = useStockAvailability(items);
//   const rateByKey = useEstimatedRates(items);

//   const mrpTotal = getMrpTotal(items);
//   const estimatedTotal = getEstimatedTotal(items, rateByKey);
//   const nearLimit = isNearCreditLimit(totalOutstanding, creditLimit, estimatedTotal);
  
//   const hasUnavailable = items.some((i) => {
//     const cartKey = `${i.productId}_${i.batchId || 'standard'}`;
//     return tierByKey?.[cartKey]?.tier === 'unavailable';
//   });
  
//   useEffect(() => {
//     if (!clientLoading && !editOrderId && !isApproved) {
//       setActiveTab('inquiry');
//     }
//   }, [clientLoading, isApproved, editOrderId]);

//   const handleAddFromSearch = (product) => addItem(activeTab, product);

//   const buildSubmissionItems = () =>
//     items.map((i) => {
//       const unitPrice = getEstimatedUnitPrice(i, rateByKey);
//       const qty = parseInt(i.requestedQty, 10) || 0;
//       return {
//         productId: i.productId,
//         batchId: i.batchId, 
//         requestedQty: qty,
//         estimatedPrice: unitPrice,
//         estimatedLineTotal: unitPrice * qty,
//         offerDescription: i.offerDescription || '',
//       };
//     });

//   const handleSubmit = async () => {
//     if (items.length === 0) return;

//     setSubmitting(true);
//     try {
//       if (editingOrder) {
//         await api.updateOrder(editingOrder._id, { items: buildSubmissionItems(), billPreference, clientNote });
//         toast.success('Order updated.');
//         clearTab('order');
//         navigate('/client-dashboard/orders');
//         return;
//       }

//       if (!clientId) { toast.error('Could not find your client profile.'); return; }

//       if (activeTab === 'order') {
//         await api.createOrder({ clientId, items: buildSubmissionItems(), billPreference, clientNote });
//         setSubmitted('order');
//       } else {
//         await api.createInquiry({ clientId, items: buildSubmissionItems(), billPreference, clientNote });
//         setSubmitted('inquiry');
//       }

//       clearTab(activeTab);
//       setClientNote('');
//       setBillPreference('Credit');
//       sessionStorage.removeItem('cartActiveTab');
//       sessionStorage.removeItem('cartClientNote');
//       sessionStorage.removeItem('cartBillPref');

//     } catch (err) {
//       toast.error(err.message || 'Something went wrong. Please try again.');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const inquiryBlockedToday = !editingOrder && activeTab === 'inquiry' && hasSentInquiryToday;

//   const disabledReason = inquiryBlockedToday
//     ? 'You can send one inquiry per day. Please wait until tomorrow.'
//     : editingOrder && editExpired
//       ? 'Your editing window has expired.'
//       : hasUnavailable
//         ? 'Reduce the unavailable quantity above to continue.'
//         : undefined;

//   const submitDisabled = submitting || hasUnavailable || inquiryBlockedToday || (editingOrder && editExpired);

//   if (editLoading) {
//     return <p className="text-slate-400 text-base text-center py-16 max-w-4xl mx-auto">Loading order…</p>;
//   }

//   return (
//     <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
//       <div>
//         <h1 className="text-slate-900 text-2xl sm:text-3xl font-bold">
//           {editingOrder ? `Edit Order — ${editingOrder.orderId}` : 'Your Cart'}
//         </h1>
//         <p className="text-slate-500 font-medium mt-1 text-sm sm:text-base">
//           {editingOrder
//             ? 'Adjust products and quantities, then save your changes.'
//             : 'Review your items before placing an order or inquiry'}
//         </p>
//       </div>

//       {editingOrder && editWindowExpiresAt && (
//         <EditWindowBanner expiresAt={editWindowExpiresAt} onExpire={() => setEditExpired(true)} />
//       )}

//       {!editingOrder && (
//         <CartTabs
//           activeTab={activeTab}
//           onChange={setActiveTab}
//           canOrder={isApproved}
//           inquiryCount={inquiryItems.length}
//           orderCount={orderItems.length}
//         />
//       )}

//       <div className="space-y-6">
//         <ProductSearchAdd products={products} onAdd={handleAddFromSearch} />

//         {items.length > 0 ? (
//           <>
//             <ReviewList
//               items={items}
//               tierByKey={tierByKey} 
//               rateByKey={rateByKey} 

//               onQtyChange={(productId, batchId, qty) => updateQty(activeTab, productId, batchId, qty)}
//               onRemove={(productId, batchId) => removeItem(activeTab, productId, batchId)}

//               onAddOfferItem={(baseItem, offerBatch) => {
//                 const payload = {
//                   ...baseItem,
//                   batchId: offerBatch._id || offerBatch.no,
//                   mrp: offerBatch.mrp,
//                   offerApplied: true,
//                   offer: offerBatch.offer,
//                 };
//                 addItem(activeTab, payload, 1);
//                 toast.success(`Offer scheme added to cart!`);
//               }}
//             />

//             <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
//               <p className="text-slate-900 font-bold text-lg sm:text-xl">
//                 {editingOrder ? 'Updated Order Summary' : activeTab === 'order' ? 'Order Summary' : 'Inquiry Summary'}
//               </p>

//               {/* ✨ FIX: Passed the correct tierByKey to the AlertsPanel so it stops crashing! */}
//               <AlertsPanel items={items} tierByKey={tierByKey} />

//               <SummaryPanel
//                 activeTab={activeTab}
//                 itemCount={items.length}
//                 mrpTotal={mrpTotal}
//                 estimatedTotal={estimatedTotal}
//                 totalOutstanding={totalOutstanding}
//                 creditLimit={creditLimit}
//                 nearLimit={nearLimit}
//               />

//               <BillPreferenceSelector value={billPreference} onChange={setBillPreference} />

//               <div className="space-y-2 pt-1 border-t border-slate-100">
//                 <label className="text-slate-600 text-sm sm:text-base font-semibold block">
//                   Additional Note <span className="text-slate-400 font-normal">(Optional)</span>
//                 </label>
//                 <textarea
//                   value={clientNote}
//                   onChange={(e) => setClientNote(e.target.value)}
//                   placeholder="Add any specific instructions or remarks for the distributor..."
//                   rows={2}
//                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm sm:text-base text-slate-800 outline-none focus:border-emerald-400 focus:bg-white transition-colors resize-none"
//                 />
//               </div>

//               <SubmitBar
//                 tab={editingOrder ? 'order' : activeTab}
//                 onSubmit={handleSubmit}
//                 disabled={submitDisabled}
//                 disabledReason={disabledReason}
//               />
//             </div>
//           </>
//         ) : (
//           <EmptyCartState tab={activeTab} />
//         )}
//       </div>

//       {submitted && (
//         <SubmitSuccessModal
//           type={submitted}
//           onClose={() => setSubmitted(null)}
//         />
//       )}
//     </div>
//   );
// };

// export default ClientCart;


// src/pages/Client/ClientCart.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useCart } from '../../context/CartContext';
import { useCurrentClient } from '../../hooks/useCurrentClient';
import { useProductCatalog } from '../../features/Client/ProductsPage/hooks/useProductCatalog';
import { api } from '../../services/api';
import { useStockAvailability } from '../../features/Client/Cart/hooks/useStockAvailability';
import { useEstimatedRates } from '../../features/Client/Cart/hooks/useEstimatedRates';
import {
  getMrpTotal,
  getEstimatedTotal,
  getEstimatedUnitPrice,
  isNearCreditLimit,
} from '../../features/Client/Cart/utils/cartMath';

import CartTabs from '../../features/Client/Cart/components/CartTabs';
import ProductSearchAdd from '../../features/Client/Cart/components/ProductSearchAdd';
import ReviewList from '../../features/Client/Cart/components/ReviewList';
import AlertsPanel from '../../features/Client/Cart/components/AlertsPanel';
import SummaryPanel from '../../features/Client/Cart/components/SummaryPanel';
import BillPreferenceSelector from '../../features/Client/Cart/components/BillPreferenceSelector';
import SubmitBar from '../../features/Client/Cart/components/SubmitBar';
import EmptyCartState from '../../features/Client/Cart/components/EmptyCartState';
import SubmitSuccessModal from '../../features/Client/Cart/components/SubmitSuccessModal';

const ClientCart = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('cartActiveTab') || 'order');
  const [billPreference, setBillPreference] = useState(() => sessionStorage.getItem('cartBillPref') || 'Credit');
  const [clientNote, setClientNote] = useState(() => sessionStorage.getItem('cartClientNote') || '');

  const {
    isApproved,
    creditLimit,
    totalOutstanding,
    clientId,
    hasSentInquiryToday,
    loading: clientLoading
  } = useCurrentClient();

  const { products } = useProductCatalog();
  
  const {
    inquiryItems = [],
    orderItems = [],
    addItem,
    updateQty,
    removeItem,
    clearTab,
  } = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  useEffect(() => { sessionStorage.setItem('cartActiveTab', activeTab); }, [activeTab]);
  useEffect(() => { sessionStorage.setItem('cartBillPref', billPreference); }, [billPreference]);
  useEffect(() => { sessionStorage.setItem('cartClientNote', clientNote); }, [clientNote]);

  const rawItems = activeTab === 'order' ? orderItems : inquiryItems;

const items = useMemo(() => {
    if (!rawItems || !Array.isArray(rawItems)) return [];
    
    const mapped = rawItems.map((item) => {
      const catalogMatch = products.find((p) => p.productId === item.productId);
      return {
        ...item,
        companyShortCode: catalogMatch?.companyShortCode || item.companyShortCode || item.company,
        name: catalogMatch?.name || item.name || 'Product',
      };
    });

    // ✨ FIX: Group identical products together so Offers snap right below Standards!
    const grouped = [];
    const seenIds = new Set();
    
    mapped.forEach((item) => {
      if (!seenIds.has(item.productId)) {
        seenIds.add(item.productId);
        // Grab all batches (standard + offer) of this specific product and bundle them
        const family = mapped.filter((i) => i.productId === item.productId);
        grouped.push(...family);
      }
    });
    
    return grouped;
  }, [rawItems, products]);

  const { tierByKey } = useStockAvailability(items);
  const rateByKey = useEstimatedRates(items);

  const mrpTotal = getMrpTotal(items);
  const estimatedTotal = getEstimatedTotal(items, rateByKey);
  const nearLimit = isNearCreditLimit(totalOutstanding, creditLimit, estimatedTotal);
  
  const hasUnavailable = items.some((i) => {
    const cartKey = `${i.productId}_${i.batchId || 'standard'}`;
    return tierByKey?.[cartKey]?.tier === 'unavailable';
  });
  
  useEffect(() => {
    if (!clientLoading && !isApproved) {
      setActiveTab('inquiry');
    }
  }, [clientLoading, isApproved]);

  const handleAddFromSearch = (product) => addItem(activeTab, product);

  const buildSubmissionItems = () =>
    items.map((i) => {
      const unitPrice = getEstimatedUnitPrice(i, rateByKey);
      const qty = parseInt(i.requestedQty, 10) || 0;
      return {
        productId: i.productId,
        batchId: i.batchId, 
        requestedQty: qty,
        estimatedPrice: unitPrice,
        estimatedLineTotal: unitPrice * qty,
        offerDescription: i.offerDescription || '',
      };
    });

  const handleSubmit = async () => {
    if (items.length === 0) return;

    // ✨ FRONTEND HARD BLOCK: Intercept before API call
    if (activeTab === 'order') {
      const unavailableItem = items.find((i) => {
        const cartKey = `${i.productId}_${i.batchId || 'standard'}`;
        return tierByKey?.[cartKey]?.tier === 'unavailable';
      });

      if (unavailableItem) {
        const cartKey = `${unavailableItem.productId}_${unavailableItem.batchId || 'standard'}`;
        const availableQty = tierByKey[cartKey].availableQty;
        toast.error(`Not enough stock for ${unavailableItem.name}. You requested ${unavailableItem.requestedQty}, but only ${availableQty} are available.`);
        return; // Stop execution! Do not clear cart.
      }
    }

    setSubmitting(true);
    try {
      if (!clientId) { toast.error('Could not find your client profile.'); return; }

      if (activeTab === 'order') {
        await api.createOrder({ clientId, items: buildSubmissionItems(), billPreference, clientNote });
        setSubmitted('order');
      } else {
        await api.createInquiry({ clientId, items: buildSubmissionItems(), billPreference, clientNote });
        setSubmitted('inquiry');
      }

      clearTab(activeTab);
      setClientNote('');
      setBillPreference('Credit');
      sessionStorage.removeItem('cartActiveTab');
      sessionStorage.removeItem('cartClientNote');
      sessionStorage.removeItem('cartBillPref');

    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inquiryBlockedToday = activeTab === 'inquiry' && hasSentInquiryToday;

  const disabledReason = inquiryBlockedToday
    ? 'You can send one inquiry per day. Please wait until tomorrow.'
    : undefined;

  // ✨ FIX: Removed "hasUnavailable" from submitDisabled so the user can click it and see the Toast Error!
  const submitDisabled = submitting || inquiryBlockedToday;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-slate-900 text-2xl sm:text-3xl font-bold">
          Your Restock Cart
        </h1>
        <p className="text-slate-500 font-medium mt-1 text-sm sm:text-base">
          Review your items before placing an order or inquiry
        </p>
      </div>

      <CartTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        canOrder={isApproved}
        inquiryCount={inquiryItems.length}
        orderCount={orderItems.length}
      />

      <div className="space-y-6">
        <ProductSearchAdd products={products} onAdd={handleAddFromSearch} />

        {items.length > 0 ? (
          <>
            <ReviewList
              items={items}
              tierByKey={tierByKey} 
              rateByKey={rateByKey} 
              activeTab={activeTab}

              onQtyChange={(productId, batchId, qty) => updateQty(activeTab, productId, batchId, qty)}
              onRemove={(productId, batchId) => removeItem(activeTab, productId, batchId)}

              onAddOfferItem={(baseItem, offerBatch) => {
                const payload = {
                  ...baseItem,
                  batchId: offerBatch._id || offerBatch.no,
                  mrp: offerBatch.mrp,
                  offerApplied: true,
                  offer: offerBatch.offer,
                };
                addItem(activeTab, payload, 1);
                toast.success(`Offer scheme added to cart!`);
              }}
            />

            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
              <p className="text-slate-900 font-bold text-lg sm:text-xl">
                {activeTab === 'order' ? 'Order Summary' : 'Inquiry Summary'}
              </p>

              <AlertsPanel items={items} tierByKey={tierByKey} />

              <SummaryPanel
                activeTab={activeTab}
                itemCount={items.length}
                mrpTotal={mrpTotal}
                estimatedTotal={estimatedTotal}
                totalOutstanding={totalOutstanding}
                creditLimit={creditLimit}
                nearLimit={nearLimit}
              />

              <BillPreferenceSelector value={billPreference} onChange={setBillPreference} />

              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="text-slate-600 text-sm sm:text-base font-semibold block">
                  Additional Note <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={clientNote}
                  onChange={(e) => setClientNote(e.target.value)}
                  placeholder="Add any specific instructions or remarks for the distributor..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm sm:text-base text-slate-800 outline-none focus:border-emerald-400 focus:bg-white transition-colors resize-none"
                />
              </div>

              <SubmitBar
                tab={activeTab}
                onSubmit={handleSubmit}
                disabled={submitDisabled}
                disabledReason={disabledReason}
              />
            </div>
          </>
        ) : (
          <EmptyCartState tab={activeTab} />
        )}
      </div>

      {submitted && (
        <SubmitSuccessModal
          type={submitted}
          onClose={() => setSubmitted(null)}
        />
      )}
    </div>
  );
};

export default ClientCart;