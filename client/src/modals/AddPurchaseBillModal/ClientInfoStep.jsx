// AddPurchaseBillModal/ClientInfoStep.jsx
import { useState, useMemo, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import { DateInput } from './DateInput';
import { useMandatoryField } from './hooks/useMandatoryField';

const isNotFuture = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date <= today;
};

export const ClientInfoStep = ({
  companies,
  supplierId, setSupplierId,
  supplierSearch, setSupplierSearch,
  invoiceNo, setInvoiceNo,
  billDate, setBillDate,
  receivedDate, setReceivedDate,
  address, setAddress,
  billType, setBillType,
  purchaseType, setPurchaseType,
  onNext,
  showAddCompany, setShowAddCompany,
  lockedSupplierId,
}) => {
  const [showSupplierList, setShowSupplierList] = useState(false);

  const supplierField = useMandatoryField();
  const invoiceField = useMandatoryField();

  const [billDateTouched, setBillDateTouched] = useState(false);
  const [receivedDateTouched, setReceivedDateTouched] = useState(false);

  const handleFocus = (e) => {
    const target = e.target;
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300); 
  };

  useEffect(() => {
    if (!lockedSupplierId || supplierId) return;
    const company = companies.find(c => (c._id || c.id) === lockedSupplierId);
    if (company) {
      setSupplierId(company._id || company.id);
      setSupplierSearch(company.companyName);
      setAddress(company.billingAddress || '');
    }
  }, [lockedSupplierId, companies]);

  const supplierOptions = useMemo(() => {
    if (!supplierSearch) return [];
    const s = supplierSearch.toLowerCase();
    return companies
      .filter(c => c.companyName.toLowerCase().includes(s))
      .map(c => ({ id: c._id || c.id, label: c.companyName, billingAddress: c.billingAddress }));
  }, [supplierSearch, companies]);

  const handleSelectSupplier = (item) => {
    const company = companies.find(c => (c._id || c.id) === item.id);
    if (company) {
      setSupplierId(company._id || company.id);
      setSupplierSearch(company.companyName);
      setAddress(company.billingAddress || '');
    }
    setShowSupplierList(false);
    supplierField.unlock();
  };

  const clearSupplier = () => {
    setSupplierId('');
    setSupplierSearch('');
    setAddress('');
    setShowSupplierList(false);
    supplierField.lock();
  };

  const validateBillDate = (val) => {
    if (!isNotFuture(val)) return 'Bill date cannot be in the future';
    if (receivedDate && val > receivedDate) return 'Bill date cannot be after received date';
    return null;
  };
  const validateReceivedDate = (val) => {
    if (!isNotFuture(val)) return 'Received date cannot be in the future';
    if (billDate && val < billDate) return 'Received date cannot be before bill date';
    return null;
  };

  const canNext = supplierId && invoiceNo.trim() && billDate && receivedDate;

  return (
    // ✨ FIX: Removed pb-32 to fix the excessive padding issue
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-base font-semibold text-slate-700">Supplier *</label>
            {!lockedSupplierId && (
              <button type="button" onClick={() => setShowAddCompany(true)} className="text-sm font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg hover:bg-slate-200">+ New</button>
            )}
          </div>
          {lockedSupplierId ? (
            <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-base text-slate-700 flex items-center gap-2">
              <Lock size={14} className="text-slate-400 shrink-0" />
              <span className="truncate">{supplierSearch || '...'}</span>
            </div>
          ) : (
            <div onFocusCapture={handleFocus} className="w-full [&_input]:w-full [&_input]:bg-white [&_input]:border [&_input]:border-slate-300 [&_input]:rounded-xl [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-base [&_input]:text-slate-800 [&_input]:outline-none [&_input]:focus:border-emerald-400">
              <SearchableSelect
                value={supplierSearch}
                onChange={val => setSupplierSearch(val)}
                options={supplierOptions}
                onSelect={handleSelectSupplier}
                onClear={clearSupplier}
                placeholder="Search supplier..."
                show={showSupplierList}
                setShow={setShowSupplierList}
              />
            </div>
          )}
        </div>
        <div>
          <label className="text-base font-semibold text-slate-700 block mb-1">Invoice No. *</label>
          <input
            ref={invoiceField.ref}
            value={invoiceNo}
            onChange={e => setInvoiceNo(e.target.value)}
            onFocus={handleFocus}
            onBlur={invoiceField.onBlur}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div onFocusCapture={handleFocus}>
          <DateInput
            value={billDate}
            onChange={(val) => { setBillDate(val); setBillDateTouched(true); }}
            label="Bill Date *"
            validate={validateBillDate}
          />
        </div>
        <div onFocusCapture={handleFocus}>
          <DateInput
            value={receivedDate}
            onChange={(val) => { setReceivedDate(val); setReceivedDateTouched(true); }}
            label="Received Date *"
            validate={validateReceivedDate}
          />
        </div>
      </div>

      <div>
        <label className="text-base font-semibold text-slate-700 block mb-1">Address</label>
        <textarea
          value={address}
          readOnly
          rows={2}
          onFocus={handleFocus}
          className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none resize-none cursor-not-allowed"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-base font-semibold text-slate-700 block mb-1">Bill Type</label>
          <select onFocus={handleFocus} value={billType} onChange={e => setBillType(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400">
            <option>Credit</option>
            <option>Cash</option>
            <option>Stock Transfer</option>
          </select>
        </div>
        <div>
          <label className="text-base font-semibold text-slate-700 block mb-1">Purchase Type</label>
          <select onFocus={handleFocus} value={purchaseType} onChange={e => setPurchaseType(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400">
            <option value="intrastate">Intra-state</option>
            <option value="interstate">Interstate</option>
          </select>
        </div>
      </div>

      <div className="pt-5 mt-4 border-t border-slate-100">
        <button
          onClick={onNext}
          disabled={!canNext}
          className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl text-lg disabled:opacity-50 hover:bg-slate-800 transition-colors"
        >
          Next: Products Entry →
        </button>
      </div>
    </div>
  );
};