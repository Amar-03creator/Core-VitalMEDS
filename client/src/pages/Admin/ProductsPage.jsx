import { useState } from 'react';

import {

  Package, Search, Plus, Edit, Printer, Eye, ChevronDown, ChevronUp,

  Tag, Layers, AlertTriangle, XCircle, CheckCircle, BarChart2, Grid, List

} from 'lucide-react';



/* ── DEMO DATA ── */

const companies = ['All', 'Cipla', 'Sun Pharma', "Dr. Reddy's", 'Mankind', 'USV', 'Torrent', 'Aster Medipharm'];

const categories = ['All', 'Analgesic', 'Antibiotic', 'GI', 'Antihistamine', 'Antidiabetic', 'Lipid-lowering', 'Cardiovascular', 'Antibiotic'];



const products = [

  {

    id: 'PRD-001', sku: 'CIP-PCM-500', name: 'Paracetamol 500mg', company: 'Cipla',

    composition: 'Paracetamol 500mg', category: 'Analgesic', type: 'Tablet',

    packing: "10'S Strip", hsnCode: '300490', gstRate: 5,

    totalStock: 1240, lowStockThreshold: 200, shortExpiryThreshold: 90,

    mrp: 18.5, description: 'For relief of pain and fever.',

    usageTips: 'Take after food. Max 3g/day in adults.',

    photoUrl: null, status: 'Active',

  },

  {

    id: 'PRD-002', sku: 'SUN-AMX-250', name: 'Amoxicillin 250mg', company: 'Sun Pharma',

    composition: 'Amoxicillin Trihydrate 250mg', category: 'Antibiotic', type: 'Capsule',

    packing: '10 Capsules', hsnCode: '300410', gstRate: 12,

    totalStock: 45, lowStockThreshold: 100, shortExpiryThreshold: 90,

    mrp: 85.0, description: 'Broad-spectrum antibiotic.',

    usageTips: 'Complete the full course. Take with water.',

    photoUrl: null, status: 'Active',

  },

  {

    id: 'PRD-003', sku: 'DRL-OMZ-20', name: 'Omeprazole 20mg', company: "Dr. Reddy's",

    composition: 'Omeprazole 20mg', category: 'GI', type: 'Capsule',

    packing: "10'S Capsule", hsnCode: '300490', gstRate: 12,

    totalStock: 0, lowStockThreshold: 150, shortExpiryThreshold: 90,

    mrp: 85.0, description: 'Proton pump inhibitor for acidity.',

    usageTips: 'Take 30 minutes before meals.',

    photoUrl: null, status: 'Active',

  },

  {

    id: 'PRD-004', sku: 'MAN-CTZ-10', name: 'Cetirizine 10mg', company: 'Mankind',

    composition: 'Cetirizine HCl 10mg', category: 'Antihistamine', type: 'Tablet',

    packing: "10'S Strip", hsnCode: '300490', gstRate: 5,

    totalStock: 890, lowStockThreshold: 100, shortExpiryThreshold: 90,

    mrp: 28.0, description: 'For allergic rhinitis and urticaria.',

    usageTips: 'May cause drowsiness. Avoid driving.',

    photoUrl: null, status: 'Active',

  },

  {

    id: 'PRD-005', sku: 'USV-MET-500', name: 'Metformin 500mg', company: 'USV',

    composition: 'Metformin HCl 500mg', category: 'Antidiabetic', type: 'Tablet',

    packing: "10'S Strip", hsnCode: '300490', gstRate: 5,

    totalStock: 234, lowStockThreshold: 200, shortExpiryThreshold: 90,

    mrp: 32.0, description: 'First-line medication for type 2 diabetes.',

    usageTips: 'Take with meals to reduce GI upset.',

    photoUrl: null, status: 'Active',

  },

  {

    id: 'PRD-006', sku: 'TOR-ATV-10', name: 'Atorvastatin 10mg', company: 'Torrent',

    composition: 'Atorvastatin Calcium 10mg', category: 'Lipid-lowering', type: 'Tablet',

    packing: "10'S Strip", hsnCode: '300490', gstRate: 12,

    totalStock: 560, lowStockThreshold: 100, shortExpiryThreshold: 90,

    mrp: 55.0, description: 'Statin for lowering cholesterol.',

    usageTips: 'Take at the same time each day.',

    photoUrl: null, status: 'Active',

  },

  {

    id: 'PRD-007', sku: 'AST-PAN-40', name: 'Pantoprazole 40mg', company: 'Aster Medipharm',

    composition: 'Pantoprazole Sodium 40mg', category: 'GI', type: 'Tablet',

    packing: "10'S Strip", hsnCode: '300490', gstRate: 12,

    totalStock: 380, lowStockThreshold: 100, shortExpiryThreshold: 90,

    mrp: 72.0, description: 'For treatment of GERD and peptic ulcers.',

    usageTips: 'Take before meals. Swallow whole.',

    photoUrl: null, status: 'Active',

  },

];



