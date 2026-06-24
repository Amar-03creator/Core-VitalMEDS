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
  <div className="space-y-2">
    <p className="font-bold text-slate-800 text-lg">Items Added ({items.length})</p>
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div
          key={item.id}
          draggable
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDragEnd={handleDragEnd}
          className={`relative bg-slate-50 rounded-xl p-3 pr-24 ${draggedIdx === idx ? 'opacity-50' : ''}`}
        >
          <button
            onClick={() => moveItemUp(idx)}
            className="absolute top-0 right-0 text-xs text-slate-500 hover:text-slate-900 flex items-center gap-0.5 px-1 py-0.5"
          >
            <ArrowUp size={14} /> Move Up
          </button>
          <div className="text-base space-y-1">
            <p className="font-bold text-slate-800">
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
              {purchaseType === 'normal' ? (
                <>
                  {' '}
                  | CGST: ₹{item.cgst.toFixed(2)} ({item.cgstRate}%) | SGST: ₹{item.sgst.toFixed(2)} (
                  {item.sgstRate}%)
                </>
              ) : (
                <>
                  {' '}
                  | IGST: ₹{item.igst.toFixed(2)} ({item.igstRate}%)
                </>
              )}
              <span className="ml-2 font-bold text-emerald-600">Total: ₹{item.lineTotal.toFixed(2)}</span>
            </p>
          </div>
          <div className="absolute right-2 top-8 flex flex-col items-center gap-1">
            <button onClick={() => removeItem(item.id)} className="text-red-500 p-1">
              <Trash2 size={22} />
            </button>
            <button onClick={() => handleEditItem(item)} className="text-blue-500 p-1">
              <Pencil size={22} />
            </button>
          </div>
          <button
            onClick={() => moveItemDown(idx)}
            className="absolute bottom-0 right-0 text-xs text-slate-500 hover:text-slate-900 flex items-center gap-0.5 px-1 py-0.5"
          >
            <ArrowDown size={14} /> Move Down
          </button>
        </div>
      ))}
    </div>
  </div>
);