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
  <div className="flex flex-col h-full pb-2">
    <div className="flex-1 flex flex-col space-y-5">
      {/* Client search */}
      <div className="relative">
        <label className="text-base font-semibold text-slate-700 block mb-2">Party / Client <span className="text-red-500">*</span></label>
        <input
          value={clientSearch}
          onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); if (!e.target.value) setSelectedClient(null); }}
          onFocus={() => setShowClientDropdown(true)}
          placeholder="Type client name or city..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-1.5 text-lg font-mono font-bold text-slate-800 outline-none focus:border-emerald-400"
        />
        {showClientDropdown && filteredClients.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-30 bg-white border border-slate-200 rounded-2xl mt-1 shadow-xl max-h-60 overflow-y-auto">
            {filteredClients.map(client => (
              <button
                key={client._id}
                onClick={() => handleSelectClient(client)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0"
              >
                <div>
                  <p className="text-slate-800 text-base font-medium">{client.establishmentName}</p>
                  <p className="text-slate-500 text-sm">{client.city}</p>
                </div>
                <span className="text-slate-400 text-xs">GST: {client.gstin}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedClient && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 space-y-1">
          {selectedClient.city && (
            <p className="text-emerald-700 text-md font-mono font-bold">City: {selectedClient.city}</p>
          )}
          {selectedClient.contacts?.[0]?.phone && (
            <p className="text-emerald-700 text-md font-mono font-bold">📞 {selectedClient.contacts[0].phone}</p>
          )}
          {selectedClient.gstin && (
            <p className="text-emerald-700 text-md font-mono font-bold">GSTIN: {selectedClient.gstin}</p>
          )}
          {[selectedClient.drugLicense20B, selectedClient.drugLicense21B].filter(Boolean).length > 0 && (
            <p className="text-emerald-700 text-md font-mono font-bold">
              Drug License: {[selectedClient.drugLicense20B, selectedClient.drugLicense21B].filter(Boolean).join(', ')}
            </p>
          )}
          {selectedClient.billingAddress && (
            <p className="text-emerald-700 text-md font-mono font-bold">Address: {selectedClient.billingAddress}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-base font-semibold text-slate-700 block mb-2">Bill Type</label>
          <div className="flex gap-3">
            {['Cash', 'Credit'].map(t => (
              <button key={t} onClick={() => setBillType(t)}
                className={`flex-1 py-2 rounded-xl text-base font-bold border transition-all ${billType === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>
                {t === 'Cash' ? '💵 Cash' : '📋 Credit'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-base font-semibold text-slate-700 block mb-2">Invoice Date</label>
          <input type="date" value={invoiceDate} disabled
            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-base text-slate-500 outline-none cursor-not-allowed" />
        </div>
      </div>

      <div>
        <label className="text-base font-semibold text-slate-700 block mb-2">Client GSTIN</label>
        <input value={gstin} disabled
          className="w-min bg-slate-100 border border-slate-200 rounded-xl px-4 py-1.5 text-lg font-mono text-slate-600 outline-none cursor-not-allowed" />
      </div>

      <button
        onClick={onNext}
        disabled={!canProceed1}
        className="w-full bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-2xl text-lg mt-auto"
      >
        Next: Add Items →
      </button>
    </div>
  </div>
);