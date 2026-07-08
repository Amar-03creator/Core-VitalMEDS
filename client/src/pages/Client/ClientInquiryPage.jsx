import { useState } from 'react';

import {

  Search, Plus, Trash2, AlertTriangle, Flame, Send,

  ShoppingBag, ChevronDown, Info, CheckCircle2, X

} from 'lucide-react';



/* ── DEMO DATA ── */

const medicineDatabase = [

  { id: 'PRD-001', name: 'Paracetamol 500mg', company: 'Cipla', packing: "10'S Strip", price: 13.20, mrp: 18.50, stock: 1240, nearExpiry: false, nearExpiryPrice: null },

  { id: 'PRD-002', name: 'Amoxicillin 250mg', company: 'Sun Pharma', packing: '10 Capsules', price: 62.00, mrp: 85.00, stock: 45, nearExpiry: false, nearExpiryPrice: null, lowStock: true },

  { id: 'PRD-003', name: 'Omeprazole 20mg', company: "Dr. Reddy's", packing: "10'S Capsule", price: 28.00, mrp: 38.00, stock: 0, nearExpiry: false, nearExpiryPrice: null },

  { id: 'PRD-004', name: 'Cetirizine 10mg', company: 'Mankind', packing: "10'S Strip", price: 19.50, mrp: 28.00, stock: 890, nearExpiry: false, nearExpiryPrice: null },

  { id: 'PRD-005', name: 'Metformin 500mg', company: 'USV', packing: "10'S Strip", price: 24.50, mrp: 32.00, stock: 234, nearExpiry: true, nearExpiryPrice: 14.00, nearExpiryDate: 'Aug 2025' },

  { id: 'PRD-006', name: 'Atorvastatin 10mg', company: 'Torrent', packing: "10'S Strip", price: 42.00, mrp: 55.00, stock: 560, nearExpiry: false, nearExpiryPrice: null },

  { id: 'PRD-007', name: 'Pantoprazole 40mg', company: 'Alkem', packing: "10'S Tablet", price: 34.50, mrp: 48.00, stock: 420, nearExpiry: true, nearExpiryPrice: 27.50, nearExpiryDate: 'Sep 2025' },

  { id: 'PRD-008', name: 'Glimepiride 2mg', company: 'Sanofi', packing: "10'S Tablet", price: 30.00, mrp: 42.00, stock: 180, nearExpiry: false, nearExpiryPrice: null },

  { id: 'PRD-009', name: 'Amlodipine 5mg', company: 'Cipla', packing: "10'S Strip", price: 18.00, mrp: 25.00, stock: 780, nearExpiry: false, nearExpiryPrice: null },

  { id: 'PRD-010', name: 'Losartan 50mg', company: 'Sun Pharma', packing: "10'S Strip", price: 22.00, mrp: 32.00, stock: 340, nearExpiry: false, nearExpiryPrice: null },

];



const OUTSTANDING = 45000;

const CREDIT_LIMIT = 150000;



/* ── SUCCESS MODAL ── */

const SuccessModal = ({ type, onClose }) => (

  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">

    <div className="bg-white rounded-3xl p-8 text-center w-full max-w-xs">

      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">

        <CheckCircle2 size={32} className="text-emerald-500" />

      </div>

      <h3 className="text-slate-900 font-bold text-lg">

        {type === 'inquiry' ? 'Inquiry Sent!' : 'Order Placed!'}

      </h3>

      <p className="text-slate-500 text-sm mt-2">

        {type === 'inquiry'

          ? "We've received your inquiry. The distributor will send a quote shortly."

          : "Your order has been placed. You'll be notified once it's confirmed."}

      </p>

      <button

        onClick={onClose}

        className="mt-6 w-full bg-emerald-500 text-white font-bold py-3 rounded-2xl"

      >

        Done

      </button>

    </div>

  </div>

);



/* ── PAGE ── */

