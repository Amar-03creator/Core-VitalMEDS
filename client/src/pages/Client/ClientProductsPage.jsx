import { useState } from 'react';

import {

  Search, Filter, X, Package, ShoppingCart, ClipboardList,

  ChevronDown, AlertTriangle, Flame, Info, Star, Clock

} from 'lucide-react';



/* ── DEMO DATA ── */

const allProducts = [

  {

    id: 'PRD-001', name: 'Paracetamol 500mg', company: 'Cipla',

    composition: 'Paracetamol 500mg', category: 'Analgesic',

    packing: "10'S Strip", mrp: 18.50, price: 13.20, gstRate: 5,

    totalStock: 1240, inStock: true, isNew: false, nearExpiry: false,

    description: 'For relief of mild to moderate pain and fever.',

    storage: 'Store below 25°C, away from direct sunlight.',

    deliveryTime: '12–24 hours', closestExpiry: '2026-08',

  },

  {

    id: 'PRD-002', name: 'Amoxicillin 250mg', company: 'Sun Pharma',

    composition: 'Amoxicillin Trihydrate 250mg', category: 'Antibiotic',

    packing: '10 Capsules', mrp: 85.00, price: 62.00, gstRate: 12,

    totalStock: 45, inStock: true, isNew: false, nearExpiry: false,

    description: 'Broad-spectrum antibiotic for bacterial infections.',

    storage: 'Store in a cool, dry place below 25°C.',

    deliveryTime: '12–24 hours', closestExpiry: '2026-03',

    lowStock: true,

  },

  {

    id: 'PRD-003', name: 'Omeprazole 20mg', company: "Dr. Reddy's",

    composition: 'Omeprazole 20mg', category: 'GI',

    packing: "10'S Capsule", mrp: 38.00, price: 28.00, gstRate: 12,

    totalStock: 0, inStock: false, isNew: false, nearExpiry: false,

    description: 'Proton pump inhibitor for acid reflux and ulcers.',

    storage: 'Protect from moisture. Store at room temperature.',

    deliveryTime: 'Currently out of stock', closestExpiry: '—',

  },

  {

    id: 'PRD-004', name: 'Cetirizine 10mg', company: 'Mankind',

    composition: 'Cetirizine HCl 10mg', category: 'Antihistamine',

    packing: "10'S Strip", mrp: 28.00, price: 19.50, gstRate: 5,

    totalStock: 890, inStock: true, isNew: true, nearExpiry: false,

    description: 'For allergy, urticaria and hay fever.',

    storage: 'Store below 30°C in a dry place.',

    deliveryTime: '12–24 hours', closestExpiry: '2026-06',

  },

  {

    id: 'PRD-005', name: 'Metformin 500mg', company: 'USV',

    composition: 'Metformin HCl 500mg', category: 'Antidiabetic',

    packing: "10'S Strip", mrp: 32.00, price: 18.00, gstRate: 5,

    totalStock: 234, inStock: true, isNew: false, nearExpiry: true,

    nearExpiryDate: 'Aug 2025', nearExpiryPrice: 14.00, nearExpiryExtra: '12% extra off',

    description: 'First-line treatment for type 2 diabetes.',

    storage: 'Store below 25°C away from moisture.',

    deliveryTime: '12–24 hours', closestExpiry: '2025-08',

  },

  {

    id: 'PRD-006', name: 'Atorvastatin 10mg', company: 'Torrent',

    composition: 'Atorvastatin Calcium 10mg', category: 'Lipid-lowering',

    packing: "10'S Strip", mrp: 55.00, price: 42.00, gstRate: 12,

    totalStock: 560, inStock: true, isNew: false, nearExpiry: false,

    description: 'For lowering LDL cholesterol and reducing cardiovascular risk.',

    storage: 'Store at room temperature, away from heat and moisture.',

    deliveryTime: '12–24 hours', closestExpiry: '2027-02',

  },

  {

    id: 'PRD-007', name: 'Pantoprazole 40mg', company: 'Alkem',

    composition: 'Pantoprazole Sodium 40mg', category: 'GI',

    packing: "10'S Tablet", mrp: 48.00, price: 34.50, gstRate: 12,

    totalStock: 0, inStock: false, isNew: false,

    nearExpiry: true, nearExpiryDate: 'Sep 2025', nearExpiryPrice: 27.50, nearExpiryExtra: '15% extra off',

    description: 'Proton pump inhibitor for gastroesophageal reflux.',

    storage: 'Do not crush. Store below 30°C.',

    deliveryTime: '12–24 hours', closestExpiry: '2025-09',

  },

  {

    id: 'PRD-008', name: 'Glimepiride 2mg', company: 'Sanofi',

    composition: 'Glimepiride 2mg', category: 'Antidiabetic',

    packing: "10'S Tablet", mrp: 42.00, price: 30.00, gstRate: 5,

    totalStock: 180, inStock: true, isNew: true, nearExpiry: false,

    description: 'Sulfonylurea for type 2 diabetes management.',

    storage: 'Store in a cool dry place.',

    deliveryTime: '12–24 hours', closestExpiry: '2026-11',

  },

];



