// AddPurchaseBillModal/components/ItemList.jsx
import { Trash2, Pencil, ArrowUp, ArrowDown } from 'lucide-react';
import { formatDate } from '../../AddPurchaseBillModal/useProductItems';

export const ItemList = ({
  items,
  purchaseType,
  moveItemUp,
  moveItemDown,
  handleEditItem,
  removeItem,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  draggedIdx,
}) => (
  <div className="space-y-2 md:space-y-3">
    <p className="font-bold text-slate-800 text-lg">Items Added ({items.length})</p>
    <div className="space-y-2 md:space-y-3">
      {items.map((item, idx) => (
        <div
          key={item.id}
          draggable
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDragEnd={handleDragEnd}
          className={`relative bg-slate-50 border border-slate-200 rounded-xl p-3 md:p-4 pr-16 md:pr-16 shadow-sm transition-all ${draggedIdx === idx ? 'opacity-50 md:border-emerald-400 md:bg-emerald-50/30' : ''}`}
        >
          {/* Universal Move Up Button */}
          <button
            onClick={() => moveItemUp(idx)}
            disabled={idx === 0}
            className="absolute top-1 right-1 md:right-2 text-xs md:text-sm font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 flex items-center gap-0.5 px-1 py-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUp size={14} /> <span className="hidden md:inline">Up</span><span className="md:hidden">Move Up</span>
          </button>

          {/* ✨ MOBILE VIEW (Classic text-stack) */}
          <div className="md:hidden text-base space-y-1 mt-3">
            <p className="font-bold text-slate-800 pr-4">
              {item.slNo}. {item.productName} (HSN {item.hsn})
            </p>
            <p className="text-slate-600">Batch: {item.batchNumber} | Exp: {formatDate(item.expiryDate)}</p>
            <p className="text-slate-600">
              Qty: {item.chargeableQty}
              {item.freeQty > 0 && ` + ${item.freeQty} free`} | Rate: ₹{item.purchaseRate}
              {item.discountValue > 0 && (
                <>
                  {' '}
                  | Disc:{' '}
                  {item.discountType === 'percent'
                    ? `${item.discountValue}%`
                    : `₹${item.discountValue}`}
                </>
              )}
              {purchaseType === 'intrastate' ? (
                <>
                  {' '}
                  | CGST: ₹{(item.cgst || 0).toFixed(2)} ({item.cgstRate}%) | SGST: ₹{(item.sgst || 0).toFixed(2)} (
                  {item.sgstRate}%)
                </>
              ) : (
                <>
                  {' '}
                  | IGST: ₹{(item.igst || 0).toFixed(2)} ({item.igstRate}%)
                </>
              )}
              <span className="ml-2 font-bold text-emerald-600">Total: ₹{(item.lineTotal || 0).toFixed(2)}</span>
            </p>
          </div>

          {/* ✨ LAPTOP VIEW (Clean layout) */}
          <div className="hidden md:block text-base space-y-2 mt-0">
            <p className="font-black text-slate-800 text-lg">
              {item.slNo}. {item.productName} <span className="text-sm font-semibold text-slate-500 ml-1 bg-slate-200/60 px-1.5 py-0.5 rounded">HSN {item.hsn}</span>
            </p>
            
            <p className="text-slate-600 font-medium flex items-center gap-2">
              <span className="text-slate-500">Batch:</span> <span className="text-slate-800 font-bold bg-white border border-slate-200 px-1.5 py-0.5 rounded">{item.batchNumber}</span> 
              <span className="text-slate-300">|</span> 
              <span className="text-slate-500">Exp:</span> <span className="text-slate-800 font-bold">{formatDate(item.expiryDate)}</span>
            </p>
            
            <p className="text-slate-600 leading-relaxed text-sm">
              <span className="font-semibold text-slate-800">Qty: {item.chargeableQty}</span>
              {item.freeQty > 0 && <span className="text-emerald-600 font-bold tracking-wide"> + {item.freeQty} FREE</span>} 
              
              <span className="text-slate-300 mx-2">|</span> 
              Rate: ₹{item.purchaseRate}
              
              {item.discountValue > 0 && (
                <>
                  <span className="text-slate-300 mx-2">|</span>
                  Disc: <span className="text-amber-600 font-bold">
                    {item.discountType === 'percent'
                      ? `${item.discountValue}%`
                      : `₹${item.discountValue}`}
                  </span>
                </>
              )}
              
              {purchaseType === 'intrastate' ? (
                <>
                  <span className="text-slate-300 mx-2">|</span>
                  CGST: ₹{(item.cgst || 0).toFixed(2)} ({item.cgstRate}%) 
                  <span className="text-slate-300 mx-2">|</span>
                  SGST: ₹{(item.sgst || 0).toFixed(2)} ({item.sgstRate}%)
                </>
              ) : (
                <>
                  <span className="text-slate-300 mx-2">|</span>
                  IGST: ₹{(item.igst || 0).toFixed(2)} ({item.igstRate}%)
                </>
              )}
              
              <span className="inline-block ml-3 px-2.5 py-1 bg-emerald-100 text-emerald-800 font-black rounded-lg border border-emerald-200 shadow-sm text-base">
                Total: ₹{(item.lineTotal || 0).toFixed(2)}
              </span>
            </p>
          </div>

          {/* Universal Action Buttons */}
          <div className="absolute right-2 md:right-3 top-8 md:top-1/2 md:-translate-y-1/2 flex flex-col items-center gap-1 md:gap-2">
            <button onClick={() => removeItem(item.id)} className="text-red-500 md:text-slate-400 md:hover:text-red-500 p-1 md:p-2 md:bg-white md:border md:border-slate-200 md:hover:border-red-200 rounded-lg transition-colors md:shadow-sm" title="Remove Item">
              <Trash2 size={25} className="md:w-4 md:h-4" />
            </button>
            <button onClick={() => handleEditItem(item)} className="text-blue-500 md:text-slate-400 md:hover:text-blue-500 p-1 md:p-2 md:bg-white md:border md:border-slate-200 md:hover:border-blue-200 rounded-lg transition-colors md:shadow-sm" title="Edit Item">
              <Pencil size={25} className="md:w-4 md:h-4" />
            </button>
          </div>

          {/* Universal Move Down Button */}
          <button
            onClick={() => moveItemDown(idx)}
            disabled={idx === items.length - 1}
            className="absolute bottom-1 right-1 md:right-2 text-xs md:text-sm font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 flex items-center gap-0.5 px-1 py-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDown size={14} /> <span className="hidden md:inline">Down</span><span className="md:hidden">Move Down</span>
          </button>
        </div>
      ))}
    </div>
  </div>
);