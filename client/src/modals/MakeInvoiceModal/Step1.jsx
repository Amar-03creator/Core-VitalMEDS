// // src/modals/MakeInvoiceModal/Step1.jsx
// export const Step1 = ({
//   clientSearch, setClientSearch, showClientDropdown, setShowClientDropdown,
//   selectedClient, setSelectedClient, filteredClients, handleSelectClient,
//   billType, setBillType, invoiceDate, address, gstin, drugLicense, pan, aadhaar,
//   canProceed1, onNext, lockClient = false,
// }) => {
  
//   const hasBusinessId = !!(gstin || drugLicense);
//   const hasPersonalId = !!(pan || aadhaar);
//   const hasValidId = hasBusinessId || hasPersonalId;

//   return (
//     <div className="flex flex-col h-full pb-1">
//       <div className="flex-1 flex flex-col space-y-4">
//         {/* Client search */}
//         {lockClient && selectedClient ? (
//           <div>
//             <label className="text-base font-bold text-slate-700 block mb-1.5">Party / Client</label>
//             <input
//               value={selectedClient.establishmentName}
//               disabled
//               className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-lg font-bold text-slate-600 outline-none cursor-not-allowed"
//             />
//           </div>
//         ) : (
//           /* Editable search */
//           <div className="relative">
//             <label className="text-base font-bold text-slate-700 block mb-1.5">Party / Client <span className="text-red-500">*</span></label>
//             <input
//               value={clientSearch}
//               onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); if (!e.target.value) setSelectedClient(null); }}
//               onFocus={() => setShowClientDropdown(true)}
//               placeholder="Type client name or city..."
//               className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-lg font-bold text-slate-900 outline-none focus:border-emerald-500 shadow-sm"
//             />
//             {showClientDropdown && filteredClients.length > 0 && (
//               <div className="absolute top-full left-0 right-0 z-30 bg-white border border-slate-300 rounded-xl mt-1 shadow-2xl max-h-60 overflow-y-auto">
//                 {filteredClients.map(client => (
//                   <button
//                     key={client._id}
//                     onClick={() => handleSelectClient(client)}
//                     className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-100 border-b border-slate-200 last:border-0"
//                   >
//                     <div>
//                       <p className="text-slate-900 text-lg font-bold">{client.establishmentName}</p>
//                       <p className="text-slate-600 text-sm font-medium">{client.city}</p>
//                     </div>
//                     <span className="text-slate-500 text-xs font-bold bg-slate-100 px-2 py-1 rounded">GST: {client.gstin || 'N/A'}</span>
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}

//         {selectedClient && (
//           <div className="space-y-3">
//             {/* Contact & Address Box */}
//             <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 space-y-1 shadow-sm">
//               <p className="text-emerald-800 text-sm font-black border-b border-emerald-200/80 pb-1 mb-1.5 uppercase tracking-wider">Contact Details</p>
              
//               {selectedClient.city && (
//                 <p className="text-emerald-900 text-base"><span className="font-semibold text-emerald-700 mr-1">City:</span> <span className="font-bold">{selectedClient.city}</span></p>
//               )}
              
//               {selectedClient.contacts?.[0]?.phone && (
//                 <p className="text-emerald-900 text-base"><span className="font-semibold text-emerald-700 mr-1">Phone:</span> <span className="font-bold">{selectedClient.contacts[0].phone}</span></p>
//               )}
              
//               {address && (
//                 <p className="text-emerald-900 text-base leading-snug"><span className="font-semibold text-emerald-700 mr-1">Address:</span> <span className="font-bold">{address}</span></p>
//               )}
//             </div>

//             {/* Identifications Box with Fallback Logic */}
//             <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm space-y-1.5">
//               <p className="text-slate-800 text-sm font-black border-b border-slate-200 pb-1 mb-2 uppercase tracking-wider">Identifications</p>
              