const categories = ['All', 'Analgesic', 'Antibiotic', 'GI', 'Antihistamine', 'Antidiabetic', 'Lipid-lowering'];

const sortOptions = ['Top Selling', 'Price: Low to High', 'Price: High to Low', 'Alphabetical'];



/* ── PRODUCT DRAWER ── */

const ProductDrawer = ({ product, onClose, onAddToCart, onAddToInquiry }) => {

  const [qty, setQty] = useState(1);

  const disc = Math.round(((product.mrp - product.price) / product.mrp) * 100);



  return (

    <div className="fixed inset-0 z-50 flex items-end">

      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto">

        {/* Handle */}

        <div className="flex justify-center pt-3 pb-1">

          <div className="w-10 h-1 bg-slate-200 rounded-full" />

        </div>



        {/* Image placeholder */}

        <div className="mx-4 h-36 bg-slate-100 rounded-2xl flex items-center justify-center">

          <Package size={48} className="text-slate-300" />

        </div>



        <div className="px-4 pt-4 pb-8 space-y-4">

          {/* Title + badges */}

          <div>

            <div className="flex flex-wrap gap-1.5 mb-2">

              {!product.inStock && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">Out of Stock</span>}

              {product.lowStock && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">Low Stock</span>}

              {product.isNew && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">New</span>}

              {product.nearExpiry && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700">Near Expiry — {product.nearExpiryExtra}</span>}

            </div>

            <h3 className="text-slate-900 text-xl font-bold">{product.name}</h3>

            <p className="text-slate-500 text-sm">{product.company} · {product.packing}</p>

          </div>



          {/* Price */}

          <div className="flex items-baseline gap-3">

            <p className="text-emerald-600 text-2xl font-black">₹{product.price}</p>

            <p className="text-slate-400 text-base line-through">₹{product.mrp}</p>

            <span className="text-emerald-600 text-sm font-bold bg-emerald-50 px-2 py-0.5 rounded-lg">{disc}% off</span>

          </div>



          {/* Near expiry offer */}

          {product.nearExpiry && (

            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 flex items-start gap-2">

              <Flame size={16} className="text-orange-500 shrink-0 mt-0.5" />

              <div>

                <p className="text-orange-800 text-sm font-semibold">Short Expiry Batch Available</p>

                <p className="text-orange-600 text-xs">Exp: {product.nearExpiryDate} · At ₹{product.nearExpiryPrice}/strip ({product.nearExpiryExtra})</p>

              </div>

            </div>

          )}



          {/* Info grid */}

          <div className="grid grid-cols-2 gap-2">

            {[

              { label: 'Composition', value: product.composition },

              { label: 'Category', value: product.category },

              { label: 'Pack Size', value: product.packing },

              { label: 'GST Rate', value: `${product.gstRate}%` },

              { label: 'Closest Expiry', value: product.closestExpiry },

              { label: 'Delivery', value: product.deliveryTime },

            ].map(({ label, value }) => (

              <div key={label} className="bg-slate-50 rounded-xl px-3 py-2.5">

                <p className="text-slate-400 text-[10px] font-semibold uppercase">{label}</p>

                <p className="text-slate-800 text-sm font-medium mt-0.5">{value}</p>

              </div>

            ))}

          </div>



          {/* Description */}

          <div>

            <p className="text-xs text-slate-500 font-semibold uppercase mb-1.5">About</p>

            <p className="text-slate-700 text-sm leading-relaxed">{product.description}</p>

          </div>



          {/* Storage */}

          <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 flex items-start gap-2">

            <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />

            <p className="text-blue-700 text-xs">{product.storage}</p>

          </div>



          {/* Quantity + actions */}

          {product.inStock && (

            <>

              <div className="flex items-center justify-between">

                <p className="text-slate-700 text-sm font-medium">Quantity</p>

                <div className="flex items-center gap-3 bg-slate-100 rounded-xl px-1 py-1">

                  <button

                    onClick={() => setQty(q => Math.max(1, q - 1))}

                    className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-800 font-bold shadow-sm"

                  >−</button>

                  <span className="text-slate-900 font-bold text-base w-8 text-center">{qty}</span>

                  <button

                    onClick={() => setQty(q => q + 1)}

                    className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-800 font-bold shadow-sm"

                  >+</button>

                </div>

              </div>

              <div className="flex justify-between text-sm text-slate-500">

                <span>Est. total ({qty} × ₹{product.price})</span>

                <span className="font-bold text-slate-800">₹{(qty * product.price).toFixed(2)}</span>

              </div>

              <div className="flex gap-2">

                <button

                  onClick={() => { onAddToCart(product, qty); onClose(); }}

                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3.5 rounded-2xl"

                >

                  <ShoppingCart size={18} /> Add to Cart

                </button>

                <button

                  onClick={() => { onAddToInquiry(product, qty); onClose(); }}

                  className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-2xl"

                >

                  <ClipboardList size={18} /> Inquire

                </button>

              </div>

            </>

          )}

        </div>

      </div>

    </div>

  );

};



/* ── PRODUCT CARD ── */

const ProductCard = ({ product, onView, onAddToCart, onAddToInquiry }) => {

  const [qty, setQty] = useState(1);

  const disc = Math.round(((product.mrp - product.price) / product.mrp) * 100);



  return (

    <div

      className={`bg-white rounded-2xl border overflow-hidden ${!product.inStock ? 'border-slate-200 opacity-70' : 'border-slate-200'

        }`}

    >

      {/* Image */}

      <button onClick={() => onView(product)} className="block w-full">

        <div className="h-24 bg-slate-100 flex items-center justify-center relative">

          <Package size={32} className="text-slate-300" />

          {product.isNew && (

            <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 bg-blue-500 text-white rounded-md">NEW</span>

          )}

          {product.nearExpiry && (

            <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 bg-orange-500 text-white rounded-md">

              <Flame size={8} className="inline" /> HOT DEAL

            </span>

          )}

          {product.lowStock && !product.nearExpiry && (

            <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 bg-amber-500 text-white rounded-md">LOW</span>

          )}

        </div>

      </button>



      {/* Info */}

      <div className="p-3">

        <button onClick={() => onView(product)} className="text-left w-full">

          <p className="text-slate-900 font-semibold text-sm leading-tight line-clamp-2">{product.name}</p>

          <p className="text-slate-400 text-xs mt-0.5">{product.company}</p>

          <p className="text-slate-400 text-[10px]">{product.packing}</p>

        </button>



        <div className="flex items-center gap-1.5 mt-2">

          <p className="text-emerald-600 font-black text-base">₹{product.price}</p>

          <p className="text-slate-400 text-xs line-through">₹{product.mrp}</p>

          <span className="text-emerald-600 text-[10px] font-bold">{disc}%</span>

        </div>



        {/* Qty selector */}

        {product.inStock && (

          <div className="flex items-center justify-between mt-2 bg-slate-50 rounded-xl p-1">

            <button

              onClick={() => setQty(q => Math.max(1, q - 1))}

              className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-slate-700 font-bold text-sm shadow-sm"

            >−</button>

            <span className="text-slate-800 font-bold text-sm">{qty}</span>

            <button

              onClick={() => setQty(q => q + 1)}

              className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-slate-700 font-bold text-sm shadow-sm"

            >+</button>

          </div>

        )}



        {/* Action buttons */}

        {product.inStock ? (

          <div className="flex gap-1.5 mt-2">

            <button

              onClick={() => onAddToCart(product, qty)}

              className="flex-1 flex items-center justify-center gap-1 bg-emerald-500 text-white text-[11px] font-bold py-2 rounded-xl"

            >

              <ShoppingCart size={12} /> Cart

            </button>

            <button

              onClick={() => onAddToInquiry(product, qty)}

              className="flex-1 flex items-center justify-center gap-1 bg-slate-100 text-slate-600 text-[11px] font-bold py-2 rounded-xl"

            >

              <ClipboardList size={12} /> Inquire

            </button>

          </div>

        ) : (

          <div className="mt-2 py-2 text-center text-xs font-semibold text-slate-400 bg-slate-50 rounded-xl">

            Out of Stock

          </div>

        )}

      </div>

    </div>

  );

};



/* ── PAGE ── */

const ClientProductsPage = () => {

  const [search, setSearch] = useState('');

  const [category, setCategory] = useState('All');

  const [sortBy, setSortBy] = useState('Top Selling');

  const [tab, setTab] = useState('all'); // 'all' | 'near-expiry'

  const [showFilters, setShowFilters] = useState(false);

  const [cart, setCart] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);



  const addToCart = (product, qty) => {

    setCart(prev => {

      const exists = prev.find(i => i.id === product.id);

      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i);

      return [...prev, { ...product, qty }];

    });

  };



  const addToInquiry = (product, qty) => {

    // navigate to inquiry page with pre-filled item

  };



  const displayProducts = allProducts

    .filter(p => {

      if (tab === 'near-expiry') return p.nearExpiry;

      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||

        p.company.toLowerCase().includes(search.toLowerCase()) ||

        p.composition.toLowerCase().includes(search.toLowerCase());

      const matchCat = category === 'All' || p.category === category;

      return matchSearch && matchCat;

    })

    .sort((a, b) => {

      if (sortBy === 'Price: Low to High') return a.price - b.price;

      if (sortBy === 'Price: High to Low') return b.price - a.price;

      if (sortBy === 'Alphabetical') return a.name.localeCompare(b.name);

      return b.totalStock - a.totalStock; // top selling by proxy

    });



  return (

    <div className="max-w-2xl mx-auto">



      {/* Tab bar */}

      <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10">

        <button

          onClick={() => setTab('all')}

          className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${tab === 'all' ? 'text-emerald-600 border-emerald-500' : 'text-slate-400 border-transparent'}`}

        >

          All Products

        </button>

        <button

          onClick={() => setTab('near-expiry')}

          className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 flex items-center justify-center gap-1.5 ${tab === 'near-expiry' ? 'text-orange-600 border-orange-500' : 'text-slate-400 border-transparent'}`}

        >

          <Flame size={14} /> Near Expiry

        </button>

      </div>



      {/* Near expiry banner */}

      {tab === 'near-expiry' && (

        <div className="bg-linear-to-r from-orange-500 to-amber-500 px-4 py-3 flex items-center gap-3">

          <Flame size={20} className="text-white shrink-0" />

          <div>

            <p className="text-white font-bold text-sm">Short Expiry Special</p>

            <p className="text-white/90 text-xs">Get 10–20% extra off on near-expiry medicines</p>

          </div>

        </div>

      )}



      <div className="px-4 py-4 space-y-3">

        {/* Search */}

        {tab === 'all' && (

          <>

            <div className="flex gap-2">

              <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5">

                <Search size={15} className="text-slate-400 shrink-0" />

                <input

                  value={search}

                  onChange={e => setSearch(e.target.value)}

                  placeholder="Search medicines, company, composition…"

                  className="flex-1 text-sm text-slate-700 placeholder-slate-400 bg-transparent outline-none"

                />

                {search && <button onClick={() => setSearch('')}><X size={14} className="text-slate-400" /></button>}

              </div>

              <button

                onClick={() => setShowFilters(f => !f)}

                className={`px-3 py-2.5 rounded-xl border flex items-center gap-1 text-xs font-semibold transition-all ${showFilters ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}

              >

                <Filter size={15} />

              </button>

            </div>



            {showFilters && (

              <div className="space-y-2">

                {/* Categories */}

                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">

                  {categories.map(c => (

                    <button

                      key={c}

                      onClick={() => setCategory(c)}

                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${category === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}

                    >

                      {c}

                    </button>

                  ))}

                </div>

                {/* Sort */}

                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">

                  {sortOptions.map(s => (

                    <button

                      key={s}

                      onClick={() => setSortBy(s)}

                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${sortBy === s ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'}`}

                    >

                      {s}

                    </button>

                  ))}

                </div>

              </div>

            )}

          </>

        )}



        {/* Count */}

        <p className="text-slate-400 text-xs">{displayProducts.length} products</p>



        {/* Cart badge */}

        {cart.length > 0 && (

          <div className="bg-emerald-500 rounded-2xl px-4 py-3 flex items-center justify-between">

            <p className="text-white font-semibold text-sm">{cart.length} items in cart</p>

            <button className="bg-white text-emerald-600 font-bold text-xs px-3 py-1.5 rounded-xl">

              Checkout →

            </button>

          </div>

        )}



        {/* Grid */}

        <div className="grid grid-cols-2 gap-3">

          {displayProducts.map(p => (

            <ProductCard

              key={p.id}

              product={p}

              onView={setSelectedProduct}

              onAddToCart={addToCart}

              onAddToInquiry={addToInquiry}

            />

          ))}

        </div>



        {displayProducts.length === 0 && (

          <div className="text-center py-16 text-slate-400">

            <Package className="mx-auto mb-2" size={36} />

            <p className="text-sm">No products found</p>

          </div>

        )}

      </div>



      {/* Product drawer */}

      {selectedProduct && (

        <ProductDrawer

          product={selectedProduct}

          onClose={() => setSelectedProduct(null)}

          onAddToCart={addToCart}

          onAddToInquiry={addToInquiry}

        />

      )}

    </div>

  );

};



export default ClientProductsPage;