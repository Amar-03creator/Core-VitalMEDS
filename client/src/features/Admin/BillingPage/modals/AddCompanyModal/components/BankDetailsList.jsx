import { useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

const emptyBank = { bankName: '', accountNumber: '', ifscCode: '', branch: '' };

const isValidIFSC = (v) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v.toUpperCase());
const isValidAccountNumber = (v) => /^\d{9,18}$/.test(v);

export const BankDetailsList = ({
  bankDetails,
  onChange,
  errors,
  setErrors,
  toast,
  engageTrap,
  releaseTrap,
}) => {
  // Create refs array for each bank entry's inputs we want to trap
  const accountNumberRefs = useRef([]);
  const ifscRefs = useRef([]);

  // Ensure refs array length matches bankDetails length
  useEffect(() => {
    accountNumberRefs.current = accountNumberRefs.current.slice(0, bankDetails.length);
    ifscRefs.current = ifscRefs.current.slice(0, bankDetails.length);
  }, [bankDetails.length]);

  const addBank = () => {
    onChange([...bankDetails, { ...emptyBank }]);
  };

  const removeBank = (index) => {
    const updated = bankDetails.filter((_, i) => i !== index);
    onChange(updated);
    // Clear any errors associated with this index
    if (setErrors) {
      const newErrs = { ...errors };
      delete newErrs[`bank_${index}_accountNumber`];
      delete newErrs[`bank_${index}_ifscCode`];
      delete newErrs[`bank_${index}`];
      setErrors(newErrs);
    }
    // Release trap if the removed field was trapped
    releaseTrap();
  };

  const handleFieldChange = (index, field, value) => {
    const updated = [...bankDetails];
    if (field === 'ifscCode') value = value.toUpperCase().replace(/\s/g, '');
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);

    // Immediately clear related error when user edits
    if (setErrors) {
      const newErrs = { ...errors };
      const errKey = `bank_${index}_${field}`;
      if (newErrs[errKey]) {
        delete newErrs[errKey];
        setErrors(newErrs);
      }
    }

    // If the field becomes valid, release the trap
    if (field === 'accountNumber' || field === 'ifscCode') {
      const bank = updated[index];
      if (field === 'accountNumber' && bank.accountNumber && isValidAccountNumber(bank.accountNumber)) {
        releaseTrap();
      }
      if (field === 'ifscCode' && bank.ifscCode && isValidIFSC(bank.ifscCode)) {
        releaseTrap();
      }
    }
  };

  const handleBlur = (index, field, value) => {
    if (!value) return; // allow empty

    let invalid = false;
    let msg = '';

    if (field === 'accountNumber') {
      if (!isValidAccountNumber(value)) {
        invalid = true;
        msg = 'Account number must be 9-18 digits.';
      }
    } else if (field === 'ifscCode') {
      if (!isValidIFSC(value)) {
        invalid = true;
        msg = 'Invalid IFSC (e.g., SBIN0001234).';
      }
    }

    if (invalid) {
      const errKey = `bank_${index}_${field}`;
      setErrors(prev => ({ ...prev, [errKey]: msg }));
      toast.error(msg);

      // Engage focus trap on the specific input
      if (field === 'accountNumber' && accountNumberRefs.current[index]) {
        engageTrap(accountNumberRefs.current[index]);
      } else if (field === 'ifscCode' && ifscRefs.current[index]) {
        engageTrap(ifscRefs.current[index]);
      }
    }
  };

  // Set ref for each input
  const setAccountNumberRef = (el, index) => {
    accountNumberRefs.current[index] = el;
  };
  const setIfscRef = (el, index) => {
    ifscRefs.current[index] = el;
  };

  return (
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">
        Bank Details
      </label>
      {bankDetails.map((bank, idx) => (
        <div key={idx} className="border border-slate-300 rounded-xl p-3 mb-2 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-semibold text-slate-700">Bank #{idx + 1}</span>
            <button
              type="button"
              onClick={() => removeBank(idx)}
              className="text-red-500 text-sm"
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Bank Name *"
              value={bank.bankName}
              onChange={(e) => handleFieldChange(idx, 'bankName', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400"
            />
            <div>
              <input
                ref={(el) => setAccountNumberRef(el, idx)}
                placeholder="Account Number *"
                value={bank.accountNumber}
                onChange={(e) => handleFieldChange(idx, 'accountNumber', e.target.value)}
                onBlur={(e) => handleBlur(idx, 'accountNumber', e.target.value)}
                className={`w-full bg-white border ${
                  errors[`bank_${idx}_accountNumber`] ? 'border-red-500' : 'border-slate-300'
                } rounded-lg px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400`}
              />
              {errors[`bank_${idx}_accountNumber`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`bank_${idx}_accountNumber`]}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                ref={(el) => setIfscRef(el, idx)}
                placeholder="IFSC Code *"
                value={bank.ifscCode}
                onChange={(e) => handleFieldChange(idx, 'ifscCode', e.target.value)}
                onBlur={(e) => handleBlur(idx, 'ifscCode', e.target.value)}
                className={`w-full bg-white border ${
                  errors[`bank_${idx}_ifscCode`] ? 'border-red-500' : 'border-slate-300'
                } rounded-lg px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400`}
              />
              {errors[`bank_${idx}_ifscCode`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`bank_${idx}_ifscCode`]}</p>
              )}
            </div>
            <input
              placeholder="Branch *"
              value={bank.branch}
              onChange={(e) => handleFieldChange(idx, 'branch', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400"
            />
          </div>
          {errors[`bank_${idx}`] && (
            <p className="text-red-500 text-xs">{errors[`bank_${idx}`]}</p>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addBank}
        className="text-sm text-emerald-600 font-semibold"
      >
        + Add Bank
      </button>
    </div>
  );
};