const ClientInquiryPage = () => {

  const [searchQuery, setSearchQuery] = useState('');

  const [showDropdown, setShowDropdown] = useState(false);

  const [cartItems, setCartItems] = useState([]);

  const [billPref, setBillPref] = useState('Credit');

  const [notes, setNotes] = useState('');

  const [submitted, setSubmitted] = useState(null); // 'inquiry' | 'order' | null



  const filtered = searchQuery.length > 1

    ? medicineDatabase.filter(m =>

      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||

      m.company.toLowerCase().includes(searchQuery.toLowerCase())

    ).slice(0, 6)

    : [];



  const addItem = (med) => {

    setSearchQuery('');

    setShowDropdown(false);

    if (cartItems.find(i => i.id === med.id)) return;

    setCartItems(prev => [...prev, { ...med, qty: 10, useNearExpiry: false }]);

  };



  const updateQty = (id, delta) => {

    setCartItems(prev => prev.map(i =>

      i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i

    ));

  };



  const setQtyDirect = (id, val) => {

    const n = parseInt(val);

    if (!isNaN(n) && n > 0) setCartItems(prev => prev.map(i => i.id === id ? { ...i, qty: n } : i));

  };



  const toggleNearExpiry = (id) => {

    setCartItems(prev => prev.map(i => i.id === id ? { ...i, useNearExpiry: !i.useNearExpiry } : i));

  };



  const removeItem = (id) => setCartItems(prev => prev.filter(i => i.id !== id));



  const getPrice = (item) =>

    item.useNearExpiry && item.nearExpiryPrice ? item.nearExpiryPrice : item.price;



  const estimatedTotal = cartItems.reduce((s, i) => s + getPrice(i) * i.qty, 0);

  const nearCreditLimit = (OUTSTANDING + estimatedTotal) > CREDIT_LIMIT * 0.9;



  return (

    <div className="px-4 py-4 space-y-5 max-w-2xl mx-auto">



      {/* Header */}

      <div>

        <h1 className="text-slate-900 text-lg font-bold">New Order / Inquiry</h1>

        <p className="text-slate-500 text-xs">Add medicines and place an order or send an inquiry</p>

      </div>



      {/* ── ADD PRODUCT ── */}

      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">

        <p className="text-slate-700 font-semibold text-sm">Add Medicines</p>



        {/* Search input */}

        <div className="relative">

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">

            <Search size={15} className="text-slate-400 shrink-0" />

            <input

              value={searchQuery}

              onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}

              onFocus={() => setShowDropdown(true)}

              placeholder="Search medicine or composition…"

              className="flex-1 text-sm text-slate-800 placeholder-slate-400 bg-transparent outline-none"

            />

          </div>



          {/* Dropdown */}

          {showDropdown && filtered.length > 0 && (

            <div className="absolute top-full left-0 right-0 z-30 bg-white border border-slate-200 rounded-2xl mt-1 shadow-lg overflow-hidden">

              {filtered.map(med => (

                <button

                  key={med.id}

                  onClick={() => addItem(med)}

                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0"

                >

                  <div>

                    <p className="text-slate-800 text-sm font-medium">{med.name}</p>

                    <p className="text-slate-400 text-xs">{med.company} · {med.packing}</p>

                  </div>

                  <div className="text-right ml-3">

                    <p className="text-emerald-600 font-bold text-sm">₹{med.price}</p>

                    {med.stock === 0 && <p className="text-red-500 text-[10px]">Out of stock</p>}

                    {med.stock > 0 && med.stock <= 50 && <p className="text-amber-500 text-[10px]">Low stock</p>}

                    {med.nearExpiry && <p className="text-orange-500 text-[10px] font-semibold">Near expiry deal!</p>}

                  </div>

                </button>

              ))}

            </div>

          )}

        </div>

      </div>



      {/* ── REVIEW LIST ── */}

      {cartItems.length > 0 && (

        <div className="space-y-3">

          <p className="text-slate-700 font-semibold text-sm">Review Items ({cartItems.length})</p>



          {cartItems.map(item => {

            const price = getPrice(item);

            const lineTotal = price * item.qty;

            const isOverStock = item.qty > item.stock;



            return (

              <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">

                {/* Product info */}

                <div className="flex items-start justify-between gap-2">

                  <div className="flex-1 min-w-0">

                    <p className="text-slate-900 font-semibold text-sm">{item.name}</p>

                    <p className="text-slate-400 text-xs">{item.company} · {item.packing}</p>

                    <div className="flex gap-1.5 mt-1 flex-wrap">

                      {item.lowStock && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Low Stock</span>}

                      {item.nearExpiry && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">Near Expiry</span>}

                    </div>

                  </div>

                  <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-500 p-1 shrink-0">

                    <Trash2 size={16} />

                  </button>

                </div>



                {/* Near expiry toggle */}

                {item.nearExpiry && item.nearExpiryPrice && (

                  <button

                    onClick={() => toggleNearExpiry(item.id)}

                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${item.useNearExpiry ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}

                  >

                    <Flame size={14} className={item.useNearExpiry ? 'text-orange-500' : 'text-slate-400'} />

                    <span>

                      {item.useNearExpiry

                        ? `Using near-expiry batch @ ₹${item.nearExpiryPrice} (Exp: ${item.nearExpiryDate})`

                        : `Near-expiry batch available @ ₹${item.nearExpiryPrice} — tap to save more!`

                      }

                    </span>

                  </button>

                )}



                {/* Qty + price */}

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1">

                    <button

                      onClick={() => updateQty(item.id, -1)}

                      className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-700 font-bold shadow-sm"

                    >−</button>

                    <input

                      type="number"

                      value={item.qty}

                      onChange={e => setQtyDirect(item.id, e.target.value)}

                      className="w-12 text-center text-slate-900 font-bold text-sm bg-transparent outline-none"

                    />

                    <button

                      onClick={() => updateQty(item.id, 1)}

                      className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-700 font-bold shadow-sm"

                    >+</button>

                  </div>



                  <div className="text-right">

                    <p className="text-emerald-600 font-black text-base">₹{lineTotal.toFixed(0)}</p>

                    <p className="text-slate-400 text-xs">₹{price} × {item.qty}</p>

                  </div>

                </div>



                {/* Over-stock warning */}

                {isOverStock && (

                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">

                    <AlertTriangle size={13} className="text-amber-600 shrink-0" />

                    <p className="text-amber-700 text-xs">Qty exceeds available stock ({item.stock} units). May affect fulfillment.</p>

                  </div>

                )}



                {/* Disclaimer */}

                <p className="text-slate-400 text-[10px] flex items-center gap-1">

                  <Info size={10} className="shrink-0" />

                  Final price may vary ±5% based on actual batch dispatched.

                </p>

              </div>

            );

          })}

        </div>

      )}



      {/* ── SUMMARY ── */}

      {cartItems.length > 0 && (

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">

          <p className="text-slate-700 font-semibold text-sm">Order Summary</p>



          <div className="space-y-2">

            <div className="flex justify-between text-sm">

              <span className="text-slate-500">Total Products</span>

              <span className="text-slate-800 font-medium">{cartItems.length}</span>

            </div>

            <div className="flex justify-between text-sm">

              <span className="text-slate-500">Estimated Total</span>

              <span className="text-slate-800 font-bold">₹{estimatedTotal.toFixed(0)}</span>

            </div>

            <div className="flex justify-between text-sm">

              <span className="text-slate-500">Expected Delivery</span>

              <span className="text-slate-800">12–24 hours</span>

            </div>

          </div>



          {/* Outstanding warning */}

          {nearCreditLimit && (

            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex items-start gap-2">

              <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />

              <p className="text-red-700 text-xs font-medium">

                This order will bring you close to your credit limit. Outstanding: ₹{OUTSTANDING.toLocaleString()}

              </p>

            </div>

          )}



          {/* Bill preference */}

          <div>

            <p className="text-slate-600 text-xs font-semibold mb-2">Bill Preference</p>

            <div className="flex gap-2">

              {['Cash', 'Credit'].map(type => (

                <button

                  key={type}

                  onClick={() => setBillPref(type)}

                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all${billPref === type ? type === 'Cash' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200'

                    }`}

                >

                  {type === 'Cash' ? '💵 Cash Bill' : '🏦 Credit Bill'}

                </button>

              ))}

            </div>

            {billPref === 'Cash' && (

              <p className="text-emerald-600 text-xs font-medium mt-1.5">✓ Instant payment discount may apply</p>

            )}

          </div>



          {/* Notes */}

          <div>

            <p className="text-slate-600 text-xs font-semibold mb-2">Additional Notes</p>

            <textarea

              value={notes}

              onChange={e => setNotes(e.target.value)}

              rows={2}

              placeholder="Urgent delivery? Specific batch preference? Let us know…"

              className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 resize-none"

            />

          </div>



          {/* CTA buttons */}

          <div className="flex gap-2 pt-1">

            <button

              onClick={() => setSubmitted('order')}

              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-emerald-200"

            >

              <ShoppingBag size={18} /> Order Now

            </button>

            <button

              onClick={() => setSubmitted('inquiry')}

              className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-2xl text-sm"

            >

              <Send size={18} /> Send Inquiry

            </button>

          </div>

          <p className="text-slate-400 text-[10px] text-center">

            "Order Now" for direct placement · "Inquiry" for price negotiation

          </p>

        </div>

      )}



      {/* Empty state */}

      {cartItems.length === 0 && (

        <div className="text-center py-16 text-slate-400">

          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">

            <ShoppingBag size={28} className="text-slate-300" />

          </div>

          <p className="text-slate-600 font-semibold text-base">No items added</p>

          <p className="text-slate-400 text-sm mt-1">Search and add medicines above to get started</p>

        </div>

      )}



      {submitted && <SuccessModal type={submitted} onClose={() => setSubmitted(null)} />}

    </div>

  );

};



export default ClientInquiryPage;