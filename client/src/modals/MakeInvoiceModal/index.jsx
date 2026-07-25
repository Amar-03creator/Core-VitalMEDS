// src/modals/MakeInvoiceModal/index.jsx
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { calcLineTotal } from '../../features/Admin/BillingPage/utils/helpers';
import { useModalTrap, useScrollLock } from '../../hooks/useBackHandler';
import { api } from '../../services/api';
import { downloadInvoicePDF, printInvoicePDF } from '../../features/Admin/BillingPage/pdf/invoice/generateInvoicePdf';

import { Step1 } from './Step1';
import { Step2 } from './Step2';
import { Step3 } from './Step3';
import { Step4 } from './Step4';
import { ExitDialog, ModReasonPrompt, ClientEditingPrompt, LiveTimerOverlay, OrderCancelledPrompt } from './components/InvoiceOverlays';

export const MakeInvoiceModal = ({
  onClose, prefillClient = null, lockClient = false, disableBackTrap = false,
  prefillOrder = null, phoneIn = false, onOrderUpdated = null,
}) => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const STORAGE_KEY = prefillOrder ? `makeInvoiceState_order_${prefillOrder._id}` : prefillClient ? `makeInvoiceState_client_${prefillClient._id}` : phoneIn ? 'makeInvoiceState_phonein' : 'makeInvoiceState_standalone';
  const effectiveLockClient = lockClient || !!prefillOrder;

  const loadSavedState = () => { try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { return null; } };
  const savedState = loadSavedState();

  const [step, setStep] = useState(savedState?.step ?? (prefillOrder?.invoiceDocumentId ? 2 : 1));
  const [clientSearch, setClientSearch] = useState(prefillClient?.establishmentName || prefillOrder?.clientId?.establishmentName || savedState?.clientSearch || '');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState(prefillClient || prefillOrder?.clientId || savedState?.selectedClient || null);
  const [billType, setBillType] = useState(prefillOrder?.billPreference || (savedState?.billType ?? 'Credit'));
  const [invoiceDate] = useState(today);
  const [address, setAddress] = useState(prefillClient?.billingAddress || prefillOrder?.clientId?.billingAddress || savedState?.address || '');

  const [gstin, setGstin] = useState(prefillClient?.gstin || prefillOrder?.clientId?.gstin || savedState?.gstin || '');
  const [drugLicense, setDrugLicense] = useState(prefillClient ? [prefillClient.drugLicense20B, prefillClient.drugLicense21B].filter(Boolean).join(', ') : prefillOrder?.clientId ? [prefillOrder.clientId.drugLicense20B, prefillOrder.clientId.drugLicense21B].filter(Boolean).join(', ') : (savedState?.drugLicense || ''));
  const [pan, setPan] = useState(prefillClient?.pan || prefillOrder?.clientId?.pan || savedState?.pan || '');
  const [aadhaar, setAadhaar] = useState(prefillClient?.aadhaar || prefillOrder?.clientId?.aadhaar || savedState?.aadhaar || '');

  const [items, setItems] = useState(savedState?.items ?? []);
  
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const [productSearch, setProductSearch] = useState('');
  const [showProductDrop, setShowProductDrop] = useState(false);
  
  const [globalDiscountType, setGlobalDiscountType] = useState(savedState?.globalDiscountType ?? prefillOrder?.discountType ?? 'percent');
  const [globalDiscountValue, setGlobalDiscountValue] = useState(savedState?.globalDiscountValue ?? prefillOrder?.discountValue ?? 0);
  
  const [generatedInvoice, setGeneratedInvoice] = useState(null);

  const [editingInvoiceId, setEditingInvoiceId] = useState(savedState?.editingInvoiceId ?? prefillOrder?.invoiceDocumentId ?? null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const originalProductIdsRef = useRef(null);
  
  const [modReason, setModReason] = useState('');
  const [showModReasonPrompt, setShowModReasonPrompt] = useState(false);

  const [isClientEditing, setIsClientEditing] = useState(false);
  const [showEditPrompt, setShowEditPrompt] = useState(false);
  const [showTimerOverlay, setShowTimerOverlay] = useState(false);
  const [editTimer, setEditTimer] = useState('02:00');
  const [editExpiresAt, setEditExpiresAt] = useState(null);
  const [adminNote, setAdminNote] = useState(prefillOrder?.adminNote || '');

  const [clientNote, setClientNote] = useState(prefillOrder?.clientNote || '');
  const [clientNoteEdited, setClientNoteEdited] = useState(false);
  
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  useEffect(() => {
    api.getProductsWithBatches().then(res => setAllProducts(res.data || [])).catch(() => toast.error('Failed to load products'));
    api.getClients().then(res => setClients(res.data || [])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!prefillOrder?._id) return;
    const interval = setInterval(async () => {
      try {
        const freshRes = await api.getOrderById(prefillOrder._id);
        const order = freshRes.data;
        
        if (order.status === 'Cancelled') {
          setCancelReason(order.clientCancelReason || order.adminCancelReason || 'No reason provided.');
          setShowCancelPrompt(true);
          return;
        }
        
        if (order.status === 'Editing') {
          if (!isClientEditing) {
            setIsClientEditing(true);
            setEditExpiresAt(new Date(order.editWindowExpiresAt).getTime());
            setShowEditPrompt(true);
          }
        } else if (isClientEditing) {
          setIsClientEditing(false); setShowEditPrompt(false); setShowTimerOverlay(false);
          toast.success("Client finished editing. Invoice updated with new quantities!");
          
          setClientNoteEdited(order.clientNote !== prefillOrder.clientNote);
          setClientNote(order.clientNote || '');

          setItems(prevItems => prevItems.map(item => {
            const freshItem = order.items.find(fi => (fi.productId._id || fi.productId).toString() === item.productId.toString());

            if (freshItem) {
              const freshQty = freshItem.requestedQty ?? freshItem.finalQty ?? 1;
              if (freshQty !== item.originalRequestedQty) {
                return { 
                  ...item, 
                  chargeableQty: freshQty, 
                  originalRequestedQty: freshQty, 
                  freeQty: 0, 
                  discountValue: 0, 
                  clientEdited: true 
                };
              }
              return item; 
            }

            if (originalProductIdsRef.current.has(String(item.productId))) {
              return null; 
            }

            return item;
          }).filter(Boolean)); 

          if (onOrderUpdated) onOrderUpdated(order);
        }
      } catch { } 
    }, 3000);
    return () => clearInterval(interval);
  }, [prefillOrder, isClientEditing, onOrderUpdated]);

  useEffect(() => {
    if (!showTimerOverlay || !editExpiresAt) return;
    const timerInterval = setInterval(() => {
      const diff = editExpiresAt - Date.now();
      if (diff <= 0) setEditTimer('00:00');
      else setEditTimer(`${Math.floor(diff / 60000).toString().padStart(2, '0')}:${Math.floor((diff % 60000) / 1000).toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [showTimerOverlay, editExpiresAt]);

  useEffect(() => {
    if (prefillOrder && !selectedClient && prefillOrder.clientId) {
      setSelectedClient(prefillOrder.clientId); setClientSearch(prefillOrder.clientId.establishmentName);
      setGstin(prefillOrder.clientId.gstin || ''); setAddress(prefillOrder.clientId.billingAddress || '');
      setDrugLicense([prefillOrder.clientId.drugLicense20B, prefillOrder.clientId.drugLicense21B].filter(Boolean).join(', '));
      setPan(prefillOrder.clientId.pan || ''); setAadhaar(prefillOrder.clientId.aadhaar || '');
      setBillType(prefillOrder.billPreference || 'Credit');
    }
  }, [prefillOrder, selectedClient]);

  useEffect(() => {
    const loadItems = async () => {
      if (allProducts.length === 0 || items.length > 0 || originalProductIdsRef.current) return;

      if (editingInvoiceId) {
        try {
          const { data: inv } = await api.getSalesInvoiceById(editingInvoiceId);
          const seeded = inv.items.map(ii => {
            const catalogProduct = allProducts.find(p => String(p.productId || p.id || p._id) === String(ii.productId));
            const matchedBatch = catalogProduct?.batches?.find(b => b.no === ii.batchNumber) || {};
            
            return {
              productId: catalogProduct?.productId || catalogProduct?.id || ii.productId, 
              productName: ii.productName, companyShortCode: ii.companyShortCode,
              packing: ii.packing, hsn: ii.hsn, gstRate: catalogProduct?.gstRate || 0, availableBatches: catalogProduct?.batches || [],
              batchId: ii.batchId, batchNumber: ii.batchNumber, expiryDate: ii.expiryDate, mrp: ii.mrp, 
              isOfferBatch: !!matchedBatch.offer,
              offerDescription: matchedBatch.offer?.description || '',
              rate: ii.rate, chargeableQty: ii.chargeableQty ?? 1, freeQty: ii.freeQty ?? 0,
              discountType: ii.discountPercent > 0 ? 'percent' : 'amount', discountValue: ii.discountPercent || ii.discountAmount || 0,
              originalRequestedQty: (ii.chargeableQty || 0) + (ii.freeQty || 0), clientEdited: false
            };
          });

          setItems(seeded);
          
          const baseline = new Map();
          seeded.forEach(i => {
            const pid = String(i.productId);
            const qty = (Number(i.chargeableQty) || 0) + (Number(i.freeQty) || 0);
            baseline.set(pid, (baseline.get(pid) || 0) + qty);
          });
          originalProductIdsRef.current = baseline;
          
          setGlobalDiscountType(inv.globalDiscountPercent ? 'percent' : 'amount');
          setGlobalDiscountValue(inv.globalDiscountPercent || inv.globalDiscountAmount || 0);
          return;
        } catch (err) { toast.error("Failed to load the existing invoice items."); }
      }

      if (prefillOrder) {
        const seeded = (prefillOrder.items || []).map((oi) => {
          const productId = String(oi.productId?._id || oi.productId);
          
          const catalogProduct = allProducts.find((p) => String(p.productId || p.id || p._id) === productId);
          
          const batches = catalogProduct?.batches ? JSON.parse(JSON.stringify(catalogProduct.batches)) : [];
          const plannedBatchId = oi.plannedBatches?.[0]?.batchId;
          
          const currentOrderQty = oi.chargeableQty ?? oi.finalQty ?? 1;
          if (plannedBatchId) {
            const specificBatch = batches.find(b => String(b._id) === String(plannedBatchId._id || plannedBatchId));
            if (specificBatch) specificBatch.stock += currentOrderQty;
          }

          let fallbackBatch = batches.find(b => !b.offer) || batches[0] || {};
          if (batches.length > 0) {
            const today = new Date();
            const thresholdDays = catalogProduct?.shortExpiryThreshold || 90;
            const msPerDay = 1000 * 60 * 60 * 24;
            
            const safeBatch = batches.find(b => 
              !b.offer && 
              b.expiry && 
              ((new Date(b.expiry) - today) / msPerDay) > thresholdDays
            );
            if (safeBatch) fallbackBatch = safeBatch;
          }

          const batch = (plannedBatchId ? batches.find(b => String(b._id) === String(plannedBatchId._id || plannedBatchId)) : null) || fallbackBatch;

          return {
            productId: catalogProduct?.productId || catalogProduct?.id || productId, 
            productName: catalogProduct?.name || oi.productId?.name || 'Unknown',
            companyShortCode: catalogProduct?.companyShortCode || catalogProduct?.company || '', 
            packing: catalogProduct?.packing || oi.productId?.packing || '',
            hsn: catalogProduct?.hsn || '', 
            gstRate: catalogProduct?.gstRate ?? oi.productId?.gstRate ?? 0,
            availableBatches: batches, 
            batchId: batch._id || '', 
            batchNumber: batch.no || '', 
            expiryDate: batch.expiry || '',
            mrp: batch.mrp || 0, 
            isOfferBatch: !!batch.offer, 
            offerDescription: batch.offer?.description || '',
            rate: (oi.finalPrice || catalogProduct?.defaultRate) ?? (batch.mrp ? parseFloat((batch.mrp * 0.8).toFixed(2)) : 0),
            chargeableQty: currentOrderQty, 
            freeQty: oi.freeQty ?? 0, 
            discountType: oi.discountType || 'percent', 
            discountValue: oi.discountValue || 0,
            originalRequestedQty: oi.requestedQty ?? oi.finalQty ?? 1, 
            clientEdited: false
          };
        });

        setItems(seeded);
        
        const baseline = new Map();
        seeded.forEach(i => {
          const pid = String(i.productId);
          const qty = Number(i.originalRequestedQty) || 0;
          baseline.set(pid, (baseline.get(pid) || 0) + qty);
        });
        originalProductIdsRef.current = baseline;
      }
    };
    loadItems();
  }, [prefillOrder, allProducts, items.length, editingInvoiceId]);

  const closeModal = useCallback(() => { editingInvoiceId ? setShowExitDialog(true) : (sessionStorage.removeItem(STORAGE_KEY), onClose()); }, [editingInvoiceId, onClose, STORAGE_KEY]);
  useModalTrap(true, { disabled: disableBackTrap, onBackClose: onClose, customId: STORAGE_KEY });
  useScrollLock(true);

  const handleDiscardChanges = () => {
    setShowExitDialog(false); 
    setEditingInvoiceId(null); 
    sessionStorage.removeItem(STORAGE_KEY); 
    onClose(); 
    toast.info('Unsaved edits discarded. Original invoice is unchanged.');
  };

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      step, clientSearch, selectedClient, billType, address, gstin, drugLicense, pan, aadhaar,
      items, globalDiscountType, globalDiscountValue, editingInvoiceId
    }));
  }, [step, clientSearch, selectedClient, billType, address, gstin, drugLicense, pan, aadhaar, items, globalDiscountType, globalDiscountValue, editingInvoiceId, STORAGE_KEY]);

  const filteredClients = useMemo(() => clientSearch ? clients.filter(c => c.establishmentName.toLowerCase().includes(clientSearch.toLowerCase()) || (c.city && c.city.toLowerCase().includes(clientSearch.toLowerCase()))) : [], [clientSearch, clients]);
  const filteredProducts = useMemo(() => productSearch.length > 1 ? allProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.company.toLowerCase().includes(productSearch.toLowerCase())) : [], [productSearch, allProducts]);

  const handleSelectClient = (client) => {
    setSelectedClient(client); setClientSearch(client.establishmentName); setAddress(client.billingAddress || '');
    setGstin(client.gstin || ''); setDrugLicense([client.drugLicense20B, client.drugLicense21B].filter(Boolean).join(', '));
    setPan(client.pan || ''); setAadhaar(client.aadhaar || ''); setShowClientDropdown(false);
  };

  const addProduct = (product, callback) => {
    setProductSearch(''); 
    setShowProductDrop(false);
    
    setItems(prev => {
      if (prev.some(i => String(i.productId) === String(product.id || product.productId))) {
        toast.error("Medicine already added! Use the '+ Add Batch' button on its card to split batches.");
        return prev;
      }
      
      const batch = product.batches[0] || {};
      const newItem = {
        productId: product.productId || product.id, productName: product.name, companyShortCode: product.companyShortCode || product.company, packing: product.packing,
        hsn: product.hsn, gstRate: product.gstRate, availableBatches: product.batches, batchId: batch._id || '', batchNumber: batch.no || '',
        expiryDate: batch.expiry || '', mrp: batch.mrp || 0, 
        isOfferBatch: !!batch.offer, 
        offerDescription: batch.offer?.description || '',
        rate: product.defaultRate ?? (batch.mrp ? parseFloat((batch.mrp * 0.8).toFixed(2)) : 0),
        chargeableQty: 10, freeQty: 0, discountType: 'percent', discountValue: 0,
        originalRequestedQty: 10, clientEdited: false
      };

      const newItems = [...prev, newItem];
      if (callback) setTimeout(() => callback(newItems.length - 1), 0);
      return newItems;
    });
  };

  const cloneProductForNewBatch = (sourceIndex, callback) => {
    setItems(prev => {
      const sourceItem = prev[sourceIndex];
      if (!sourceItem) return prev;

      const existingItems = prev.filter(i => String(i.productId) === String(sourceItem.productId));
      const usedBatchIds = existingItems.map(i => String(i.batchId));
      
      const availableBatch = sourceItem.availableBatches.find(b => !usedBatchIds.includes(String(b._id)));
      
      if (!availableBatch) {
        toast.error("All available batches for this medicine have already been added.");
        return prev;
      }
      
      const newItem = {
        ...sourceItem,
        batchId: availableBatch._id || '', 
        batchNumber: availableBatch.no || '',
        expiryDate: availableBatch.expiry || '', 
        mrp: availableBatch.mrp || 0, 
        isOfferBatch: !!availableBatch.offer, 
        offerDescription: availableBatch.offer?.description || '',
        rate: sourceItem.rate, 
        chargeableQty: 1, 
        freeQty: 0, 
        discountType: sourceItem.discountType, 
        discountValue: 0,
        clientEdited: false
      };

      const newItems = [...prev];
      newItems.splice(sourceIndex + 1, 0, newItem);
      
      if (callback) setTimeout(() => callback(sourceIndex + 1), 0);
      return newItems;
    });
  };

  const updateItem = (idx, key, val) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const clearsEdit = ['chargeableQty', 'rate', 'freeQty'].includes(key);
      return { ...item, [key]: val, ...(clearsEdit ? { clientEdited: false } : {}) };
    }));
  };

  const handleBatchChange = (idx, batchNo) => {
    const batch = items[idx].availableBatches.find(b => b.no === batchNo);
    if (batch) { 
      updateItem(idx, 'batchNumber', batch.no); 
      updateItem(idx, 'expiryDate', batch.expiry); 
      updateItem(idx, 'mrp', batch.mrp); 
      updateItem(idx, 'batchId', batch._id); 
      updateItem(idx, 'isOfferBatch', !!batch.offer); 
      updateItem(idx, 'offerDescription', batch.offer?.description || ''); 
    }
  };

  const { totalTaxable, totalCGST, totalSGST } = useMemo(() => {
    let t = 0, c = 0, s = 0; items.forEach(i => { const x = calcLineTotal(i); t += x.taxable; c += x.cgst; s += x.sgst; });
    return { totalTaxable: t, totalCGST: c, totalSGST: s };
  }, [items]);

  const { netAmount, roundOff, finalDiscount } = useMemo(() => {
    const subtotal = totalTaxable + totalCGST + totalSGST;
    const discAmt = globalDiscountType === 'percent' ? (subtotal * globalDiscountValue) / 100 : globalDiscountValue;
    const after = subtotal - discAmt;
    return { netAmount: Math.round(after), roundOff: Math.round(after) - after, finalDiscount: discAmt };
  }, [totalTaxable, totalCGST, totalSGST, globalDiscountType, globalDiscountValue]);

  const [invoiceNumber, setInvoiceNumber] = useState(prefillOrder?.invoiceNumber || (() => {
    const now = new Date(); return `MIL-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  })());

  const handleConfirmClick = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setTimeout(() => {
      const latestItems = itemsRef.current;

      if (prefillOrder && originalProductIdsRef.current) {
        const currentUniqueProducts = new Set(latestItems.map(i => String(i.productId)));
        
        const addedNewProduct = latestItems.some(i => !originalProductIdsRef.current.has(String(i.productId)));
        const removedProduct = currentUniqueProducts.size < originalProductIdsRef.current.size;

        const qtyChanged = Array.from(originalProductIdsRef.current.keys()).some(productId => {
          const baselineQty = originalProductIdsRef.current.get(productId);
          
          const currentQty = latestItems
            .filter(i => String(i.productId) === productId)
            .reduce((sum, i) => sum + (Number(i.chargeableQty) || 0) + (Number(i.freeQty) || 0), 0);

          return currentQty !== baselineQty;
        });

        if ((addedNewProduct || removedProduct || qtyChanged) && !modReason.trim()) {
          setShowModReasonPrompt(true); 
          return;
        }
      }
      handleConfirm();
    }, 100);
  };

  const handleConfirm = async () => {
    try {
      const latestItems = itemsRef.current; 

      const payload = {
        clientObjectId: selectedClient._id, 
        adminNote: adminNote.trim() || undefined, 
        billType, 
        globalDiscountType, 
        globalDiscountValue,
        items: latestItems.map(i => ({ 
          productId: i.productId, 
          batchId: i.batchId, 
          billedQty: i.chargeableQty + i.freeQty, 
          chargeableQty: i.chargeableQty, 
          freeQty: i.freeQty, 
          rate: i.rate, 
          discountType: i.discountType, 
          discountValue: i.discountValue, 
          discountPercent: i.discountType === 'percent' ? i.discountValue : 0, 
          discountAmount: i.discountType === 'amount' ? i.discountValue : 0,
          offerDescription: i.offerDescription || '' 
        })),
      };
      
      if (prefillOrder) payload.orderId = prefillOrder._id;
      if (phoneIn) payload.createLinkedOrder = true;
      if (modReason.trim()) payload.modificationNote = modReason.trim();

      const res = editingInvoiceId ? await api.updateSalesInvoice(editingInvoiceId, payload) : await api.createSalesInvoice(payload);
      toast.success(editingInvoiceId ? 'Invoice updated' : 'Invoice created');

      if (res.order && onOrderUpdated) { onOrderUpdated(res.order); }

      const saved = res.data;
      setGeneratedInvoice({
        _id: saved._id, id: saved.invoiceNumber, orderId: res.order?.orderId || prefillOrder?.orderId, client: saved.clientName, area: saved.clientBillingAddress || '',
        items: saved.items.length, amount: saved.netAmount, due: saved.dueAmount, date: saved.invoiceDate.split('T')[0], status: saved.paymentStatus, billType: saved.billType,
        products: saved.items, previousBalance: saved.previousOutstanding ?? selectedClient.totalOutstanding ?? 0, previousBalanceDate: saved.previousOutstandingDate ?? selectedClient.outstandingDate ?? null,
      });
      setEditingInvoiceId(null); setStep(4); sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) { toast.error(error.message); }
  };

  const handleNewInvoice = async () => {
    setStep(1); setClientSearch(''); setSelectedClient(null); setBillType('Credit');
    setAddress(''); setGstin(''); setDrugLicense(''); setPan(''); setAadhaar('');
    setItems([]); setGlobalDiscountValue(0); setGeneratedInvoice(null); setEditingInvoiceId(null);
    setInvoiceNumber(`MIL-${String(new Date().getMonth() + 1).padStart(2, '0')}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const hasValidID = !!(gstin || drugLicense || pan || aadhaar);
  const canProceed1 = !!selectedClient && hasValidID;

  if (loading) return <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"><div className="w-full max-w-5xl bg-white rounded-2xl flex items-center justify-center h-[50vh]"><Loader2 className="animate-spin text-slate-500" /></div></div>;

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60 flex items-end">
        {/* ✨ FIX: Completely mimics PaymentModal layout. No flex-col, no inner scrolling child! */}
        <div className="w-full bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-white z-30 border-b border-slate-100">
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{editingInvoiceId ? 'Edit Invoice' : prefillOrder ? `Invoice for ${prefillOrder.orderId}` : phoneIn ? 'New Phone-in Order' : 'Generate Invoice'}</h3>
                <p className="text-slate-500 text-sm font-mono">{invoiceNumber}</p>
              </div>
              <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={22} className="text-slate-400" /></button>
            </div>
            {step < 4 && (
              <div className="flex bg-slate-50">
                {[1, 2, 3].map(n => <button key={n} onClick={() => { if (n < step || (n === 2 && canProceed1) || (n === 3 && items.length > 0)) setStep(n); }} className={`flex-1 py-3 text-sm font-semibold border-b-2 ${step === n ? 'border-slate-900 text-slate-900 bg-white' : n < step ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400'}`}>{n < step ? '✓ ' : `${n}. `}{n === 1 ? 'Party & Header' : n === 2 ? 'Add Items' : 'Review & Confirm'}</button>)}
              </div>
            )}
          </div>

          <div className="px-5 py-4 pb-10 animate-fadeIn">
            {step === 1 && (
              <Step1
                clientSearch={clientSearch} setClientSearch={setClientSearch} showClientDropdown={showClientDropdown} setShowClientDropdown={setShowClientDropdown}
                selectedClient={selectedClient} setSelectedClient={setSelectedClient} filteredClients={filteredClients} handleSelectClient={handleSelectClient}
                billType={billType} setBillType={setBillType} invoiceDate={invoiceDate} address={address} gstin={gstin} drugLicense={drugLicense} pan={pan} aadhaar={aadhaar}
                lockClient={effectiveLockClient} canProceed1={canProceed1} onNext={() => setStep(2)}
                prefBillType={prefillOrder?.billPreference}
              />
            )}
            {step === 2 && <Step2 productSearch={productSearch} setProductSearch={setProductSearch} showProductDrop={showProductDrop} setShowProductDrop={setShowProductDrop} filteredProducts={filteredProducts} addProduct={addProduct} cloneProductForNewBatch={cloneProductForNewBatch} items={items} removeItem={(idx) => setItems(prev => prev.filter((_, i) => i !== idx))} updateItem={updateItem} handleBatchChange={handleBatchChange} canProceed2={items.length > 0} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
              
            {step === 3 && <Step3 invoiceNumber={invoiceNumber} selectedClient={selectedClient} billType={billType} invoiceDate={invoiceDate} gstin={gstin} drugLicense={drugLicense} items={items} totalTaxable={totalTaxable} globalDiscountValue={globalDiscountValue} globalDiscountType={globalDiscountType} setGlobalDiscountType={setGlobalDiscountType} setGlobalDiscountValue={setGlobalDiscountValue} adminNote={adminNote} setAdminNote={setAdminNote} clientNote={clientNote} clientNoteEdited={clientNoteEdited} finalDiscount={finalDiscount} totalCGST={totalCGST} totalSGST={totalSGST} roundOff={roundOff} netAmount={netAmount} onBack={() => setStep(2)} onConfirm={handleConfirmClick} />}

            {step === 4 && generatedInvoice && <Step4 generatedInvoice={generatedInvoice} isPrefilled={!!prefillOrder} onDownloadPDF={() => downloadInvoicePDF(generatedInvoice, items.map((l, i) => ({ ...l, companyShortCode: generatedInvoice.products[i]?.companyShortCode || l.companyShortCode || l.company })), totalTaxable, totalCGST, totalSGST, netAmount, globalDiscountValue, finalDiscount, 'intrastate')} onPrintPDF={() => printInvoicePDF(generatedInvoice, items.map((l, i) => ({ ...l, companyShortCode: generatedInvoice.products[i]?.companyShortCode || l.companyShortCode || l.company })), totalTaxable, totalCGST, totalSGST, netAmount, globalDiscountValue, finalDiscount, 'intrastate')} onNewInvoice={handleNewInvoice} onEditInvoice={() => { setEditingInvoiceId(generatedInvoice._id); setStep(2); }} onClose={closeModal} />}
          </div>
        </div>
      </div>

      <ExitDialog isOpen={showExitDialog} onComplete={() => { setShowExitDialog(false); setStep(3); }} onDiscard={handleDiscardChanges} onCancel={() => setShowExitDialog(false)} />
      <ModReasonPrompt isOpen={showModReasonPrompt} modReason={modReason} setModReason={setModReason} onBack={() => setShowModReasonPrompt(false)} onContinue={() => { setShowModReasonPrompt(false); handleConfirm(); }} />
      <ClientEditingPrompt isOpen={showEditPrompt} onOk={() => { setShowEditPrompt(false); setShowTimerOverlay(true); }} onGoToOrders={() => { onClose(); navigate('/admin-dashboard/orders'); }} />
      <LiveTimerOverlay isOpen={showTimerOverlay} timer={editTimer} onBackToOrders={() => { onClose(); navigate('/admin-dashboard/orders'); }} />

      <OrderCancelledPrompt
        isOpen={showCancelPrompt}
        reason={cancelReason}
        onGoToOrders={() => {
          setShowCancelPrompt(false);
          sessionStorage.removeItem(STORAGE_KEY);
          if (onOrderUpdated) onOrderUpdated({ ...prefillOrder, status: 'Cancelled', _id: prefillOrder._id }); 
          onClose();
        }}
      />
    </>
  );
};

export default MakeInvoiceModal;









// // src/modals/MakeInvoiceModal/index.jsx
// import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { X, Loader2 } from 'lucide-react';
// import { toast } from 'sonner';

// import { calcLineTotal } from '../../features/Admin/BillingPage/utils/helpers';
// import { useModalTrap, useScrollLock } from '../../hooks/useBackHandler';
// import { api } from '../../services/api';
// import { downloadInvoicePDF, printInvoicePDF } from '../../features/Admin/BillingPage/pdf/invoice/generateInvoicePdf';

// import { Step1 } from './Step1';
// import { Step2 } from './Step2';
// import { Step3 } from './Step3';
// import { Step4 } from './Step4';
// import { ExitDialog, ModReasonPrompt, ClientEditingPrompt, LiveTimerOverlay, OrderCancelledPrompt } from './components/InvoiceOverlays';

// export const MakeInvoiceModal = ({
//   onClose, prefillClient = null, lockClient = false, disableBackTrap = false,
//   prefillOrder = null, phoneIn = false, onOrderUpdated = null,
// }) => {
//   const navigate = useNavigate();
//   const today = new Date().toISOString().split('T')[0];

//   const STORAGE_KEY = prefillOrder ? `makeInvoiceState_order_${prefillOrder._id}` : prefillClient ? `makeInvoiceState_client_${prefillClient._id}` : phoneIn ? 'makeInvoiceState_phonein' : 'makeInvoiceState_standalone';
//   const effectiveLockClient = lockClient || !!prefillOrder;

//   const loadSavedState = () => { try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { return null; } };
//   const savedState = loadSavedState();

//   const [step, setStep] = useState(savedState?.step ?? (prefillOrder?.invoiceDocumentId ? 2 : 1));
//   const [clientSearch, setClientSearch] = useState(prefillClient?.establishmentName || prefillOrder?.clientId?.establishmentName || savedState?.clientSearch || '');
//   const [showClientDropdown, setShowClientDropdown] = useState(false);
//   const [selectedClient, setSelectedClient] = useState(prefillClient || prefillOrder?.clientId || savedState?.selectedClient || null);
//   const [billType, setBillType] = useState(prefillOrder?.billPreference || (savedState?.billType ?? 'Credit'));
//   const [invoiceDate] = useState(today);
//   const [address, setAddress] = useState(prefillClient?.billingAddress || prefillOrder?.clientId?.billingAddress || savedState?.address || '');

//   const [gstin, setGstin] = useState(prefillClient?.gstin || prefillOrder?.clientId?.gstin || savedState?.gstin || '');
//   const [drugLicense, setDrugLicense] = useState(prefillClient ? [prefillClient.drugLicense20B, prefillClient.drugLicense21B].filter(Boolean).join(', ') : prefillOrder?.clientId ? [prefillOrder.clientId.drugLicense20B, prefillOrder.clientId.drugLicense21B].filter(Boolean).join(', ') : (savedState?.drugLicense || ''));
//   const [pan, setPan] = useState(prefillClient?.pan || prefillOrder?.clientId?.pan || savedState?.pan || '');
//   const [aadhaar, setAadhaar] = useState(prefillClient?.aadhaar || prefillOrder?.clientId?.aadhaar || savedState?.aadhaar || '');

//   const [items, setItems] = useState(savedState?.items ?? []);
//   const [productSearch, setProductSearch] = useState('');
//   const [showProductDrop, setShowProductDrop] = useState(false);
  
//   const [globalDiscountType, setGlobalDiscountType] = useState(savedState?.globalDiscountType ?? prefillOrder?.discountType ?? 'percent');
//   const [globalDiscountValue, setGlobalDiscountValue] = useState(savedState?.globalDiscountValue ?? prefillOrder?.discountValue ?? 0);
  
//   const [generatedInvoice, setGeneratedInvoice] = useState(null);

//   const [editingInvoiceId, setEditingInvoiceId] = useState(savedState?.editingInvoiceId ?? prefillOrder?.invoiceDocumentId ?? null);
//   const [showExitDialog, setShowExitDialog] = useState(false);
//   const [allProducts, setAllProducts] = useState([]);
//   const [clients, setClients] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // ✨ FIX: This ref now stores a Map of { ProductID: Total Baseline Qty }
//   const originalProductIdsRef = useRef(null);
  
//   const [modReason, setModReason] = useState('');
//   const [showModReasonPrompt, setShowModReasonPrompt] = useState(false);

//   const [isClientEditing, setIsClientEditing] = useState(false);
//   const [showEditPrompt, setShowEditPrompt] = useState(false);
//   const [showTimerOverlay, setShowTimerOverlay] = useState(false);
//   const [editTimer, setEditTimer] = useState('02:00');
//   const [editExpiresAt, setEditExpiresAt] = useState(null);
//   const [adminNote, setAdminNote] = useState(prefillOrder?.adminNote || '');

//   const [clientNote, setClientNote] = useState(prefillOrder?.clientNote || '');
//   const [clientNoteEdited, setClientNoteEdited] = useState(false);
  
//   const [cancelReason, setCancelReason] = useState('');
//   const [showCancelPrompt, setShowCancelPrompt] = useState(false);

//   useEffect(() => {
//     api.getProductsWithBatches().then(res => setAllProducts(res.data || [])).catch(() => toast.error('Failed to load products'));
//     api.getClients().then(res => setClients(res.data || [])).finally(() => setLoading(false));
//   }, []);

//   useEffect(() => {
//     if (!prefillOrder?._id) return;
//     const interval = setInterval(async () => {
//       try {
//         const freshRes = await api.getOrderById(prefillOrder._id);
//         const order = freshRes.data;
        
//         if (order.status === 'Cancelled') {
//           setCancelReason(order.clientCancelReason || order.adminCancelReason || 'No reason provided.');
//           setShowCancelPrompt(true);
//           return;
//         }
        
//         if (order.status === 'Editing') {
//           if (!isClientEditing) {
//             setIsClientEditing(true);
//             setEditExpiresAt(new Date(order.editWindowExpiresAt).getTime());
//             setShowEditPrompt(true);
//           }
//         } else if (isClientEditing) {
//           setIsClientEditing(false); setShowEditPrompt(false); setShowTimerOverlay(false);
//           toast.success("Client finished editing. Invoice updated with new quantities!");
          
//           setClientNoteEdited(order.clientNote !== prefillOrder.clientNote);
//           setClientNote(order.clientNote || '');

//           setItems(prevItems => prevItems.map(item => {
//             const freshItem = order.items.find(fi => (fi.productId._id || fi.productId).toString() === item.productId.toString());

//             if (freshItem) {
//               const freshQty = freshItem.requestedQty ?? freshItem.finalQty ?? 1;
//               if (freshQty !== item.originalRequestedQty) {
//                 return { 
//                   ...item, 
//                   chargeableQty: freshQty, 
//                   originalRequestedQty: freshQty, 
//                   freeQty: 0, 
//                   discountValue: 0, 
//                   clientEdited: true 
//                 };
//               }
//               return item; 
//             }

//             if (originalProductIdsRef.current.has(String(item.productId))) {
//               return null; 
//             }

//             return item;
//           }).filter(Boolean)); 

//           if (onOrderUpdated) onOrderUpdated(order);
//         }
//       } catch { } 
//     }, 3000);
//     return () => clearInterval(interval);
//   }, [prefillOrder, isClientEditing, onOrderUpdated]);

//   useEffect(() => {
//     if (!showTimerOverlay || !editExpiresAt) return;
//     const timerInterval = setInterval(() => {
//       const diff = editExpiresAt - Date.now();
//       if (diff <= 0) setEditTimer('00:00');
//       else setEditTimer(`${Math.floor(diff / 60000).toString().padStart(2, '0')}:${Math.floor((diff % 60000) / 1000).toString().padStart(2, '0')}`);
//     }, 1000);
//     return () => clearInterval(timerInterval);
//   }, [showTimerOverlay, editExpiresAt]);

//   useEffect(() => {
//     if (prefillOrder && !selectedClient && prefillOrder.clientId) {
//       setSelectedClient(prefillOrder.clientId); setClientSearch(prefillOrder.clientId.establishmentName);
//       setGstin(prefillOrder.clientId.gstin || ''); setAddress(prefillOrder.clientId.billingAddress || '');
//       setDrugLicense([prefillOrder.clientId.drugLicense20B, prefillOrder.clientId.drugLicense21B].filter(Boolean).join(', '));
//       setPan(prefillOrder.clientId.pan || ''); setAadhaar(prefillOrder.clientId.aadhaar || '');
//       setBillType(prefillOrder.billPreference || 'Credit');
//     }
//   }, [prefillOrder, selectedClient]);

//   useEffect(() => {
//     const loadItems = async () => {
//       if (allProducts.length === 0 || items.length > 0 || originalProductIdsRef.current) return;

//       if (editingInvoiceId) {
//         try {
//           const { data: inv } = await api.getSalesInvoiceById(editingInvoiceId);
//           const seeded = inv.items.map(ii => {
//             const catalogProduct = allProducts.find(p => String(p.productId || p.id || p._id) === String(ii.productId));
//             const matchedBatch = catalogProduct?.batches?.find(b => b.no === ii.batchNumber) || {};
            
//             return {
//               productId: catalogProduct?.productId || catalogProduct?.id || ii.productId, 
//               productName: ii.productName, companyShortCode: ii.companyShortCode,
//               packing: ii.packing, hsn: ii.hsn, gstRate: catalogProduct?.gstRate || 0, availableBatches: catalogProduct?.batches || [],
//               batchId: ii.batchId, batchNumber: ii.batchNumber, expiryDate: ii.expiryDate, mrp: ii.mrp, 
//               isOfferBatch: !!matchedBatch.offer,
//               offerDescription: matchedBatch.offer?.description || '',
//               rate: ii.rate, chargeableQty: ii.chargeableQty ?? 1, freeQty: ii.freeQty ?? 0,
//               discountType: ii.discountPercent > 0 ? 'percent' : 'amount', discountValue: ii.discountPercent || ii.discountAmount || 0,
//               originalRequestedQty: (ii.chargeableQty || 0) + (ii.freeQty || 0), clientEdited: false
//             };
//           });

//           setItems(seeded);
          
//           // ✨ FIX: Build a secure Baseline Map from the existing invoice!
//           const baseline = new Map();
//           seeded.forEach(i => {
//             const pid = String(i.productId);
//             const qty = (Number(i.chargeableQty) || 0) + (Number(i.freeQty) || 0);
//             baseline.set(pid, (baseline.get(pid) || 0) + qty);
//           });
//           originalProductIdsRef.current = baseline;
          
//           setGlobalDiscountType(inv.globalDiscountPercent ? 'percent' : 'amount');
//           setGlobalDiscountValue(inv.globalDiscountPercent || inv.globalDiscountAmount || 0);
//           return;
//         } catch (err) { toast.error("Failed to load the existing invoice items."); }
//       }

//       if (prefillOrder) {
//         const seeded = (prefillOrder.items || []).map((oi) => {
//           const productId = String(oi.productId?._id || oi.productId);
          
//           const catalogProduct = allProducts.find((p) => String(p.productId || p.id || p._id) === productId);
          
//           const batches = catalogProduct?.batches ? JSON.parse(JSON.stringify(catalogProduct.batches)) : [];
//           const plannedBatchId = oi.plannedBatches?.[0]?.batchId;
          
//           const currentOrderQty = oi.chargeableQty ?? oi.finalQty ?? 1;
//           if (plannedBatchId) {
//             const specificBatch = batches.find(b => String(b._id) === String(plannedBatchId._id || plannedBatchId));
//             if (specificBatch) specificBatch.stock += currentOrderQty;
//           }

//           let fallbackBatch = batches.find(b => !b.offer) || batches[0] || {};
//           if (batches.length > 0) {
//             const today = new Date();
//             const thresholdDays = catalogProduct?.shortExpiryThreshold || 90;
//             const msPerDay = 1000 * 60 * 60 * 24;
            
//             const safeBatch = batches.find(b => 
//               !b.offer && 
//               b.expiry && 
//               ((new Date(b.expiry) - today) / msPerDay) > thresholdDays
//             );
//             if (safeBatch) fallbackBatch = safeBatch;
//           }

//           const batch = (plannedBatchId ? batches.find(b => String(b._id) === String(plannedBatchId._id || plannedBatchId)) : null) || fallbackBatch;

//           return {
//             productId: catalogProduct?.productId || catalogProduct?.id || productId, 
//             productName: catalogProduct?.name || oi.productId?.name || 'Unknown',
//             companyShortCode: catalogProduct?.companyShortCode || catalogProduct?.company || '', 
//             packing: catalogProduct?.packing || oi.productId?.packing || '',
//             hsn: catalogProduct?.hsn || '', 
//             gstRate: catalogProduct?.gstRate ?? oi.productId?.gstRate ?? 0,
//             availableBatches: batches, 
//             batchId: batch._id || '', 
//             batchNumber: batch.no || '', 
//             expiryDate: batch.expiry || '',
//             mrp: batch.mrp || 0, 
//             isOfferBatch: !!batch.offer, 
//             offerDescription: batch.offer?.description || '',
//             rate: (oi.finalPrice || catalogProduct?.defaultRate) ?? (batch.mrp ? parseFloat((batch.mrp * 0.8).toFixed(2)) : 0),
//             chargeableQty: currentOrderQty, 
//             freeQty: oi.freeQty ?? 0, 
//             discountType: oi.discountType || 'percent', 
//             discountValue: oi.discountValue || 0,
//             originalRequestedQty: oi.requestedQty ?? oi.finalQty ?? 1, 
//             clientEdited: false
//           };
//         });

//         setItems(seeded);
        
//         // ✨ FIX: Build a secure Baseline Map from the initial Order!
//         const baseline = new Map();
//         seeded.forEach(i => {
//           const pid = String(i.productId);
//           const qty = Number(i.originalRequestedQty) || 0;
//           baseline.set(pid, (baseline.get(pid) || 0) + qty);
//         });
//         originalProductIdsRef.current = baseline;
//       }
//     };
//     loadItems();
//   }, [prefillOrder, allProducts, items.length, editingInvoiceId]);

//   const closeModal = useCallback(() => { editingInvoiceId ? setShowExitDialog(true) : (sessionStorage.removeItem(STORAGE_KEY), onClose()); }, [editingInvoiceId, onClose, STORAGE_KEY]);
//   useModalTrap(true, { disabled: disableBackTrap, onBackClose: onClose, customId: STORAGE_KEY });
//   useScrollLock(true);

//   const handleDiscardChanges = () => {
//     setShowExitDialog(false); 
//     setEditingInvoiceId(null); 
//     sessionStorage.removeItem(STORAGE_KEY); 
//     onClose(); 
//     toast.info('Unsaved edits discarded. Original invoice is unchanged.');
//   };

//   useEffect(() => {
//     sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
//       step, clientSearch, selectedClient, billType, address, gstin, drugLicense, pan, aadhaar,
//       items, globalDiscountType, globalDiscountValue, editingInvoiceId
//     }));
//   }, [step, clientSearch, selectedClient, billType, address, gstin, drugLicense, pan, aadhaar, items, globalDiscountType, globalDiscountValue, editingInvoiceId, STORAGE_KEY]);

//   const filteredClients = useMemo(() => clientSearch ? clients.filter(c => c.establishmentName.toLowerCase().includes(clientSearch.toLowerCase()) || (c.city && c.city.toLowerCase().includes(clientSearch.toLowerCase()))) : [], [clientSearch, clients]);
//   const filteredProducts = useMemo(() => productSearch.length > 1 ? allProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.company.toLowerCase().includes(productSearch.toLowerCase())) : [], [productSearch, allProducts]);

//   const handleSelectClient = (client) => {
//     setSelectedClient(client); setClientSearch(client.establishmentName); setAddress(client.billingAddress || '');
//     setGstin(client.gstin || ''); setDrugLicense([client.drugLicense20B, client.drugLicense21B].filter(Boolean).join(', '));
//     setPan(client.pan || ''); setAadhaar(client.aadhaar || ''); setShowClientDropdown(false);
//   };

//   const addProduct = (product, callback) => {
//     setProductSearch(''); 
//     setShowProductDrop(false);
    
//     setItems(prev => {
//       if (prev.some(i => String(i.productId) === String(product.id || product.productId))) {
//         toast.error("Medicine already added! Use the '+ Add Batch' button on its card to split batches.");
//         return prev;
//       }
      
//       const batch = product.batches[0] || {};
//       const newItem = {
//         productId: product.productId || product.id, productName: product.name, companyShortCode: product.companyShortCode || product.company, packing: product.packing,
//         hsn: product.hsn, gstRate: product.gstRate, availableBatches: product.batches, batchId: batch._id || '', batchNumber: batch.no || '',
//         expiryDate: batch.expiry || '', mrp: batch.mrp || 0, 
//         isOfferBatch: !!batch.offer, 
//         offerDescription: batch.offer?.description || '',
//         rate: product.defaultRate ?? (batch.mrp ? parseFloat((batch.mrp * 0.8).toFixed(2)) : 0),
//         chargeableQty: 10, freeQty: 0, discountType: 'percent', discountValue: 0,
//         originalRequestedQty: 10, clientEdited: false
//       };

//       const newItems = [...prev, newItem];
//       if (callback) setTimeout(() => callback(newItems.length - 1), 0);
//       return newItems;
//     });
//   };

//   const cloneProductForNewBatch = (sourceIndex, callback) => {
//     setItems(prev => {
//       const sourceItem = prev[sourceIndex];
//       if (!sourceItem) return prev;

//       const existingItems = prev.filter(i => String(i.productId) === String(sourceItem.productId));
//       const usedBatchIds = existingItems.map(i => String(i.batchId));
      
//       const availableBatch = sourceItem.availableBatches.find(b => !usedBatchIds.includes(String(b._id)));
      
//       if (!availableBatch) {
//         toast.error("All available batches for this medicine have already been added.");
//         return prev;
//       }
      
//       const newItem = {
//         ...sourceItem,
//         batchId: availableBatch._id || '', 
//         batchNumber: availableBatch.no || '',
//         expiryDate: availableBatch.expiry || '', 
//         mrp: availableBatch.mrp || 0, 
//         isOfferBatch: !!availableBatch.offer, 
//         offerDescription: availableBatch.offer?.description || '',
//         rate: sourceItem.rate, 
//         chargeableQty: 1, 
//         freeQty: 0, 
//         discountType: sourceItem.discountType, 
//         discountValue: 0,
//         clientEdited: false
//       };

//       const newItems = [...prev];
//       newItems.splice(sourceIndex + 1, 0, newItem);
      
//       if (callback) setTimeout(() => callback(sourceIndex + 1), 0);
//       return newItems;
//     });
//   };

//   const updateItem = (idx, key, val) => {
//     setItems(prev => prev.map((item, i) => {
//       if (i !== idx) return item;
//       const clearsEdit = ['chargeableQty', 'rate', 'freeQty'].includes(key);
//       return { ...item, [key]: val, ...(clearsEdit ? { clientEdited: false } : {}) };
//     }));
//   };

//   const handleBatchChange = (idx, batchNo) => {
//     const batch = items[idx].availableBatches.find(b => b.no === batchNo);
//     if (batch) { 
//       updateItem(idx, 'batchNumber', batch.no); 
//       updateItem(idx, 'expiryDate', batch.expiry); 
//       updateItem(idx, 'mrp', batch.mrp); 
//       updateItem(idx, 'batchId', batch._id); 
//       updateItem(idx, 'isOfferBatch', !!batch.offer); 
//       updateItem(idx, 'offerDescription', batch.offer?.description || ''); 
//     }
//   };

//   const { totalTaxable, totalCGST, totalSGST } = useMemo(() => {
//     let t = 0, c = 0, s = 0; items.forEach(i => { const x = calcLineTotal(i); t += x.taxable; c += x.cgst; s += x.sgst; });
//     return { totalTaxable: t, totalCGST: c, totalSGST: s };
//   }, [items]);

//   const { netAmount, roundOff, finalDiscount } = useMemo(() => {
//     const subtotal = totalTaxable + totalCGST + totalSGST;
//     const discAmt = globalDiscountType === 'percent' ? (subtotal * globalDiscountValue) / 100 : globalDiscountValue;
//     const after = subtotal - discAmt;
//     return { netAmount: Math.round(after), roundOff: Math.round(after) - after, finalDiscount: discAmt };
//   }, [totalTaxable, totalCGST, totalSGST, globalDiscountType, globalDiscountValue]);

//   const [invoiceNumber, setInvoiceNumber] = useState(prefillOrder?.invoiceNumber || (() => {
//     const now = new Date(); return `MIL-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
//   })());

//   // ✨ FIX: Check against the impenetrable Baseline Map
//   const handleConfirmClick = () => {
//     if (prefillOrder && originalProductIdsRef.current) {
//       const currentUniqueProducts = new Set(items.map(i => String(i.productId)));
      
//       const addedNewProduct = items.some(i => !originalProductIdsRef.current.has(String(i.productId)));
//       const removedProduct = currentUniqueProducts.size < originalProductIdsRef.current.size;

//       // Extract Map keys directly into an array to verify baseline maths
//       const qtyChanged = Array.from(originalProductIdsRef.current.keys()).some(productId => {
//         const baselineQty = originalProductIdsRef.current.get(productId);
        
//         // Sum up the active session qty (Bill + Free)
//         const currentQty = items
//           .filter(i => String(i.productId) === productId)
//           .reduce((sum, i) => sum + (Number(i.chargeableQty) || 0) + (Number(i.freeQty) || 0), 0);

//         return currentQty !== baselineQty;
//       });

//       if ((addedNewProduct || removedProduct || qtyChanged) && !modReason.trim()) {
//         setShowModReasonPrompt(true); 
//         return;
//       }
//     }
//     handleConfirm();
//   };

//   const handleConfirm = async () => {
//     try {
//       const payload = {
//         clientObjectId: selectedClient._id, 
//         adminNote: adminNote.trim() || undefined, 
//         billType, 
//         globalDiscountType, 
//         globalDiscountValue,
//         items: items.map(i => ({ 
//           productId: i.productId, 
//           batchId: i.batchId, 
//           billedQty: i.chargeableQty + i.freeQty, 
//           chargeableQty: i.chargeableQty, 
//           freeQty: i.freeQty, 
//           rate: i.rate, 
//           discountType: i.discountType, 
//           discountValue: i.discountValue, 
//           discountPercent: i.discountType === 'percent' ? i.discountValue : 0, 
//           discountAmount: i.discountType === 'amount' ? i.discountValue : 0,
//           offerDescription: i.offerDescription || '' 
//         })),
//       };
      
//       if (prefillOrder) payload.orderId = prefillOrder._id;
//       if (phoneIn) payload.createLinkedOrder = true;
//       if (modReason.trim()) payload.modificationNote = modReason.trim();

//       const res = editingInvoiceId ? await api.updateSalesInvoice(editingInvoiceId, payload) : await api.createSalesInvoice(payload);
//       toast.success(editingInvoiceId ? 'Invoice updated' : 'Invoice created');

//       if (res.order && onOrderUpdated) { onOrderUpdated(res.order); }

//       const saved = res.data;
//       setGeneratedInvoice({
//         _id: saved._id, id: saved.invoiceNumber, orderId: res.order?.orderId || prefillOrder?.orderId, client: saved.clientName, area: saved.clientBillingAddress || '',
//         items: saved.items.length, amount: saved.netAmount, due: saved.dueAmount, date: saved.invoiceDate.split('T')[0], status: saved.paymentStatus, billType: saved.billType,
//         products: saved.items, previousBalance: saved.previousOutstanding ?? selectedClient.totalOutstanding ?? 0, previousBalanceDate: saved.previousOutstandingDate ?? selectedClient.outstandingDate ?? null,
//       });
//       setEditingInvoiceId(null); setStep(4); sessionStorage.removeItem(STORAGE_KEY);
//     } catch (error) { toast.error(error.message); }
//   };

//   const handleNewInvoice = async () => {
//     setStep(1); setClientSearch(''); setSelectedClient(null); setBillType('Credit');
//     setAddress(''); setGstin(''); setDrugLicense(''); setPan(''); setAadhaar('');
//     setItems([]); setGlobalDiscountValue(0); setGeneratedInvoice(null); setEditingInvoiceId(null);
//     setInvoiceNumber(`MIL-${String(new Date().getMonth() + 1).padStart(2, '0')}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
//     sessionStorage.removeItem(STORAGE_KEY);
//   };

//   const hasValidID = !!(gstin || drugLicense || pan || aadhaar);
//   const canProceed1 = !!selectedClient && hasValidID;

//   if (loading) return <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"><div className="w-full max-w-5xl bg-white rounded-2xl flex items-center justify-center h-[50vh]"><Loader2 className="animate-spin text-slate-500" /></div></div>;

//   return (
//     <>
//       <div className="fixed inset-0 z-[100] bg-black/60 flex items-end">
// <div className="w-full bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-[0_-10px_40px_rgba(0,0,0,0.15)]">          <div className="sticky top-0 bg-white z-10 shrink-0">
//             <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
//               <div>
//                 <h3 className="font-bold text-slate-900 text-lg">{editingInvoiceId ? 'Edit Invoice' : prefillOrder ? `Invoice for ${prefillOrder.orderId}` : phoneIn ? 'New Phone-in Order' : 'Generate Invoice'}</h3>
//                 <p className="text-slate-500 text-sm font-mono">{invoiceNumber}</p>
//               </div>
//               <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={22} className="text-slate-400" /></button>
//             </div>
//             {step < 4 && (
//               <div className="flex bg-slate-50 border-b border-slate-100">
//                 {[1, 2, 3].map(n => <button key={n} onClick={() => { if (n < step || (n === 2 && canProceed1) || (n === 3 && items.length > 0)) setStep(n); }} className={`flex-1 py-3 text-sm font-semibold border-b-2 ${step === n ? 'border-slate-900 text-slate-900 bg-white' : n < step ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400'}`}>{n < step ? '✓ ' : `${n}. `}{n === 1 ? 'Party & Header' : n === 2 ? 'Add Items' : 'Review & Confirm'}</button>)}
//               </div>
//             )}
//           </div>

//           <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 animate-fadeIn">
//             {step === 1 && (
//               <Step1
//                 clientSearch={clientSearch} setClientSearch={setClientSearch} showClientDropdown={showClientDropdown} setShowClientDropdown={setShowClientDropdown}
//                 selectedClient={selectedClient} setSelectedClient={setSelectedClient} filteredClients={filteredClients} handleSelectClient={handleSelectClient}
//                 billType={billType} setBillType={setBillType} invoiceDate={invoiceDate} address={address} gstin={gstin} drugLicense={drugLicense} pan={pan} aadhaar={aadhaar}
//                 lockClient={effectiveLockClient} canProceed1={canProceed1} onNext={() => setStep(2)}
//                 prefBillType={prefillOrder?.billPreference}
//               />
//             )}
//             {step === 2 && <Step2 productSearch={productSearch} setProductSearch={setProductSearch} showProductDrop={showProductDrop} setShowProductDrop={setShowProductDrop} filteredProducts={filteredProducts} addProduct={addProduct} cloneProductForNewBatch={cloneProductForNewBatch} items={items} removeItem={(idx) => setItems(prev => prev.filter((_, i) => i !== idx))} updateItem={updateItem} handleBatchChange={handleBatchChange} canProceed2={items.length > 0} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
              
//             {step === 3 && <Step3 invoiceNumber={invoiceNumber} selectedClient={selectedClient} billType={billType} invoiceDate={invoiceDate} gstin={gstin} drugLicense={drugLicense} items={items} totalTaxable={totalTaxable} globalDiscountValue={globalDiscountValue} globalDiscountType={globalDiscountType} setGlobalDiscountType={setGlobalDiscountType} setGlobalDiscountValue={setGlobalDiscountValue} adminNote={adminNote} setAdminNote={setAdminNote} clientNote={clientNote} clientNoteEdited={clientNoteEdited} finalDiscount={finalDiscount} totalCGST={totalCGST} totalSGST={totalSGST} roundOff={roundOff} netAmount={netAmount} onBack={() => setStep(2)} onConfirm={handleConfirmClick} />}

//             {step === 4 && generatedInvoice && <Step4 generatedInvoice={generatedInvoice} isPrefilled={!!prefillOrder} onDownloadPDF={() => downloadInvoicePDF(generatedInvoice, items.map((l, i) => ({ ...l, companyShortCode: generatedInvoice.products[i]?.companyShortCode || l.companyShortCode || l.company })), totalTaxable, totalCGST, totalSGST, netAmount, globalDiscountValue, finalDiscount, 'intrastate')} onPrintPDF={() => printInvoicePDF(generatedInvoice, items.map((l, i) => ({ ...l, companyShortCode: generatedInvoice.products[i]?.companyShortCode || l.companyShortCode || l.company })), totalTaxable, totalCGST, totalSGST, netAmount, globalDiscountValue, finalDiscount, 'intrastate')} onNewInvoice={handleNewInvoice} onEditInvoice={() => { setEditingInvoiceId(generatedInvoice._id); setStep(2); }} onClose={closeModal} />}
//           </div>
//         </div>
//       </div>

//       <ExitDialog isOpen={showExitDialog} onComplete={() => { setShowExitDialog(false); setStep(3); }} onDiscard={handleDiscardChanges} onCancel={() => setShowExitDialog(false)} />
//       <ModReasonPrompt isOpen={showModReasonPrompt} modReason={modReason} setModReason={setModReason} onBack={() => setShowModReasonPrompt(false)} onContinue={() => { setShowModReasonPrompt(false); handleConfirm(); }} />
//       <ClientEditingPrompt isOpen={showEditPrompt} onOk={() => { setShowEditPrompt(false); setShowTimerOverlay(true); }} onGoToOrders={() => { onClose(); navigate('/admin-dashboard/orders'); }} />
//       <LiveTimerOverlay isOpen={showTimerOverlay} timer={editTimer} onBackToOrders={() => { onClose(); navigate('/admin-dashboard/orders'); }} />

//       <OrderCancelledPrompt
//         isOpen={showCancelPrompt}
//         reason={cancelReason}
//         onGoToOrders={() => {
//           setShowCancelPrompt(false);
//           sessionStorage.removeItem(STORAGE_KEY);
//           if (onOrderUpdated) onOrderUpdated({ ...prefillOrder, status: 'Cancelled', _id: prefillOrder._id }); 
//           onClose();
//         }}
//       />
//     </>
//   );
// };

// export default MakeInvoiceModal;