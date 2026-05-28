// components/Admin/BillingPage/modals/MakeInvoiceModal/Step1.jsx
import { CLIENT_MASTER } from '../../utils/constants';

export const Step1 = ({
  clientSearch,
  setClientSearch,
  showClientDropdown,
  setShowClientDropdown,
  selectedClient,
  setSelectedClient,
  filteredClients,
  handleSelectClient,
  billType,
  setBillType,
  invoiceDate,
  gstin,
  address,
  drugLicense,
  canProceed1,
  onNext
}) => (
  <div className="space-y-4">
    {/* Client search */}
    <div className="relative">
      <label className="text-sm text-slate-600 block mb-1.5 font-semibold">Party / Client <span className="text-red-500">*</span></label>
      <input
        value={clientSearch}
        onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); if (!e.target.value) setSelectedClient(null); }}
        onFocus={() => setShowClientDropdown(true)}
        placeholder="Type client name or city..."
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
      />
      {showClientDropdown && filteredClients.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-30 bg-white border border-slate-200 rounded-2xl mt-1 shadow-xl max-h-60 overflow-y-auto">
          {filteredClients.map(c => {
            const clientData = CLIENT_MASTER[c];
            return (
              <button key={c} onClick={() => handleSelectClient(c)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0">
                <div><p className="text-slate-800 text-base font-medium">{c}</p><p className="text-slate-500 text-sm">{clientData.city} · {clientData.line}</p></div>
                <span className="text-slate-400 text-xs">GST: {clientData.gstin}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>

    {selectedClient && (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 space-y-1.5">
        <p className="text-emerald-800 text-sm font-semibold">{selectedClient.name}</p>
        <p className="text-emerald-700 text-sm">Line: {selectedClient.line} · City: {selectedClient.city}</p>
        <p className="text-emerald-700 text-sm">📞 {selectedClient.phone}</p>
        <p className="text-emerald-700 text-sm">GSTIN: {selectedClient.gstin}</p>
        <p className="text-emerald-700 text-sm">Drug License: {selectedClient.drugLicense}</p>
        <p className="text-emerald-700 text-sm">Address: {selectedClient.address}</p>
      </div>
    )}

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-sm text-slate-600 block mb-1.5 font-semibold">Bill Type</label>
        <div className="flex gap-2">
          {['Cash', 'Credit'].map(t => (
            <button key={t} onClick={() => setBillType(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${billType === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>
              {t === 'Cash' ? '💵 Cash' : '📋 Credit'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm text-slate-600 block mb-1.5 font-semibold">Invoice Date</label>
        <input type="date" value={invoiceDate} disabled className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-500 outline-none cursor-not-allowed" />
      </div>
    </div>

    <div><label className="text-sm text-slate-600 block mb-1.5 font-semibold">Client GSTIN</label><input value={gstin} disabled className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono text-slate-600 outline-none cursor-not-allowed" /></div>
    <div><label className="text-sm text-slate-600 block mb-1.5 font-semibold">Client Address</label><textarea value={address} disabled rows={2} className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 outline-none resize-none cursor-not-allowed" /></div>

    <button onClick={onNext} disabled={!canProceed1} className="w-full bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 rounded-2xl text-base">
      Next: Add Items →
    </button>
  </div>
);