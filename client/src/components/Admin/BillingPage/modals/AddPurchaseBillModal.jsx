// components/Admin/BillingPage/modals/AddPurchaseBillModal.jsx
import { useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import { AddCompanyModal } from './AddCompanyModal';
import { AddProductModal } from './AddProductModal';

// Helper to generate unique ID (temporary)
const genId = () => Date.now() + '-' + Math.random().toString(36).substr(2, 5);

export const AddPurchaseBillModal = ({ onClose }) => {
  // State for companies and products (will be updated after adding new ones)
  const [companies, setCompanies] = useState([
    { id: 'comp1', companyName: 'Cipla Ltd', shortCode: 'CIPLA', gstin: '27AAACC1234A1Z' },
    { id: 'comp2', companyName: 'Sun Pharma', shortCode: 'SUN', gstin: '27AAACS5678B2Z' },
  ]);
  const [products, setProducts] = useState([
    { id: 'prod1', name: 'Paracetamol 500mg', companyId: 'comp1', packing: "10's", hsnCode: '300490', gstRate: 5 },
    { id: 'prod2', name: 'Amoxicillin 250mg', companyId: 'comp2', packing: "10's", hsnCode: '300410', gstRate: 12 },
  ]);

  // Purchase bill header
  const [companyId, setCompanyId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);

  // Items list
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    productId: '',
    batchNumber: '',
    expiryDate: '',
    mrp: '',
    sellingRate: '',
    qty: 1,
    free: 0,
  });

  // Modal visibility for company/product addition
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  const selectedCompany = companies.find(c => c.id === companyId);
  const availableProducts = products.filter(p => !companyId || p.companyId === companyId);

  const handleAddItem = () => {
    if (!currentItem.productId || !currentItem.batchNumber || !currentItem.expiryDate || !currentItem.sellingRate) {
      alert('Please fill product, batch, expiry, and rate');
      return;
    }
    const product = products.find(p => p.id === currentItem.productId);
    if (!product) return;
    const newItem = {
      id: genId(),
      productId: currentItem.productId,
      productName: product.name,
      packing: product.packing,
      hsn: product.hsnCode,
      gstRate: product.gstRate,
      batchNumber: currentItem.batchNumber,
      expiryDate: currentItem.expiryDate,
      mrp: parseFloat(currentItem.mrp) || 0,
      rate: parseFloat(currentItem.sellingRate),
      chargeableQty: parseInt(currentItem.qty) || 0,
      freeQty: parseInt(currentItem.free) || 0,
    };
    setItems([...items, newItem]);
    setCurrentItem({ productId: '', batchNumber: '', expiryDate: '', mrp: '', sellingRate: '', qty: 1, free: 0 });
  };

  const removeItem = (id) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleSavePurchaseBill = () => {
    if (!companyId || !invoiceNo || items.length === 0) {
      alert('Please select company, enter invoice number, and add at least one item');
      return;
    }
    // Here you would save the purchase bill to backend (API call)
    const purchaseBillData = {
      companyId,
      invoiceNumber: invoiceNo,
      date: billDate,
      items: items.map(item => ({
        productId: item.productId,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        mrp: item.mrp,
        sellingRate: item.rate,
        quantity: item.chargeableQty,
        freeQuantity: item.freeQty,
      })),
    };
    console.log('Purchase Bill Saved:', purchaseBillData);
    alert('Purchase bill saved successfully!');
    onClose();
  };

  const handleCompanyAdded = (newCompany) => {
    const newCompanyWithId = { ...newCompany, id: genId() };
    setCompanies([...companies, newCompanyWithId]);
    setCompanyId(newCompanyWithId.id);
    setShowCompanyModal(false);
  };

  const handleProductAdded = (newProduct) => {
    const newProductWithId = { ...newProduct, id: genId() };
    setProducts([...products, newProductWithId]);
    setCurrentItem({ ...currentItem, productId: newProductWithId.id });
    setShowProductModal(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
        <div className="w-full bg-white rounded-t-2xl max-h-[92vh] overflow-y-auto">
          <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-bold text-slate-900 text-lg">Add Purchase Bill</h3>
            <button onClick={onClose}><X size={22} className="text-slate-400" /></button>
          </div>
          <div className="px-5 py-4 space-y-5">
            {/* Header fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold">Company *</label>
                <div className="flex gap-2 mt-1">
                  <select value={companyId} onChange={e => setCompanyId(e.target.value)} className="flex-1 border rounded-xl px-3 py-2">
                    <option value="">Select Company</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                  </select>
                  <button onClick={() => setShowCompanyModal(true)} className="px-3 bg-slate-100 rounded-xl text-sm">+ New</button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold">Invoice No. *</label>
                <input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className="w-full border rounded-xl px-3 py-2 mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold">Bill Date</label>
              <input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} className="w-full border rounded-xl px-3 py-2 mt-1" />
            </div>

            {/* Item entry form */}
            <div className="border rounded-xl p-4 space-y-3">
              <p className="font-semibold">Add Item</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs">Product *</label>
                  <div className="flex gap-2">
                    <select value={currentItem.productId} onChange={e => setCurrentItem({ ...currentItem, productId: e.target.value })} className="flex-1 border rounded-lg px-2 py-1 text-sm">
                      <option value="">Select Product</option>
                      {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button onClick={() => setShowProductModal(true)} className="px-2 bg-slate-100 rounded-lg text-xs">+ New</button>
                  </div>
                </div>
                <div>
                  <label className="text-xs">Batch No. *</label>
                  <input value={currentItem.batchNumber} onChange={e => setCurrentItem({ ...currentItem, batchNumber: e.target.value })} className="w-full border rounded-lg px-2 py-1 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs">Expiry Date *</label>
                  <input type="date" value={currentItem.expiryDate} onChange={e => setCurrentItem({ ...currentItem, expiryDate: e.target.value })} className="w-full border rounded-lg px-2 py-1 text-sm" />
                </div>
                <div>
                  <label className="text-xs">MRP (₹)</label>
                  <input type="number" value={currentItem.mrp} onChange={e => setCurrentItem({ ...currentItem, mrp: e.target.value })} className="w-full border rounded-lg px-2 py-1 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs">Rate (₹) *</label>
                  <input type="number" value={currentItem.sellingRate} onChange={e => setCurrentItem({ ...currentItem, sellingRate: e.target.value })} className="w-full border rounded-lg px-2 py-1 text-sm" />
                </div>
                <div>
                  <label className="text-xs">Qty</label>
                  <input type="number" value={currentItem.qty} onChange={e => setCurrentItem({ ...currentItem, qty: e.target.value })} className="w-full border rounded-lg px-2 py-1 text-sm" />
                </div>
                <div>
                  <label className="text-xs">Free</label>
                  <input type="number" value={currentItem.free} onChange={e => setCurrentItem({ ...currentItem, free: e.target.value })} className="w-full border rounded-lg px-2 py-1 text-sm" />
                </div>
              </div>
              <button onClick={handleAddItem} className="w-full bg-slate-100 py-1.5 rounded-lg text-sm font-semibold">+ Add to List</button>
            </div>

            {/* Items list */}
            {items.length > 0 && (
              <div className="space-y-2">
                <p className="font-semibold">Items ({items.length})</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.id} className="bg-slate-50 rounded-xl p-2 flex justify-between items-start">
                      <div className="text-xs">
                        <p className="font-semibold">{item.productName}</p>
                        <p>Batch: {item.batchNumber} | Exp: {item.expiryDate}</p>
                        <p>Qty: {item.chargeableQty} + {item.freeQty} free | Rate: ₹{item.rate}</p>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-red-500"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleSavePurchaseBill} disabled={!companyId || !invoiceNo || items.length === 0} className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl disabled:opacity-50">
              Save Purchase Bill
            </button>
          </div>
        </div>
      </div>

      {showCompanyModal && <AddCompanyModal onClose={() => setShowCompanyModal(false)} onSave={handleCompanyAdded} />}
      {showProductModal && <AddProductModal onClose={() => setShowProductModal(false)} onSave={handleProductAdded} companies={companies} />}
    </>
  );
};