// src/features/Admin/BillingPage/modals/MakeInvoiceModal/index.jsx
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { calcLineTotal } from '../../features/Admin/BillingPage/utils/helpers';
import { useModalTrap, useScrollLock } from '../../hooks/useBackHandler';
import { Step1 } from './Step1';
import { Step2 } from './Step2';
import { Step3 } from './Step3';
import { Step4 } from './Step4';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { downloadInvoicePDF, printInvoicePDF } from '../../features/Admin/BillingPage/pdf/invoice/generateInvoicePdf';

export const MakeInvoiceModal = ({
  onClose,
  prefillClient = null,
  lockClient = false,
  disableBackTrap = false,
}) => {
  const today = new Date().toISOString().split('T')[0];

  // Namespaced per-client so a draft started against one customer (or on
  // the standalone Billing page) never bleeds into another context — this
  // is what stops the modal from reopening pre-filled in the wrong place.
  const STORAGE_KEY = prefillClient
    ? `makeInvoiceState_client_${prefillClient._id}`
    : 'makeInvoiceState_standalone';

  const loadSavedState = () => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { return null; }
  };
  const savedState = loadSavedState();

  const [step, setStep] = useState(savedState?.step ?? 1);
  const [clientSearch, setClientSearch] = useState(
    prefillClient?.establishmentName || savedState?.clientSearch || ''
  );
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState(
    prefillClient || savedState?.selectedClient || null
  );
  const [billType, setBillType] = useState(savedState?.billType ?? 'Credit');
  const [invoiceDate] = useState(today);
  const [gstin, setGstin] = useState(
    prefillClient?.gstin || savedState?.gstin || ''
  );
  const [address, setAddress] = useState(
    prefillClient?.billingAddress || savedState?.address || ''
  );
  const [drugLicense, setDrugLicense] = useState(
    prefillClient
      ? [prefillClient.drugLicense20B, prefillClient.drugLicense21B].filter(Boolean).join(', ')
      : (savedState?.drugLicense || '')
  );
  const [items, setItems] = useState(savedState?.items ?? []);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDrop, setShowProductDrop] = useState(false);
  const [globalDiscountType, setGlobalDiscountType] = useState(savedState?.globalDiscountType ?? 'percent');
  const [globalDiscountValue, setGlobalDiscountValue] = useState(savedState?.globalDiscountValue ?? 0);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);

  const [editingInvoiceId, setEditingInvoiceId] = useState(savedState?.editingInvoiceId ?? null);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const [allProducts, setAllProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const editingInvoiceIdRef = useRef(editingInvoiceId);
  useEffect(() => { editingInvoiceIdRef.current = editingInvoiceId; }, [editingInvoiceId]);

  // Defensive cleanup: if this component ever unmounts WITHOUT going
  // through closeModal (e.g. a parent forcibly removes it), still clear
  // the draft — unless an edit is genuinely in progress, in which case we
  // want it resumable.
  // useEffect(() => () => {
  //   if (!editingInvoiceIdRef.current) sessionStorage.removeItem(STORAGE_KEY);
  // }, []);

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const [productsRes, clientsRes] = await Promise.all([
        api.getProductsWithBatches(),
        api.getClients()
      ]);
      setAllProducts(productsRes.data || []);
      setClients(clientsRes.data || []);
    } catch (err) {
      toast.error('Failed to load fresh data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  const closeModal = useCallback(() => {
    if (editingInvoiceId) {
      setShowExitDialog(true);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      onClose();
    }
  }, [editingInvoiceId, onClose]);

  // Trap back button and escape key to close modal
  // Trap back button and escape key to close modal
  useModalTrap(true, {
    disabled: disableBackTrap,
    onBackClose: onClose,
    customId: STORAGE_KEY // <--- This guarantees the back button survives F5 reloads!
  });
  useScrollLock(true);

  const handleCompleteEditing = () => {
    setShowExitDialog(false);
    setStep(3);
  };

  const handleDiscardChanges = async () => {
    try {
      if (editingInvoiceId) {
        await api.deleteSalesInvoice(editingInvoiceId);
        toast.success('Invoice discarded and stock restored');
      }
    } catch (err) {
      toast.error('Failed to discard invoice', err);
    } finally {
      setShowExitDialog(false);
      setEditingInvoiceId(null);
      sessionStorage.removeItem(STORAGE_KEY);
      onClose();
    }
  };

  useEffect(() => {
    const stateToSave = {
      step, clientSearch, selectedClient, billType, gstin, address, drugLicense, items, globalDiscountType, globalDiscountValue, editingInvoiceId,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [step, clientSearch, selectedClient, billType, gstin, address, drugLicense, items, globalDiscountType, globalDiscountValue, editingInvoiceId]);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return [];
    const s = clientSearch.toLowerCase();
    return clients.filter(c =>
      c.establishmentName.toLowerCase().includes(s) ||
      (c.city && c.city.toLowerCase().includes(s))
    );
  }, [clientSearch, clients]);

  const filteredProducts = useMemo(() => {
    if (productSearch.length <= 1) return [];
    return allProducts.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.company.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [productSearch, allProducts]);

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setClientSearch(client.establishmentName);
    setGstin(client.gstin || '');
    setAddress(client.billingAddress || '');
    setDrugLicense([client.drugLicense20B, client.drugLicense21B].filter(Boolean).join(', '));
    setShowClientDropdown(false);
  };

  const addProduct = (product) => {
    setProductSearch('');
    setShowProductDrop(false);
    if (items.find(i => i.productId === product.id)) return;

    const batch = product.batches[0] || {};
    setItems(prev => [...prev, {
      productId: product.id,
      productName: product.name,
      company: product.company,
      companyShortCode: product.companyShortCode || product.company,
      packing: product.packing,
      hsn: product.hsn,
      gstRate: product.gstRate,
      availableBatches: product.batches,
      batchId: batch._id || '',
      batchNumber: batch.no || '',
      expiryDate: batch.expiry || '',
      mrp: batch.mrp || 0,
      rate: product.defaultRate ?? (batch.mrp ? parseFloat((batch.mrp * 0.8).toFixed(2)) : 0),
      chargeableQty: 10,
      freeQty: 0,
      discountType: 'percent',
      discountValue: 0,
    }]);
  };

  const updateItem = (idx, key, val) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [key]: val } : item));
  };

  const handleBatchChange = (idx, batchNo) => {
    const item = items[idx];
    const batch = item.availableBatches.find(b => b.no === batchNo);
    if (batch) {
      updateItem(idx, 'batchNumber', batch.no);
      updateItem(idx, 'expiryDate', batch.expiry);
      updateItem(idx, 'mrp', batch.mrp);
      updateItem(idx, 'batchId', batch._id);
    }
  };

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const { totalTaxable, totalCGST, totalSGST } = useMemo(() => {
    let taxableSum = 0, cgstSum = 0, sgstSum = 0;
    items.forEach(item => {
      const { taxable, cgst, sgst } = calcLineTotal(item);
      taxableSum += taxable;
      cgstSum += cgst;
      sgstSum += sgst;
    });
    return { totalTaxable: taxableSum, totalCGST: cgstSum, totalSGST: sgstSum };
  }, [items]);

  const { netAmount, roundOff, finalDiscount } = useMemo(() => {
    const subtotal = totalTaxable + totalCGST + totalSGST;
    let discountAmount = 0;
    if (globalDiscountType === 'percent') {
      discountAmount = (subtotal * globalDiscountValue) / 100;
    } else {
      discountAmount = globalDiscountValue;
    }
    const afterDiscount = subtotal - discountAmount;
    const roundOffVal = Math.round(afterDiscount) - afterDiscount;
    return { netAmount: Math.round(afterDiscount), roundOff: roundOffVal, finalDiscount: discountAmount };
  }, [totalTaxable, totalCGST, totalSGST, globalDiscountType, globalDiscountValue]);

  const [invoiceNumber, setInvoiceNumber] = useState(() => {
    const now = new Date();
    return `MIL-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  });

  const canProceed1 = selectedClient;
  const canProceed2 = items.length > 0;

  const handleConfirm = async () => {
    if (!selectedClient) return toast.error('Please select a client');
    try {
      const payload = {
        clientObjectId: selectedClient._id,
        billType,
        items: items.map(item => ({
          productId: item.productId,
          batchId: item.batchId,
          billedQty: item.chargeableQty + item.freeQty,
          chargeableQty: item.chargeableQty,
          freeQty: item.freeQty,
          rate: item.rate,
          discountType: item.discountType,
          discountValue: item.discountValue,
          discountPercent: item.discountType === 'percent' ? item.discountValue : 0,
          discountAmount: item.discountType === 'amount' ? item.discountValue : 0,
        })),
        globalDiscountType,
        globalDiscountValue,
      };

      let saved;
      if (editingInvoiceId) {
        const res = await api.updateSalesInvoice(editingInvoiceId, payload);
        saved = res.data;
        toast.success('Invoice updated');
      } else {
        const res = await api.createSalesInvoice(payload);
        saved = res.data;
        toast.success('Invoice created');
      }

      const invoiceData = {
        _id: saved._id,
        id: saved.invoiceNumber,
        client: saved.clientName,
        area: saved.clientBillingAddress || '',
        line: '',
        items: saved.items.length,
        amount: saved.netAmount,
        due: saved.dueAmount,
        date: saved.invoiceDate.split('T')[0],
        dueDate: saved.dueDate ? saved.dueDate.split('T')[0] : '',
        status: saved.paymentStatus,
        billType: saved.billType,
        discount: saved.globalDiscountAmount || 0,
        gstin: saved.clientGSTIN || '',
        drugLicense: saved.clientDrugLicense || '',
        products: saved.items,
        previousBalance: saved.previousOutstanding ?? selectedClient.totalOutstanding ?? 0,
        previousBalanceDate: saved.previousOutstandingDate ?? selectedClient.outstandingDate ?? null,
      };

      setGeneratedInvoice(invoiceData);
      setEditingInvoiceId(null);
      setStep(4);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleNewInvoice = async () => {
    setStep(1);
    setClientSearch('');
    setSelectedClient(null);
    setBillType('Credit');
    setGstin('');
    setAddress('');
    setDrugLicense('');
    setItems([]);
    setGlobalDiscountValue(0);
    setGeneratedInvoice(null);
    setEditingInvoiceId(null);
    const now = new Date();
    setInvoiceNumber(`MIL-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
    sessionStorage.removeItem(STORAGE_KEY);

    await fetchMasterData();
  };

  const handleEditInvoice = () => {
    if (generatedInvoice?._id) {
      setEditingInvoiceId(generatedInvoice._id);
      setStep(2);
    }
  };

  const getMergedItemsForPDF = () => {
    return items.map((localItem, index) => {
      const backendItem = generatedInvoice.products[index];
      return {
        ...localItem,
        companyShortCode: backendItem?.companyShortCode || localItem.companyShortCode || localItem.company
      };
    });
  };

  const handleDownloadPDF = () => {
    if (!generatedInvoice) return;
    downloadInvoicePDF(
      generatedInvoice,
      getMergedItemsForPDF(),
      totalTaxable,
      totalCGST,
      totalSGST,
      netAmount,
      globalDiscountValue,
      finalDiscount,
      'intrastate'
    );
  };

  const handlePrintPDF = () => {
    if (!generatedInvoice) return;
    printInvoicePDF(
      generatedInvoice,
      getMergedItemsForPDF(),
      totalTaxable, totalCGST, totalSGST,
      netAmount, globalDiscountValue, finalDiscount, 'intrastate'
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/60 flex items-end">
        <div className="w-full bg-white rounded-t-2xl flex flex-col overflow-hidden" style={{ height: '80dvh' }}>
          <div className="flex-1 flex items-center justify-center text-slate-500">Loading data…</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* z-[100]: must sit above TopNav (z-[70]) so the background is
          truly inert while the modal is open — previously the nav buttons
          stayed clickable above the modal's own backdrop. */}
      <div className="fixed inset-0 z-[100] bg-black/60 flex items-end">
        <div className="w-full bg-white rounded-t-2xl flex flex-col overflow-hidden" style={{ height: '80dvh' }}>
          <div className="sticky top-0 bg-white z-10 shrink-0">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {editingInvoiceId ? 'Edit Invoice' : 'Generate Invoice'}
                </h3>
                <p className="text-slate-500 text-sm font-mono">{invoiceNumber}</p>
              </div>
              <button onClick={closeModal} type="button" className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
                <X size={22} className="text-slate-400" />
              </button>
            </div>
            {step < 4 && (
              <div className="flex bg-slate-50 border-b border-slate-100">
                {[1, 2, 3].map(num => (
                  <button key={num} onClick={() => {
                    if (num < step || (num === 2 && canProceed1) || (num === 3 && canProceed2)) setStep(num);
                  }} className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all ${step === num ? 'border-slate-900 text-slate-900 bg-white' : num < step ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400'}`}>
                    {num < step ? '✓ ' : `${num}. `}{num === 1 ? 'Party & Header' : num === 2 ? 'Add Items' : 'Review & Confirm'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 animate-fadeIn">
            {step === 1 && (
              <Step1
                clientSearch={clientSearch} setClientSearch={setClientSearch}
                showClientDropdown={showClientDropdown} setShowClientDropdown={setShowClientDropdown}
                selectedClient={selectedClient} setSelectedClient={setSelectedClient}
                filteredClients={filteredClients} handleSelectClient={handleSelectClient}
                billType={billType} setBillType={setBillType}
                invoiceDate={invoiceDate} gstin={gstin} address={address} drugLicense={drugLicense}
                lockClient={lockClient}
                canProceed1={canProceed1} onNext={() => setStep(2)}
              />
            )}
            {step === 2 && (
              <Step2
                productSearch={productSearch} setProductSearch={setProductSearch}
                showProductDrop={showProductDrop} setShowProductDrop={setShowProductDrop}
                filteredProducts={filteredProducts} addProduct={addProduct}
                items={items} removeItem={removeItem} updateItem={updateItem} handleBatchChange={handleBatchChange}
                globalDiscountType={globalDiscountType} setGlobalDiscountType={setGlobalDiscountType}
                globalDiscountValue={globalDiscountValue} setGlobalDiscountValue={setGlobalDiscountValue}
                finalDiscount={finalDiscount}
                canProceed2={canProceed2} onBack={() => setStep(1)} onNext={() => setStep(3)}
              />
            )}
            {step === 3 && (
              <Step3
                invoiceNumber={invoiceNumber} selectedClient={selectedClient}
                billType={billType} invoiceDate={invoiceDate} gstin={gstin} drugLicense={drugLicense}
                items={items}
                totalTaxable={totalTaxable} globalDiscountValue={globalDiscountValue}
                globalDiscountType={globalDiscountType} finalDiscount={finalDiscount}
                totalCGST={totalCGST} totalSGST={totalSGST} roundOff={roundOff} netAmount={netAmount}
                onBack={() => setStep(2)} onConfirm={handleConfirm}
              />
            )}
            {step === 4 && generatedInvoice && (
              <Step4
                generatedInvoice={generatedInvoice}
                onDownloadPDF={handleDownloadPDF}
                onPrintPDF={handlePrintPDF}
                onNewInvoice={handleNewInvoice}
                onEditInvoice={handleEditInvoice}
                onClose={closeModal}
              />
            )}
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.25s ease-out;
          }
        `}
      </style>

      {showExitDialog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 mx-5 max-w-sm w-full shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle size={24} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">Edit in progress</h3>
                <p className="text-slate-600 text-sm">
                  You have unsaved changes. You must either complete the edit or discard the invoice entirely.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleCompleteEditing}
                className="w-full bg-slate-900 text-white font-semibold py-2.5 rounded-xl text-base hover:bg-slate-800"
              >
                Complete Editing
              </button>
              <button
                onClick={handleDiscardChanges}
                className="w-full bg-red-50 text-red-700 font-semibold py-2.5 rounded-xl text-base hover:bg-red-100 border border-red-200"
              >
                Discard Changes
              </button>
              <button
                onClick={() => setShowExitDialog(false)}
                className="w-full bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-xl text-base hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MakeInvoiceModal;