import { useState, useEffect } from 'react';
import { ChevronDown, Edit3 } from 'lucide-react';
import { BaseProductCard } from '../../../../components/BaseProductCard'; // <-- Make sure path is correct!

export const InventoryCard = ({ product, onEditPTR }) => {
  const [expanded, setExpanded] = useState(false);
  const [batchExpanded, setBatchExpanded] = useState(null);

  useEffect(() => {
    if (!expanded) setBatchExpanded(null);
  }, [expanded]);

  const getExpiryColors = (dateString) => {
    if (!dateString) return 'text-slate-600 bg-slate-50 border-slate-200';
    const days = (new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24);
    if (days < 30) return 'text-red-700 bg-red-100 border-red-200';
    if (days < 60) return 'text-orange-700 bg-orange-100 border-orange-200';
    if (days < 90) return 'text-amber-700 bg-amber-100 border-amber-200';
    return 'text-emerald-700 bg-emerald-100 border-emerald-200';
  };

  const batches = product.batches || [];
  const hasNearExpiry = batches.some(b => b.nearExpiry);

  return (
    <BaseProductCard 
      product={product} 
      expanded={expanded} 
      onToggle={() => setExpanded(!expanded)}
      hasNearExpiry={hasNearExpiry}
    >
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? 'max-h-500 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-slate-100 px-3 py-3 bg-slate-50 space-y-2">
          <p className="text-md md:text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
            Active Batches ({batches.length})
          </p>

          {batches.length === 0 ? (
            <p className="text-slate-400 text-md text-center py-4 bg-white rounded-xl border border-dashed border-slate-300">
              No active batches. Add a purchase bill.
            </p>
          ) : (
            batches.map((batch, bi) => {
              const formattedExpiry = batch.expiryDate 
                ? new Date(batch.expiryDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) 
                : 'N/A';

              return (
                <div 
                  key={batch._id || bi} 
                  className={`rounded-xl border overflow-hidden transition-all shadow-sm ${
                    batch.nearExpiry ? 'border-orange-200 bg-orange-50/50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <button 
                    onClick={() => setBatchExpanded(batchExpanded === bi ? null : bi)} 
                    className="w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-800 font-mono text-sm md:text-base font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Batch: {batch.batchNumber}
                      </span>
                      <span className={`text-sm md:text-xs font-mono px-1 py-0.5 rounded border ${getExpiryColors(batch.expiryDate)}`}>
                        Exp: {formattedExpiry}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-slate-900 font-bold text-sm bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {batch.totalStockQuantity || 0}
                      </span>
                      <div className={`transition-transform duration-300 ${batchExpanded === bi ? 'rotate-180' : ''}`}>
                        <ChevronDown size={14} className="text-slate-400" />
                      </div>
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      batchExpanded === bi ? 'max-h-200 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-2 pb-2 space-y-3 border-t border-slate-100 pt-2 bg-slate-50/30">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white rounded-lg px-1.5 py-1.5 text-center border border-slate-200 shadow-sm">
                          <p className="text-slate-800 text-lg font-bold">₹{batch.mrp}</p>
                          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">MRP</p>
                        </div>
                        <div className="bg-white rounded-lg px-1.5 py-1.5 text-center border border-emerald-200 shadow-sm relative group">
                          <p className="text-emerald-700 text-lg font-bold">₹{batch.sellingRate}</p>
                          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">PTR</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); onEditPTR(batch); }}
                            className="absolute -top-2 -right-2 bg-slate-900 text-white p-1 rounded-full shadow-md hover:bg-slate-700 transition-colors duration-200"
                            title="Edit PTR"
                          >
                            <Edit3 size={18} />
                          </button>
                        </div>
                        <div className="bg-white rounded-lg px-1.5 py-1.5 text-center border border-slate-200 shadow-sm">
                          <p className="text-slate-800 text-lg font-bold">₹{batch.purchaseRate}</p>
                          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Cost</p>
                        </div>
                      </div>

                      <div className="py-1">
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          FIFO Purchase Lots
                          <span className="text-slate-400 font-normal normal-case tracking-widest">(Source Bills)</span>
                        </p>
                        <div className="space-y-1.5">
                          {batch.purchaseLots?.length > 0 ? (
                            batch.purchaseLots.map((lot, li) => (
                              <div 
                                key={lot._id || li} 
                                className="flex items-center justify-between bg-yellow-100 rounded-lg px-3 py-2 border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md"
                              >
                                <div>
                                  <p className=" text-md md:text-base font-mono font-bold text-blue-600">
                                    Bill No. - {lot.invoiceNumber}
                                  </p>
                                  <p className="text-slate-400 text-md font-medium">
                                    {new Date(lot.dateReceived).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-slate-800 text-md md:text-base font-black">
                                    {lot.remainingQty}{' '}
                                    <span className="text-slate-400 text-md md:text-xs font-normal">
                                      / {lot.originalQty}
                                    </span>
                                  </p>
                                  <p className="text-slate-400 text-sm font-medium">remaining</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic py-1">No lot data available.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </BaseProductCard>
  );
};