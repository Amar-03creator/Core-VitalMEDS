import { useState, useEffect, useMemo } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/api';
import { ClientInfoStep } from './ClientInfoStep';
import { ProductsStep } from './ProductsStep';
import { AddCompanyModal } from '../../modals/AddCompanyModal';
import { AddProductModal } from '../../modals/AddProductModal';
import { useModalTrap, useScrollLock } from '../../hooks/useBackHandler';
import { BillSummary } from './components/BillSummary';
import { PaymentSection } from './components/PaymentSection'; // ✨ NEW IMPORT

const STORAGE_KEY = 'purchaseEntryData';

export const PurchaseEntryModal = ({
  onClose,
  onSave,
  companies = [],
  onCompanyAdded,
  onProductAdded,
  lockedSupplierId,
  disableBackTrap = false,
}) => {
  useScrollLock(true);
  useModalTrap(true, { disabled: disableBackTrap, onBackClose: onClose });

  const loadSavedState = () => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { }
    return null;
  };
  let savedState = loadSavedState();

  if (lockedSupplierId && savedState?.supplierId && savedState.supplierId !== lockedSupplierId) {
    sessionStorage.removeItem(STORAGE_KEY);
    savedState = null;
  }

  const [step, setStep] = useState(savedState?.step ?? 1);
  const [supplierId, setSupplierId] = useState(savedState?.supplierId ?? '');
  const [supplierSearch, setSupplierSearch] = useState(savedState?.supplierSearch ?? '');
  const [invoiceNo, setInvoiceNo] = useState(savedState?.invoiceNo ?? '');
  const [billDate, setBillDate] = useState(savedState?.billDate ?? '');
  const [receivedDate, setReceivedDate] = useState(savedState?.receivedDate ?? new Date().toISOString().split('T')[0]);
  const [address, setAddress] = useState(savedState?.address ?? '');
  const [billType, setBillType] = useState(savedState?.billType ?? 'Credit');
  const [purchaseType, setPurchaseType] = useState(savedState?.purchaseType ?? 'interstate');
  const [items, setItems] = useState(savedState?.items ?? []);

  const [billDiscountType, setBillDiscountType] = useState(savedState?.billDiscountType ?? 'percent');
  const [billDiscountValue, setBillDiscountValue] = useState(savedState?.billDiscountValue ?? '');

  // ✨ NEW: Payment States
  const [applyAdvance, setApplyAdvance] = useState(savedState?.applyAdvance ?? true);
  const [paymentAmount, setPaymentAmount] = useState(savedState?.paymentAmount ?? '');
  const [paymentMode, setPaymentMode] = useState(savedState?.paymentMode ?? 'UPI');
  const [referenceNumber, setReferenceNumber] = useState(savedState?.referenceNumber ?? '');
  const [paymentDate, setPaymentDate] = useState(savedState?.paymentDate ?? new Date().toISOString().split('T')[0]);

  const [supplierProducts, setSupplierProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [showAddCompany, setShowAddCompany] = useState(savedState?.showAddCompany ?? false);
  const [showAddProduct, setShowAddProduct] = useState(savedState?.showAddProduct ?? false);

  const currentSupplier = companies.find(c => (c._id || c.id) === supplierId);

  // ✨ NEW: Calculate Net Payable dynamically for the PaymentSection
  const netPayable = useMemo(() => {
      let gross = 0;
      items.forEach(item => {
          const qty = item.chargeableQty || 0;
          const rate = item.purchaseRate || 0;
          const grossLine = rate * qty;
          
          let disc = 0;
          if (item.discountValue && parseFloat(item.discountValue) > 0) {
              disc = item.discountType === 'percent' 
                  ? (grossLine * parseFloat(item.discountValue)) / 100 
                  : parseFloat(item.discountValue);
          }
          const taxable = grossLine - disc;
          
          let gstAmt = 0;
          if (purchaseType === 'intrastate') {
              gstAmt = (taxable * (parseFloat(item.cgstRate) || 0) / 100) + (taxable * (parseFloat(item.sgstRate) || 0) / 100);
          } else {
              gstAmt = taxable * (parseFloat(item.igstRate) || 0) / 100;
          }
          gross += (taxable + gstAmt);
      });

      let billDiscAmt = 0;
      if (billDiscountValue && parseFloat(billDiscountValue) > 0) {
          billDiscAmt = billDiscountType === 'percent' 
              ? (gross * parseFloat(billDiscountValue)) / 100 
              : parseFloat(billDiscountValue);
      }
      return Math.round(gross - billDiscAmt);
  }, [items, purchaseType, billDiscountValue, billDiscountType]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      step, supplierId, supplierSearch, invoiceNo,
      billDate, receivedDate, address, billType, purchaseType,
      items, billDiscountType, billDiscountValue,
      applyAdvance, paymentAmount, paymentMode, referenceNumber, paymentDate, // ✨ Added payment state
      showAddCompany, showAddProduct,
    }));
  }, [step, supplierId, supplierSearch, invoiceNo, billDate, receivedDate, address, billType, purchaseType, items, billDiscountType, billDiscountValue, applyAdvance, paymentAmount, paymentMode, referenceNumber, paymentDate, showAddCompany, showAddProduct]);

  useEffect(() => {
    if (!supplierId) { setSupplierProducts([]); return; }
    let cancelled = false;
    const load = async () => {
      setProductsLoading(true);
      try {
        let res;
        if (currentSupplier?.companyName) {
          try {
            res = await api.getInventory({ company: currentSupplier.companyName });
          } catch (err) {
            res = await api.getProductsByCompany(supplierId); 
          }
        } else {
          res = await api.getProductsByCompany(supplierId);
        }
        if (!cancelled) setSupplierProducts(res.data || []);
      } catch {
        if (!cancelled) toast.error('Failed to load products for this supplier');
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [supplierId, companies, currentSupplier]);

  const handleSave = async () => {
    if (!supplierId || !invoiceNo || items.length === 0) {
      toast.error('Please fill all required fields and add at least one item');
      return;
    }

    const formattedItems = items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate,
      billedQty: item.chargeableQty,
      freeQty: item.freeQty || 0,
      mrp: item.mrp,
      purchaseRate: item.purchaseRate,
      ptr: item.ptr,
      discountType: item.discountType,
      discountValue: parseFloat(item.discountValue) || 0,
      cgstRate: parseFloat(item.cgstRate) || 0,
      sgstRate: parseFloat(item.sgstRate) || 0,
      igstRate: parseFloat(item.igstRate) || 0,
    }));

    try {
      await api.createPurchaseBill({
        supplierName: supplierSearch,
        supplierId,
        invoiceNumber: invoiceNo,
        billType,
        invoiceDate: billDate,
        receivedDate,
        purchaseType,
        items: formattedItems,
        billDiscountType,
        billDiscountValue: parseFloat(billDiscountValue) || 0,
        
        // ✨ NEW: Sending POS Payment Data to Backend
        applyAdvance,
        paymentAmount: parseFloat(paymentAmount) || 0,
        paymentMode,
        referenceNumber,
        paymentDate
      });
      
      toast.success('Purchase entry saved successfully!');
      sessionStorage.removeItem(STORAGE_KEY);
      
      if (onSave) onSave();
      else onClose();
    } catch (error) {
      toast.error(error.message || 'An error occurred while saving.');
    }
  };

  const handleCompanyAddedNested = () => {
    if (onCompanyAdded) onCompanyAdded();
    setShowAddCompany(false);
  };

  const handleProductAddedNested = async () => {
    if (supplierId) {
      try {
        const res = await api.getProductsByCompany(supplierId);
        setSupplierProducts(res.data || []);
      } catch { }
    }
    if (onProductAdded) onProductAdded();
    setShowAddProduct(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60 flex items-end md:items-center justify-center md:p-4">
        <div className="w-full md:max-w-5xl bg-white rounded-t-3xl md:rounded-2xl flex flex-col shadow-2xl relative overflow-hidden max-h-[88vh] md:max-h-[82vh]">
          
          <div className="shrink-0 bg-white z-30 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-xl">Purchase Entry</h3>
              <p className="text-sm text-slate-500">
                {step === 1 ? 'Client & Invoice Info' : 'Products & Items'}
              </p>
            </div>
            <button onClick={() => { sessionStorage.removeItem(STORAGE_KEY); onClose(); }} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4">
            {step === 1 ? (
              <ClientInfoStep
                companies={companies}
                supplierId={supplierId}
                setSupplierId={setSupplierId}
                supplierSearch={supplierSearch}
                setSupplierSearch={setSupplierSearch}
                invoiceNo={invoiceNo}
                setInvoiceNo={setInvoiceNo}
                billDate={billDate}
                setBillDate={setBillDate}
                receivedDate={receivedDate}
                setReceivedDate={setReceivedDate}
                address={address}
                setAddress={setAddress}
                billType={billType}
                setBillType={setBillType}
                purchaseType={purchaseType}
                setPurchaseType={setPurchaseType}
                onNext={() => setStep(2)}
                showAddCompany={showAddCompany}
                setShowAddCompany={setShowAddCompany}
                lockedSupplierId={lockedSupplierId}
              />
            ) : (
              <>
                <ProductsStep
                  products={supplierProducts}
                  productsLoading={productsLoading}
                  supplierId={supplierId}
                  items={items}
                  setItems={setItems}
                  purchaseType={purchaseType}
                  billDate={billDate}
                  showAddProduct={showAddProduct}
                  setShowAddProduct={setShowAddProduct}
                />

                {items.length > 0 && (
                  <div className="mt-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-slate-800 text-base">Bill Discount</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={billDiscountValue}
                        onChange={e => setBillDiscountValue(e.target.value)}
                        placeholder="0"
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400 text-center"
                      />
                      <button
                        type="button"
                        onClick={() => setBillDiscountType(prev => prev === 'percent' ? 'amount' : 'percent')}
                        className="shrink-0 px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold w-20 hover:bg-slate-100 transition-colors"
                      >
                        {billDiscountType === 'percent' ? '%' : '₹'}
                      </button>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                      {billDiscountType === 'percent' ? 'Applied on total after GST' : 'Flat amount deducted from total after GST'}
                    </p>
                  </div>
                )}

                {items.length > 0 && (
                  <div className="mt-5 pb-5">
                    <BillSummary
                      items={items}
                      purchaseType={purchaseType}
                      billDiscountType={billDiscountType}
                      billDiscountValue={parseFloat(billDiscountValue) || 0}
                    />

                    {/* ✨ NEW: Render the POS Payment UI right below the summary */}
                    <PaymentSection
                      netPayable={netPayable}
                      availableAdvance={currentSupplier?.advancePaid || 0}
                      applyAdvance={applyAdvance}
                      setApplyAdvance={setApplyAdvance}
                      paymentAmount={paymentAmount}
                      setPaymentAmount={setPaymentAmount}
                      paymentMode={paymentMode}
                      setPaymentMode={setPaymentMode}
                      referenceNumber={referenceNumber}
                      setReferenceNumber={setReferenceNumber}
                      paymentDate={paymentDate}
                      setPaymentDate={setPaymentDate}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {step === 2 && (
            <div className="shrink-0 bg-white border-t border-slate-100 px-5 py-4 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 bg-slate-100 text-slate-700 font-semibold py-3.5 rounded-xl text-base hover:bg-slate-200 transition-colors">
                  <ArrowLeft size={24} className="inline-block mr-2" /> Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={!supplierId || !invoiceNo || items.length === 0}
                  className="flex-[2] bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-lg disabled:opacity-50 hover:bg-emerald-600 transition-colors"
                >
                  Save Entry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddCompany && <AddCompanyModal onClose={() => setShowAddCompany(false)} onSave={handleCompanyAddedNested} />}
      {showAddProduct && <AddProductModal onClose={() => setShowAddProduct(false)} onSave={handleProductAddedNested} companies={companies} defaultCompanyId={supplierId} defaultCompanyName={currentSupplier?.companyName ?? supplierSearch} />}
    </>
  );
};




// import { useState, useEffect } from 'react';
// import { X, ArrowLeft } from 'lucide-react';
// import { toast } from 'sonner';
// import { api } from '../../services/api';
// import { ClientInfoStep } from './ClientInfoStep';
// import { ProductsStep } from './ProductsStep';
// import { AddCompanyModal } from '../../modals/AddCompanyModal';
// import { AddProductModal } from '../../modals/AddProductModal';
// import { useModalTrap, useScrollLock } from '../../hooks/useBackHandler';
// import { BillSummary } from './components/BillSummary';

// const STORAGE_KEY = 'purchaseEntryData';

// export const PurchaseEntryModal = ({
//   onClose,
//   onSave,
//   companies = [],
//   onCompanyAdded,
//   onProductAdded,
//   lockedSupplierId,
//   disableBackTrap = false,
// }) => {
//   useScrollLock(true);
//   useModalTrap(true, { disabled: disableBackTrap, onBackClose: onClose });

//   const loadSavedState = () => {
//     try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { }
//     return null;
//   };
//   let savedState = loadSavedState();

//   if (lockedSupplierId && savedState?.supplierId && savedState.supplierId !== lockedSupplierId) {
//     sessionStorage.removeItem(STORAGE_KEY);
//     savedState = null;
//   }

//   const [step, setStep] = useState(savedState?.step ?? 1);
//   const [supplierId, setSupplierId] = useState(savedState?.supplierId ?? '');
//   const [supplierSearch, setSupplierSearch] = useState(savedState?.supplierSearch ?? '');
//   const [invoiceNo, setInvoiceNo] = useState(savedState?.invoiceNo ?? '');
//   const [billDate, setBillDate] = useState(savedState?.billDate ?? '');
//   const [receivedDate, setReceivedDate] = useState(savedState?.receivedDate ?? new Date().toISOString().split('T')[0]);
//   const [address, setAddress] = useState(savedState?.address ?? '');
//   const [billType, setBillType] = useState(savedState?.billType ?? 'Credit');
//   const [purchaseType, setPurchaseType] = useState(savedState?.purchaseType ?? 'interstate');
//   const [items, setItems] = useState(savedState?.items ?? []);

//   const [billDiscountType, setBillDiscountType] = useState(savedState?.billDiscountType ?? 'percent');
//   const [billDiscountValue, setBillDiscountValue] = useState(savedState?.billDiscountValue ?? '');

//   const [supplierProducts, setSupplierProducts] = useState([]);
//   const [productsLoading, setProductsLoading] = useState(false);

//   const [showAddCompany, setShowAddCompany] = useState(savedState?.showAddCompany ?? false);
//   const [showAddProduct, setShowAddProduct] = useState(savedState?.showAddProduct ?? false);

//   useEffect(() => {
//     sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
//       step, supplierId, supplierSearch, invoiceNo,
//       billDate, receivedDate, address, billType, purchaseType,
//       items,
//       billDiscountType, billDiscountValue,
//       showAddCompany,
//       showAddProduct,
//     }));
//   }, [step, supplierId, supplierSearch, invoiceNo, billDate, receivedDate, address, billType, purchaseType, items, billDiscountType, billDiscountValue, showAddCompany, showAddProduct]);

//   useEffect(() => {
//     if (!supplierId) { setSupplierProducts([]); return; }
//     let cancelled = false;
//     const load = async () => {
//       setProductsLoading(true);
//       try {
//         const currentSupplier = companies.find(c => (c._id || c.id) === supplierId);
//         let res;
//         if (currentSupplier?.companyName) {
//           try {
//             res = await api.getInventory({ company: currentSupplier.companyName });
//           } catch (err) {
//             res = await api.getProductsByCompany(supplierId); 
//           }
//         } else {
//           res = await api.getProductsByCompany(supplierId);
//         }

//         if (!cancelled) setSupplierProducts(res.data || []);
//       } catch {
//         if (!cancelled) toast.error('Failed to load products for this supplier');
//       } finally {
//         if (!cancelled) setProductsLoading(false);
//       }
//     };
//     load();
//     return () => { cancelled = true; };
//   }, [supplierId, companies]);

//   const handleSave = async () => {
//     if (!supplierId || !invoiceNo || items.length === 0) {
//       toast.error('Please fill all required fields and add at least one item');
//       return;
//     }

//     const formattedItems = items.map(item => ({
//       productId: item.productId,
//       productName: item.productName,
//       batchNumber: item.batchNumber,
//       expiryDate: item.expiryDate,
//       billedQty: item.chargeableQty,
//       freeQty: item.freeQty || 0,
//       mrp: item.mrp,
//       purchaseRate: item.purchaseRate,
//       ptr: item.ptr,
//       discountType: item.discountType,
//       discountValue: parseFloat(item.discountValue) || 0,
//       cgstRate: parseFloat(item.cgstRate) || 0,
//       sgstRate: parseFloat(item.sgstRate) || 0,
//       igstRate: parseFloat(item.igstRate) || 0,
//     }));

//     try {
//       // ✨ FIX: Notice paymentStatus is explicitly set to UNPAID, even for Cash bills, to prevent the abandoned modal loophole.
//       const res = await api.createPurchaseBill({
//         supplierName: supplierSearch,
//         supplierId,
//         invoiceNumber: invoiceNo,
//         billType,
//         invoiceDate: billDate,
//         receivedDate,
//         purchaseType,
//         items: formattedItems,
//         billDiscountType,
//         billDiscountValue: parseFloat(billDiscountValue) || 0,
//         paymentStatus: 'UNPAID',
//       });
      
//       toast.success('Purchase entry saved successfully!');
//       sessionStorage.removeItem(STORAGE_KEY);
      
//       // ✨ NEW: Bridge to Phase 3
//       if (onSave) {
//         if (billType === 'Cash') {
//           // Pass the flag and the total amount to auto-open the Payment Modal
//           onSave({ triggerPayment: true, supplierId, invoiceNumber: invoiceNo, netAmount: res.data?.netAmount || 0 });
//         } else {
//           onSave();
//         }
//       } else {
//         onClose();
//       }
//     } catch (error) {
//       toast.error(error.message);
//     }
//   };

//   const handleCompanyAddedNested = () => {
//     if (onCompanyAdded) onCompanyAdded();
//     setShowAddCompany(false);
//   };

//   const handleProductAddedNested = async () => {
//     if (supplierId) {
//       try {
//         const res = await api.getProductsByCompany(supplierId);
//         setSupplierProducts(res.data || []);
//       } catch { }
//     }
//     if (onProductAdded) onProductAdded();
//     setShowAddProduct(false);
//   };

//   const currentSupplier = companies.find(c => (c._id || c.id) === supplierId);

//   return (
//     <>
//       <div className="fixed inset-0 z-[100] bg-black/60 flex items-end md:items-center justify-center md:p-4">
//         <div className="w-full md:max-w-5xl bg-white rounded-t-3xl md:rounded-2xl flex flex-col shadow-2xl relative overflow-hidden max-h-[88vh] md:max-h-[82vh]">
          
//           <div className="shrink-0 bg-white z-30 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
//             <div>
//               <h3 className="font-bold text-slate-900 text-xl">Purchase Entry</h3>
//               <p className="text-sm text-slate-500">
//                 {step === 1 ? 'Client & Invoice Info' : 'Products & Items'}
//               </p>
//             </div>
//             <button onClick={() => { sessionStorage.removeItem(STORAGE_KEY); onClose(); }} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
//               <X size={20} className="text-slate-500" />
//             </button>
//           </div>

//           <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4">
//             {step === 1 ? (
//               <ClientInfoStep
//                 companies={companies}
//                 supplierId={supplierId}
//                 setSupplierId={setSupplierId}
//                 supplierSearch={supplierSearch}
//                 setSupplierSearch={setSupplierSearch}
//                 invoiceNo={invoiceNo}
//                 setInvoiceNo={setInvoiceNo}
//                 billDate={billDate}
//                 setBillDate={setBillDate}
//                 receivedDate={receivedDate}
//                 setReceivedDate={setReceivedDate}
//                 address={address}
//                 setAddress={setAddress}
//                 billType={billType}
//                 setBillType={setBillType}
//                 purchaseType={purchaseType}
//                 setPurchaseType={setPurchaseType}
//                 onNext={() => setStep(2)}
//                 showAddCompany={showAddCompany}
//                 setShowAddCompany={setShowAddCompany}
//                 lockedSupplierId={lockedSupplierId}
//               />
//             ) : (
//               <>
//                 <ProductsStep
//                   products={supplierProducts}
//                   productsLoading={productsLoading}
//                   supplierId={supplierId}
//                   items={items}
//                   setItems={setItems}
//                   purchaseType={purchaseType}
//                   billDate={billDate}
//                   showAddProduct={showAddProduct}
//                   setShowAddProduct={setShowAddProduct}
//                 />

//                 {items.length > 0 && (
//                   <div className="mt-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
//                     <div className="flex items-center justify-between mb-2">
//                       <p className="font-bold text-slate-800 text-base">Bill Discount</p>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <input
//                         type="text"
//                         inputMode="decimal"
//                         value={billDiscountValue}
//                         onChange={e => setBillDiscountValue(e.target.value)}
//                         placeholder="0"
//                         className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400 text-center"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setBillDiscountType(prev => prev === 'percent' ? 'amount' : 'percent')}
//                         className="shrink-0 px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold w-20 hover:bg-slate-100 transition-colors"
//                       >
//                         {billDiscountType === 'percent' ? '%' : '₹'}
//                       </button>
//                     </div>
//                     <p className="text-sm text-slate-400 mt-1">
//                       {billDiscountType === 'percent' ? 'Applied on total after GST' : 'Flat amount deducted from total after GST'}
//                     </p>
//                   </div>
//                 )}

//                 {items.length > 0 && (
//                   <div className="mt-5 pb-5">
//                     <BillSummary
//                       items={items}
//                       purchaseType={purchaseType}
//                       billDiscountType={billDiscountType}
//                       billDiscountValue={parseFloat(billDiscountValue) || 0}
//                     />
//                   </div>
//                 )}
//               </>
//             )}
//           </div>

//           {step === 2 && (
//             <div className="shrink-0 bg-white border-t border-slate-100 px-5 py-4 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
//               <div className="flex gap-3">
//                 <button onClick={() => setStep(1)}
//                   className="flex-1 bg-slate-100 text-slate-700 font-semibold py-3.5 rounded-xl text-base hover:bg-slate-200 transition-colors">
//                   <ArrowLeft size={24} className="inline-block mr-2" /> Back
//                 </button>
//                 <button
//                   onClick={handleSave}
//                   disabled={!supplierId || !invoiceNo || items.length === 0}
//                   className="flex-[2] bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-lg disabled:opacity-50 hover:bg-emerald-600 transition-colors"
//                 >
//                   Save Entry
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {showAddCompany && (
//         <AddCompanyModal
//           onClose={() => setShowAddCompany(false)}
//           onSave={handleCompanyAddedNested}
//         />
//       )}

//       {showAddProduct && (
//         <AddProductModal
//           onClose={() => setShowAddProduct(false)}
//           onSave={handleProductAddedNested}
//           companies={companies}
//           defaultCompanyId={supplierId}
//           defaultCompanyName={currentSupplier?.companyName ?? supplierSearch}
//         />
//       )}
//     </>
//   );
// };