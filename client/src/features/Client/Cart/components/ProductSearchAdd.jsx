// src/features/Client/Cart/components/ProductSearchAdd.jsx
import { useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner'; // ✨ Added toast import

const ProductSearchAdd = ({ products, onAdd }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = query.length > 1
    ? products
        .filter((p) => 
          p.name.toLowerCase().includes(query.toLowerCase()) || 
          p.company.toLowerCase().includes(query.toLowerCase()) ||
          (p.companyShortCode && p.companyShortCode.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 6)
    : [];

  const handleAdd = (product) => {
    // ✨ FIX: Intercept the click if there is no stock
    if (!product.totalStock || product.totalStock <= 0) {
      toast.error(`${product.name} is currently out of stock and cannot be added.`);
      return; // Stop execution!
    }

    onAdd(product);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-6 space-y-4">
      <p className="text-slate-900 font-bold text-lg sm:text-xl">Search & Add Medicines</p>

      <div className="relative">
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 sm:py-4">
          <Search size={22} className="text-slate-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search by name or company"
            className="flex-1 text-base sm:text-lg font-bold text-slate-800 placeholder-slate-400 bg-transparent outline-none"
          />
        </div>

        {open && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-30 bg-white border border-slate-200 rounded-2xl mt-2 shadow-xl overflow-hidden">
            {filtered.map((p) => {
              const shortCode = p.companyShortCode || p.companyDetails?.[0]?.shortCode || p.company;
              const hasOffer = !!p.offer;
              const isOutOfStock = !p.totalStock || p.totalStock <= 0; // Check stock

              return (
                <button
                  key={p.productId}
                  onClick={() => handleAdd(p)}
                  className={`w-full flex items-center justify-between px-5 py-4 text-left border-b border-slate-100 last:border-b-0 transition-colors ${
                    isOutOfStock ? 'hover:bg-red-50/50 cursor-not-allowed' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={isOutOfStock ? 'opacity-60' : ''}>
                    <p className="text-slate-900 font-bold text-lg sm:text-xl">{p.name}</p>
                    <p className="text-slate-500 font-bold text-sm sm:text-base mt-1">
                      {shortCode} • {p.packing}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    {hasOffer && !isOutOfStock && (
                      <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1.5 rounded-lg shrink-0">
                        ON OFFER
                      </span>
                    )}
                    <div className="text-right ml-2">
                      <p className={`font-black text-xl ${isOutOfStock ? 'text-slate-400' : 'text-slate-900'}`}>
                        ₹{p.mrp.toFixed(2)}
                      </p>
                      {isOutOfStock && <p className="text-red-500 text-sm font-bold mt-0.5">Out of stock</p>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSearchAdd;