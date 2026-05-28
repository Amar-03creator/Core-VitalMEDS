// components/Admin/BillingPage/modals/AddCompanyModal.jsx
import { useState } from 'react';
import { X } from 'lucide-react';

export const AddCompanyModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    shortCode: '',
    status: 'Active',
    gstin: '',
    drugLicense: '',
    billingAddress: '',
    leadTimeDays: 7,
    minimumOrderValue: 0,
    pendingRefunds: 0,
    advancePaid: 0,
    representatives: [{ name: '', role: '', phone: '', email: '' }],
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRepChange = (idx, field, value) => {
    const newReps = [...formData.representatives];
    newReps[idx][field] = value;
    setFormData({ ...formData, representatives: newReps });
  };

  const addRep = () => {
    setFormData({
      ...formData,
      representatives: [...formData.representatives, { name: '', role: '', phone: '', email: '' }],
    });
  };

  const removeRep = (idx) => {
    const newReps = formData.representatives.filter((_, i) => i !== idx);
    setFormData({ ...formData, representatives: newReps });
  };

  const handleSubmit = () => {
    if (!formData.companyName.trim()) {
      alert('Company name is required');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold text-slate-900">Add New Company</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-semibold">Company Name *</label>
            <input name="companyName" value={formData.companyName} onChange={handleChange} className="w-full border rounded-xl px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-sm font-semibold">Short Code</label>
            <input name="shortCode" value={formData.shortCode} onChange={handleChange} className="w-full border rounded-xl px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-sm font-semibold">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full border rounded-xl px-3 py-2 mt-1">
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold">GSTIN</label>
            <input name="gstin" value={formData.gstin} onChange={handleChange} className="w-full border rounded-xl px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-sm font-semibold">Drug License</label>
            <input name="drugLicense" value={formData.drugLicense} onChange={handleChange} className="w-full border rounded-xl px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-sm font-semibold">Billing Address</label>
            <textarea name="billingAddress" value={formData.billingAddress} onChange={handleChange} rows={2} className="w-full border rounded-xl px-3 py-2 mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-semibold">Lead Time (days)</label>
              <input type="number" name="leadTimeDays" value={formData.leadTimeDays} onChange={handleChange} className="w-full border rounded-xl px-3 py-2 mt-1" />
            </div>
            <div>
              <label className="text-sm font-semibold">Min Order Value (₹)</label>
              <input type="number" name="minimumOrderValue" value={formData.minimumOrderValue} onChange={handleChange} className="w-full border rounded-xl px-3 py-2 mt-1" />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold">Representatives</label>
            {formData.representatives.map((rep, idx) => (
              <div key={idx} className="border rounded-xl p-3 mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs font-semibold">Rep {idx+1}</span>
                  {idx > 0 && <button type="button" onClick={() => removeRep(idx)} className="text-red-500 text-xs">Remove</button>}
                </div>
                <input placeholder="Name" value={rep.name} onChange={e => handleRepChange(idx, 'name', e.target.value)} className="w-full border rounded-lg px-2 py-1 text-sm" />
                <input placeholder="Role" value={rep.role} onChange={e => handleRepChange(idx, 'role', e.target.value)} className="w-full border rounded-lg px-2 py-1 text-sm" />
                <input placeholder="Phone" value={rep.phone} onChange={e => handleRepChange(idx, 'phone', e.target.value)} className="w-full border rounded-lg px-2 py-1 text-sm" />
                <input placeholder="Email" value={rep.email} onChange={e => handleRepChange(idx, 'email', e.target.value)} className="w-full border rounded-lg px-2 py-1 text-sm" />
              </div>
            ))}
            <button type="button" onClick={addRep} className="text-blue-600 text-sm mt-2">+ Add Representative</button>
          </div>
          <div className="flex gap-2 pt-4">
            <button onClick={onClose} className="flex-1 py-2 rounded-xl border">Cancel</button>
            <button onClick={handleSubmit} className="flex-1 bg-emerald-500 text-white font-bold py-2 rounded-xl">Save Company</button>
          </div>
        </div>
      </div>
    </div>
  );
};