const stats = {

  total: products.length,

  lowStock: products.filter(p => p.totalStock > 0 && p.totalStock <= p.lowStockThreshold).length,

  outStock: products.filter(p => p.totalStock === 0).length,

  categories: [...new Set(products.map(p => p.category))].length,

};



/* ── ADD/EDIT PRODUCT MODAL ── */

const ProductModal = ({ product, onClose }) => {

  const isEdit = !!product;

  const [form, setForm] = useState(product || {

    name: '', company: '', composition: '', category: '', type: 'Tablet',

    packing: '', hsnCode: '', gstRate: 5, mrp: '', lowStockThreshold: 100,

    shortExpiryThreshold: 90, description: '', usageTips: '',

  });



  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));



  return (

    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">

      <div className="w-full bg-white rounded-t-2xl max-h-[92vh] overflow-y-auto">

        <div className="sticky top-0 bg-white px-4 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">

          <div>

            <h3 className="text-slate-900 font-bold text-base">{isEdit ? 'Edit Product' : 'Add New Product'}</h3>

            <p className="text-slate-500 text-xs">Master catalog entry</p>

          </div>

          <button onClick={onClose}><XCircle size={20} className="text-slate-400" /></button>

        </div>



        <div className="px-4 py-4 space-y-3">

          {/* Basic Info */}

          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Basic Information</p>



          {[

            { label: 'Medicine Name', key: 'name', placeholder: 'e.g. Paracetamol 500mg' },

            { label: 'Composition', key: 'composition', placeholder: 'e.g. Paracetamol 500mg' },

          ].map(({ label, key, placeholder }) => (

            <div key={key}>

              <label className="text-xs text-slate-500 block mb-1.5">{label}</label>

              <input

                value={form[key]}

                onChange={e => set(key, e.target.value)}

                placeholder={placeholder}

                className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400"

              />

            </div>

          ))}



          <div className="grid grid-cols-2 gap-3">

            <div>

              <label className="text-xs text-slate-500 block mb-1.5">Company</label>

              <select value={form.company} onChange={e => set('company', e.target.value)}

                className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none">

                <option value="">Select...</option>

                {companies.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}

              </select>

            </div>

            <div>

              <label className="text-xs text-slate-500 block mb-1.5">Category</label>

              <select value={form.category} onChange={e => set('category', e.target.value)}

                className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none">

                <option value="">Select...</option>

                {categories.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}

              </select>

            </div>

            <div>

              <label className="text-xs text-slate-500 block mb-1.5">Type</label>

              <select value={form.type} onChange={e => set('type', e.target.value)}

                className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none">

                {['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops'].map(t => <option key={t}>{t}</option>)}

              </select>

            </div>

            <div>

              <label className="text-xs text-slate-500 block mb-1.5">Packing</label>

              <input value={form.packing} onChange={e => set('packing', e.target.value)} placeholder="e.g. 10'S Strip"

                className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400" />

            </div>

          </div>



          {/* Pricing & Tax */}

          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide pt-1">Pricing & Tax</p>

          <div className="grid grid-cols-3 gap-3">

            <div>

              <label className="text-xs text-slate-500 block mb-1.5">MRP (₹)</label>

              <input type="number" value={form.mrp} onChange={e => set('mrp', e.target.value)} placeholder="0.00"

                className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400" />

            </div>

            <div>

              <label className="text-xs text-slate-500 block mb-1.5">GST Rate (%)</label>

              <select value={form.gstRate} onChange={e => set('gstRate', e.target.value)}

                className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none">

                {[0, 5, 12, 18].map(g => <option key={g}>{g}</option>)}

              </select>

            </div>

            <div>

              <label className="text-xs text-slate-500 block mb-1.5">HSN Code</label>

              <input value={form.hsnCode} onChange={e => set('hsnCode', e.target.value)} placeholder="300490"

                className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400" />

            </div>

          </div>



          {/* Thresholds */}

          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide pt-1">Alert Thresholds</p>

          <div className="grid grid-cols-2 gap-3">

            <div>

              <label className="text-xs text-slate-500 block mb-1.5">Low Stock Alert (units)</label>

              <input type="number" value={form.lowStockThreshold} onChange={e => set('lowStockThreshold', e.target.value)}

                className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400" />

            </div>

            <div>

              <label className="text-xs text-slate-500 block mb-1.5">Near Expiry (days)</label>

              <input type="number" value={form.shortExpiryThreshold} onChange={e => set('shortExpiryThreshold', e.target.value)}

                className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400" />

            </div>

          </div>



          {/* Description */}

          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide pt-1">Additional Info</p>

          <div>

            <label className="text-xs text-slate-500 block mb-1.5">Description</label>

            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}

              placeholder="Short product description..."

              className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 resize-none" />

          </div>

          <div>

            <label className="text-xs text-slate-500 block mb-1.5">Usage Tips</label>

            <textarea value={form.usageTips} onChange={e => set('usageTips', e.target.value)} rows={2}

              placeholder="Dosage and usage tips..."

              className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 resize-none" />

          </div>



          <button className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">

            <CheckCircle size={16} /> {isEdit ? 'Save Changes' : 'Add Product'}

          </button>

        </div>

      </div>

    </div>

  );

};