//               {hasBusinessId ? (
//                 <div className="flex flex-col gap-1">
//                   {gstin && <p className="text-base font-mono font-bold text-slate-900"><span className="text-slate-600 font-semibold mr-2 font-sans">GSTIN:</span>{gstin}</p>}
//                   {drugLicense && <p className="text-base font-mono font-bold text-slate-900"><span className="text-slate-600 font-semibold mr-2 font-sans">D.L.:</span>{drugLicense}</p>}
//                 </div>
//               ) : hasPersonalId ? (
//                 <div className="flex flex-col gap-1">
//                   {pan && <p className="text-base font-mono font-bold text-slate-900"><span className="text-slate-600 font-semibold mr-2 font-sans">PAN:</span>{pan}</p>}
//                   {aadhaar && <p className="text-base font-mono font-bold text-slate-900"><span className="text-slate-600 font-semibold mr-2 font-sans">Aadhaar:</span>{aadhaar}</p>}
//                 </div>
//               ) : (
//                 <p className="text-base font-medium text-slate-500 italic">No identification records found.</p>
//               )}

//               {!hasValidId && (
//                 <div className="mt-3 text-red-700 bg-red-50 p-3 rounded-xl border border-red-200 text-center shadow-sm">
//                   <span className="block text-base font-black mb-0.5">⚠️ Missing Required ID!</span>
//                   <span className="font-semibold text-red-600 text-sm">Provide (GSTIN or D.L.) OR (PAN or Aadhaar).</span>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         <div className="grid grid-cols-2 gap-3 mt-1">
//           <div>
//             <label className="text-base font-bold text-slate-700 block mb-1.5">Bill Type</label>
//             <div className="flex gap-2">
//               {['Cash', 'Credit'].map(t => (
//                 <button key={t} onClick={() => setBillType(t)}
//                   className={`flex-1 py-2 rounded-xl text-base font-bold border-2 transition-all shadow-sm ${billType === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
//                   {t === 'Cash' ? '💵 Cash' : '📋 Credit'}
//                 </button>
//               ))}
//             </div>
//           </div>
//           <div>
//             <label className="text-base font-bold text-slate-700 block mb-1.5">Invoice Date</label>
//             <input type="date" value={invoiceDate} disabled
//               className="w-full bg-slate-100 border-2 border-slate-200 rounded-xl px-3 py-2 text-base font-semibold text-slate-500 outline-none cursor-not-allowed shadow-sm" />
//           </div>
//         </div>

//         <button
//           onClick={onNext}
//           disabled={!canProceed1}
//           className="w-full mt-auto bg-slate-900 disabled:bg-slate-300 disabled:text-slate-500 text-white font-black py-3 rounded-2xl text-lg shadow-md hover:bg-slate-800 transition-colors active:scale-[0.98]"
//         >
//           Next: Add Items →
//         </button>
//       </div>
//     </div>
//   );
// };

