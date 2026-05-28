// components/Admin/BillingPage/modals/AddProductModal.jsx
import { useState } from 'react';
import { X } from 'lucide-react';

export const AddProductModal = ({ onClose, onSave, companies }) => {
  const [formData, setFormData] = useState({
    name: '',
    companyId: '',
    composition: '',
    category: '',
    type: '',
    packing: '',
    hsnCode: '',
    gstRate: 12,
    sku: '',
    shortExpiryThreshold: 90,
    lowStockThreshold: 10,
    description: '',
    usageTips: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.companyId) {
      alert('Product name and company are required');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold text-slate-900">Add New Product</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-semibold">Product Name *</label>
            <input name="name" value={formData.name} onChange={handleChange} className="w-full border rounded-xl px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-sm font-semibold">Company *</label>
            <select name="companyId" value={formData.companyId} onChange={handleChange} className="w-full border rounded-xl px-3 py-2 mt-1">
              <option value="">Select Company</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-semibold">Composition</label>
              <input name="composition" value={formData.composition} onChange={handleChange} className="w-full border rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold">Category</label>
              <input name="category" value={formData.category} onChange={handleChange} className="w-full border rounded-xl px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-semibold">Type</label>
              <input name="type" value={formData.type} onChange={handleChange} className="w-full border rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold">Packing</label>
              <input name="packing" value={formData.packing} onChange={handleChange} className="w-full border rounded-xl px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-semibold">HSN Code</label>
              <input name="hsnCode" value={formData.hsnCode} onChange={handleChange} className="w-full border rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold">GST Rate (%)</label>
              <input type="number" name="gstRate" value={formData.gstRate} onChange={handleChange} className="w-full border rounded-xl px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold">SKU</label>
            <input name="sku" value={formData.sku} onChange={handleChange} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-semibold">Short Expiry Threshold (days)</label>
              <input type="number" name="shortExpiryThreshold" value={formData.shortExpiryThreshold} onChange={handleChange} className="w-full border rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold">Low Stock Threshold</label>
              <input type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} className="w-full border rounded-xl px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-semibold">Usage Tips</label>
            <textarea name="usageTips" value={formData.usageTips} onChange={handleChange} rows={2} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div className="flex gap-2 pt-4">
            <button onClick={onClose} className="flex-1 py-2 rounded-xl border">Cancel</button>
            <button onClick={handleSubmit} className="flex-1 bg-emerald-500 text-white font-bold py-2 rounded-xl">Save Product</button>
          </div>
        </div>
      </div>
    </div>
  );
};