/* ── PRODUCT CARD ── */

const ProductCard = ({ product, onEdit }) => {

  const [expanded, setExpanded] = useState(false);



  const stockStatus =

    product.totalStock === 0 ? 'out' :

      product.totalStock <= product.lowStockThreshold ? 'low' : 'ok';



  const ptr = (product.mrp * 0.8).toFixed(2);



  return (

    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

      <button onClick={() => setExpanded(e => !e)} className="w-full text-left px-4 py-3.5">

        <div className="flex items-start gap-3">

          {/* Icon */}

          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">

            <Package size={18} className="text-slate-500" />

          </div>



          <div className="flex-1 min-w-0">

            <div className="flex items-center gap-2 flex-wrap">

              <p className="text-slate-900 font-semibold text-sm">{product.name}</p>

              {stockStatus === 'out' && (

                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">OUT OF STOCK</span>

              )}

              {stockStatus === 'low' && (

                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">LOW STOCK</span>

              )}

            </div>

            <p className="text-slate-500 text-xs mt-0.5">{product.company} · {product.packing} · GST {product.gstRate}%</p>

            <div className="flex items-center gap-2 mt-1.5">

              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{product.category}</span>

              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">{product.type}</span>

            </div>

          </div>



          <div className="text-right shrink-0">

            <p className={`font-bold text-lg leading-none ${stockStatus === 'out' ? 'text-red-500' :

                stockStatus === 'low' ? 'text-amber-500' : 'text-slate-900'

              }`}>{product.totalStock}</p>

            <p className="text-slate-400 text-[10px]">in stock</p>

          </div>



          <div className="shrink-0 ml-1">

            {expanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}

          </div>

        </div>

      </button>



      {expanded && (

        <div className="border-t border-slate-100 px-4 py-3 space-y-3">

          {/* Composition & SKU */}

          <div className="bg-slate-50 rounded-xl px-3 py-2.5 space-y-1.5">

            <div className="flex justify-between text-xs">

              <span className="text-slate-500">SKU</span>

              <span className="text-slate-800 font-mono font-semibold">{product.sku}</span>

            </div>

            <div className="flex justify-between text-xs">

              <span className="text-slate-500">HSN Code</span>

              <span className="text-slate-800 font-mono">{product.hsnCode}</span>

            </div>

            <div className="flex justify-between text-xs">

              <span className="text-slate-500">Composition</span>

              <span className="text-slate-800 font-medium text-right max-w-[60%]">{product.composition}</span>

            </div>

          </div>



          {/* Price grid */}

          <div className="grid grid-cols-3 gap-2">

            {[

              { label: 'MRP', value: `₹${product.mrp}` },

              { label: 'PTR (est.)', value: `₹${ptr}` },

              { label: 'GST Rate', value: `${product.gstRate}%` },

            ].map(({ label, value }) => (

              <div key={label} className="bg-white border border-slate-200 rounded-xl px-2 py-2 text-center">

                <p className="text-slate-800 font-bold text-sm">{value}</p>

                <p className="text-slate-400 text-[10px]">{label}</p>

              </div>

            ))}

          </div>



          {/* Thresholds */}

          <div className="flex gap-2">

            <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-center">

              <p className="text-amber-700 font-bold text-sm">{product.lowStockThreshold}</p>

              <p className="text-amber-600 text-[10px]">Low Stock Alert</p>

            </div>

            <div className="flex-1 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-center">

              <p className="text-orange-700 font-bold text-sm">{product.shortExpiryThreshold}d</p>

              <p className="text-orange-600 text-[10px]">Near Expiry Alert</p>

            </div>

          </div>



          {/* Description */}

          {product.description && (

            <p className="text-slate-600 text-xs leading-relaxed">{product.description}</p>

          )}



          {/* Actions */}

          <div className="flex gap-2 pt-1">

            <button

              onClick={() => onEdit(product)}

              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 text-white text-xs font-semibold py-2.5 rounded-xl"

            >

              <Edit size={13} /> Edit Product

            </button>

            <button className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl">

              <BarChart2 size={14} />

            </button>

          </div>

        </div>

      )}

    </div>

  );

};