// src/modals/MakeInvoiceModal/Step1.jsx
export const Step1 = ({
  clientSearch, setClientSearch, showClientDropdown, setShowClientDropdown,
  selectedClient, setSelectedClient, filteredClients, handleSelectClient,
  billType, setBillType, invoiceDate, address, gstin, drugLicense, pan, aadhaar,
  canProceed1, onNext, lockClient = false, prefBillType
}) => {
  
  const hasBusinessId = !!(gstin || drugLicense);
  const hasPersonalId = !!(pan || aadhaar);
  const hasValidId = hasBusinessId || hasPersonalId;

  return (
    <div className="flex flex-col h-full pb-1">
      <div className="flex-1 flex flex-col space-y-4">
        {/* Client search */}
        {lockClient && selectedClient ? (
          <div>
            <label className="text-base font-bold text-slate-700 block mb-1.5">Party / Client</label>
            <input
              value={selectedClient.establishmentName}
              disabled
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-lg font-bold text-slate-600 outline-none cursor-not-allowed"
            />
          </div>
        ) : (
          /* Editable search */
          <div className="relative">
            <label className="text-base font-bold text-slate-700 block mb-1.5">Party / Client <span className="text-red-500">*</span></label>
            <input
              value={clientSearch}
              onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); if (!e.target.value) setSelectedClient(null); }}
              onFocus={() => setShowClientDropdown(true)}
              placeholder="Type client name or city..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-lg font-bold text-slate-900 outline-none focus:border-emerald-500 shadow-sm"
            />
            {showClientDropdown && filteredClients.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 bg-white border border-slate-300 rounded-xl mt-1 shadow-2xl max-h-60 overflow-y-auto">
                {filteredClients.map(client => (
                  <button
                    key={client._id}
                    onClick={() => handleSelectClient(client)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-100 border-b border-slate-200 last:border-0"
                  >
                    <div>
                      <p className="text-slate-900 text-lg font-bold">{client.establishmentName}</p>
                      <p className="text-slate-600 text-sm font-medium">{client.city}</p>
                    </div>
                    <span className="text-slate-500 text-xs font-bold bg-slate-100 px-2 py-1 rounded">GST: {client.gstin || 'N/A'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedClient && (
          <div className="space-y-3">
            {/* Contact & Address Box */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 space-y-1 shadow-sm">
              <p className="text-emerald-800 text-base font-black border-b border-emerald-200/80 pb-1 mb-1.5 uppercase tracking-wider">Contact Details</p>
              
              {selectedClient.city && (
                <p className="text-emerald-900 text-base"><span className="font-semibold text-emerald-700 mr-1">City:</span> <span className="font-bold">{selectedClient.city}</span></p>
              )}
              
              {selectedClient.contacts?.[0]?.phone && (
                <p className="text-emerald-900 text-base"><span className="font-semibold text-emerald-700 mr-1">Phone:</span> <span className="font-bold">{selectedClient.contacts[0].phone}</span></p>
              )}
              
              {address && (
                <p className="text-emerald-900 text-base leading-snug"><span className="font-semibold text-emerald-700 mr-1">Address:</span> <span className="font-bold">{address}</span></p>
              )}
            </div>

            {/* Identifications Box with Fallback Logic */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm space-y-1.5">
              <p className="text-slate-800 text-base font-black border-b border-slate-200 pb-1 mb-2 uppercase tracking-wider">Identifications</p>
              
              {hasBusinessId ? (
                <div className="flex flex-col gap-1">
                  {gstin && <p className="text-base font-mono font-bold text-slate-900"><span className="text-slate-600 font-semibold mr-2 font-sans">GSTIN:</span>{gstin}</p>}
                  {drugLicense && <p className="text-base font-mono font-bold text-slate-900"><span className="text-slate-600 font-semibold mr-2 font-sans">D.L.:</span>{drugLicense}</p>}
                </div>
              ) : hasPersonalId ? (
                <div className="flex flex-col gap-1">
                  {pan && <p className="text-base font-mono font-bold text-slate-900"><span className="text-slate-600 font-semibold mr-2 font-sans">PAN:</span>{pan}</p>}
                  {aadhaar && <p className="text-base font-mono font-bold text-slate-900"><span className="text-slate-600 font-semibold mr-2 font-sans">Aadhaar:</span>{aadhaar}</p>}
                </div>
              ) : (
                <p className="text-base font-medium text-slate-500 italic">No identification records found.</p>
              )}

              {!hasValidId && (
                <div className="mt-3 text-red-700 bg-red-50 p-3 rounded-xl border border-red-200 text-center shadow-sm">
                  <span className="block text-base font-black mb-0.5">⚠️ Missing Required ID!</span>
                  <span className="font-semibold text-red-600 text-sm">Provide (GSTIN or D.L.) OR (PAN or Aadhaar).</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-1">
          <div>
            <label className="text-base font-bold text-slate-700 block mb-1.5 flex items-center">
              Bill Type 
              {prefBillType && <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-bold tracking-wide shadow-sm">Pref: {prefBillType}</span>}
            </label>
            <div className="flex gap-2">
              {['Cash', 'Credit'].map(t => (
                <button key={t} onClick={() => setBillType(t)}
                  className={`flex-1 py-2 rounded-xl text-base font-bold border-2 transition-all shadow-sm ${billType === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                  {t === 'Cash' ? '💵 Cash' : '📋 Credit'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-base font-bold text-slate-700 block mb-1.5">Invoice Date</label>
            <input type="date" value={invoiceDate} disabled
              className="w-full bg-slate-100 border-2 border-slate-200 rounded-xl px-3 py-2 text-base font-semibold text-slate-500 outline-none cursor-not-allowed shadow-sm" />
          </div>
        </div>

        <button
          onClick={onNext}
          disabled={!canProceed1}
          className="w-full mt-auto bg-slate-900 disabled:bg-slate-300 disabled:text-slate-500 text-white font-black py-3 rounded-2xl text-lg shadow-md hover:bg-slate-800 transition-colors active:scale-[0.98]"
        >
          Next: Add Items →
        </button>
      </div>
    </div>
  );
};