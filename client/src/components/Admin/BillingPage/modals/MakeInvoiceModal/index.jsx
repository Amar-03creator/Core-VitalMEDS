import { useState, useMemo, useEffect } from 'react';
import { X } from 'lucide-react';
import { ALL_CLIENTS, CLIENT_MASTER, PRODUCT_CATALOG } from '../../utils/constants';
import { calcLineTotal } from '../../utils/helpers';
import { useModalBackHandler } from '../../utils/hooks';
import { Step1 } from './Step1';
import { Step2 } from './Step2';
import { Step3 } from './Step3';
import { Step4 } from './Step4';
import { generateInvoicePDF } from './InvoicePDF';

const STORAGE_KEY = 'makeInvoiceState';

export const MakeInvoiceModal = ({ onClose }) => {
  const today = new Date().toISOString().split('T')[0];

  // --- load saved state ---
  const loadSavedState = () => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) { }
    return null;
  };

  const savedState = loadSavedState();

  // --- state with defaults from savedState ---
  const [step, setStep] = useState(savedState?.step ?? 1);
  const [clientSearch, setClientSearch] = useState(savedState?.clientSearch ?? '');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState(savedState?.selectedClient ?? null);
  const [billType, setBillType] = useState(savedState?.billType ?? 'Credit');
  const [invoiceDate] = useState(today);
  const [gstin, setGstin] = useState(savedState?.gstin ?? '');
  const [address, setAddress] = useState(savedState?.address ?? '');
  const [drugLicense, setDrugLicense] = useState(savedState?.drugLicense ?? '');
  const [items, setItems] = useState(savedState?.items ?? []);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDrop, setShowProductDrop] = useState(false);
  const [globalDiscountType, setGlobalDiscountType] = useState(savedState?.globalDiscountType ?? 'percent');
  const [globalDiscountValue, setGlobalDiscountValue] = useState(savedState?.globalDiscountValue ?? 0);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);

  // --- define closeModal first, before using it in hooks ---
  const closeModal = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    onClose();
  };

  // --- back button handler ---
  useModalBackHandler(true, closeModal);

  // --- persist state changes ---
  useEffect(() => {
    const stateToSave = {
      step,
      clientSearch,
      selectedClient,
      billType,
      gstin,
      address,
      drugLicense,
      items,
      globalDiscountType,
      globalDiscountValue,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [step, clientSearch, selectedClient, billType, gstin, address, drugLicense, items, globalDiscountType, globalDiscountValue]);

  // --- rest of logic (filteredClients, filteredProducts, handlers) ---
  // (keep exactly as in your original code, no changes needed)
  const filteredClients = useMemo(() => {
    if (!clientSearch) return [];
    return ALL_CLIENTS.filter(c =>
      c.toLowerCase().includes(clientSearch.toLowerCase()) ||
      CLIENT_MASTER[c]?.city.toLowerCase().includes(clientSearch.toLowerCase())
    );
  }, [clientSearch]);

  const filteredProducts = useMemo(() => {
    if (productSearch.length <= 1) return [];
    return PRODUCT_CATALOG.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.company.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [productSearch]);

  const handleSelectClient = (clientName) => {
    const client = CLIENT_MASTER[clientName];
    setSelectedClient(client);
    setClientSearch(client.name);
    setGstin(client.gstin);
    setAddress(client.address);
    setDrugLicense(client.drugLicense);
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
      packing: product.packing,
      hsn: product.hsn,
      gstRate: product.gstRate,
      availableBatches: product.batches,
      batchNumber: batch.no || '',
      expiryDate: batch.expiry || '',
      mrp: batch.mrp || product.defaultRate * 1.5,
      rate: product.defaultRate,
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
    let discountAmount = 0;
    if (globalDiscountType === 'percent') {
      discountAmount = (totalTaxable * globalDiscountValue) / 100;
    } else {
      discountAmount = globalDiscountValue;
    }
    const afterDiscount = totalTaxable - discountAmount;
    const totalGST = totalCGST + totalSGST;
    const netBeforeRound = afterDiscount + totalGST;
    const roundOffVal = Math.round(netBeforeRound) - netBeforeRound;
    return { netAmount: Math.round(netBeforeRound), roundOff: roundOffVal, finalDiscount: discountAmount };
  }, [totalTaxable, totalCGST, totalSGST, globalDiscountType, globalDiscountValue]);

  const [invoiceNumber, setInvoiceNumber] = useState(() => {
    const now = new Date();
    return `MIL-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  });

  const canProceed1 = selectedClient;
  const canProceed2 = items.length > 0;

  const handleConfirm = () => {
    const invoiceData = {
      id: invoiceNumber,
      client: selectedClient.name,
      area: selectedClient.city,
      line: selectedClient.line,
      items: items.length,
      amount: netAmount,
      due: billType === 'Credit' ? netAmount : 0,
      date: invoiceDate,
      dueDate: billType === 'Credit' ? new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] : invoiceDate,
      status: billType === 'Credit' ? 'UNPAID' : 'PAID',
      overdueDays: 0,
      billType,
      discount: globalDiscountValue,
      gstin,
      drugLicense,
      products: items.map(item => ({ ...item })),
    };
    setGeneratedInvoice(invoiceData);
    setStep(4);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const handleNewInvoice = () => {
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
    const now = new Date();
    setInvoiceNumber(`MIL-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const handleEditInvoice = () => {
    setStep(2);
  };

  const handleDownloadPDF = () => {
    if (!generatedInvoice) return;
    const html = generateInvoicePDF(
      generatedInvoice, items, totalTaxable, totalCGST, totalSGST,
      netAmount, globalDiscountValue, finalDiscount
    );
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.print();
  };

  // --- JSX remains the same (already uses closeModal correctly) ---
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
      <div className="w-full bg-white rounded-t-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
            <div><h3 className="font-bold text-slate-900 text-lg">Generate Invoice</h3><p className="text-slate-500 text-sm font-mono">{invoiceNumber}</p></div>
            <button onClick={closeModal} type="button" className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"><X size={22} className="text-slate-400" /></button>
          </div>
          {step < 4 && (
            <div className="flex bg-slate-50 border-b border-slate-100">
              {[{ num: 1, label: 'Party & Header' }, { num: 2, label: 'Add Items' }, { num: 3, label: 'Review & Confirm' }].map(s => (
                <button key={s.num} onClick={() => { if (s.num < step || (s.num === 2 && canProceed1) || (s.num === 3 && canProceed2)) setStep(s.num); }}
                  className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all ${step === s.num ? 'border-slate-900 text-slate-900 bg-white' : s.num < step ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400'}`}>
                  {s.num < step ? '✓ ' : `${s.num}. `}{s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-4 space-y-5">
          {step === 1 && (
            <Step1
              clientSearch={clientSearch} setClientSearch={setClientSearch}
              showClientDropdown={showClientDropdown} setShowClientDropdown={setShowClientDropdown}
              selectedClient={selectedClient} setSelectedClient={setSelectedClient}
              filteredClients={filteredClients} handleSelectClient={handleSelectClient}
              billType={billType} setBillType={setBillType}
              invoiceDate={invoiceDate} gstin={gstin} address={address} drugLicense={drugLicense}
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
              onNewInvoice={handleNewInvoice}
              onEditInvoice={handleEditInvoice}
              closeModal={closeModal}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MakeInvoiceModal;