/* ── PAGE ── */

const ProductsPage = () => {

  const [search, setSearch] = useState('');

  const [filterCompany, setFilterCompany] = useState('All');

  const [filterCategory, setFilterCategory] = useState('All');

  const [showModal, setShowModal] = useState(false);

  const [editProduct, setEditProduct] = useState(null);



  const filtered = products.filter(p => {

    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||

      p.company.toLowerCase().includes(search.toLowerCase()) ||

      p.composition.toLowerCase().includes(search.toLowerCase()) ||

      p.sku.toLowerCase().includes(search.toLowerCase());

    const matchCompany = filterCompany === 'All' || p.company === filterCompany;

    const matchCat = filterCategory === 'All' || p.category === filterCategory;

    return matchSearch && matchCompany && matchCat;

  });



  const openAdd = () => { setEditProduct(null); setShowModal(true); };

  const openEdit = (p) => { setEditProduct(p); setShowModal(true); };



  return (

    <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-slate-900 text-lg font-bold">Products</h1>

          <p className="text-slate-500 text-xs">Master catalog management</p>

        </div>

        <div className="flex gap-2">

          <button className="p-2 bg-slate-100 text-slate-600 rounded-xl">

            <Printer size={16} />

          </button>

          <button

            onClick={openAdd}

            className="flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-xl"

          >

            <Plus size={14} /> Add

          </button>

        </div>

      </div>



      {/* Stats */}

      <div className="grid grid-cols-4 gap-2">

        {[

          { label: 'Products', value: stats.total, bg: 'bg-slate-50', text: 'text-slate-800', border: 'border-slate-200' },

          { label: 'Low Stock', value: stats.lowStock, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },

          { label: 'Out', value: stats.outStock, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },

          { label: 'Categories', value: stats.categories, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },

        ].map(({ label, value, bg, text, border }) => (

          <div key={label} className={`rounded-2xl p-2.5 border ${bg} ${border} text-center`}>

            <p className={`text-xl font-bold ${text}`}>{value}</p>

            <p className={`text-[10px] font-medium ${text} opacity-80`}>{label}</p>

          </div>

        ))}

      </div>



      {/* Search */}

      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5">

        <Search size={15} className="text-slate-400 shrink-0" />

        <input

          value={search}

          onChange={e => setSearch(e.target.value)}

          placeholder="Search name, company, composition, SKU..."

          className="flex-1 text-sm text-slate-700 placeholder-slate-400 bg-transparent outline-none"

        />

      </div>



      {/* Company filter */}

      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">

        {companies.map(c => (

          <button

            key={c}

            onClick={() => setFilterCompany(c)}

            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all

              ${filterCompany === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}

          >

            {c}

          </button>

        ))}

      </div>



      {/* Category filter */}

      <div className="flex gap-2 overflow-x-auto scrollbar-none">

        {categories.map(c => (

          <button

            key={c}

            onClick={() => setFilterCategory(c)}

            className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all

              ${filterCategory === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-700 border-blue-100'}`}

          >

            {c}

          </button>

        ))}

      </div>



      {/* List */}

      <div className="space-y-3">

        {filtered.length === 0 ? (

          <div className="text-center py-12 text-slate-400">

            <Package className="mx-auto mb-2" size={32} />

            <p className="text-sm">No products found</p>

          </div>

        ) : (

          filtered.map(p => <ProductCard key={p.id} product={p} onEdit={openEdit} />)

        )}

      </div>



      {showModal && <ProductModal product={editProduct} onClose={() => setShowModal(false)} />}

    </div>

  );

};



export default ProductsPage;
