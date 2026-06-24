export const ReviewStep = ({ formData, onEdit, onSave }) => (
  <>
    <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-base">
      <p><strong>Supplier:</strong> {formData.supplierName}</p>
      <p><strong>Short Code:</strong> {formData.shortCode || '—'}</p>
      <p><strong>Status:</strong> {formData.status}</p>
      <p><strong>GSTIN:</strong> {formData.gstin || '—'}</p>
      <p><strong>PAN:</strong> {formData.pan || '—'}</p>
      <p><strong>Drug Licenses:</strong> {formData.drugLicenses.filter(l => l.trim()).join(', ') || '—'}</p>
      <p><strong>License Expiry:</strong> {formData.drugLicenseExpiry ? formData.drugLicenseExpiry.split('-').reverse().join('/') : '—'}</p>
      <p><strong>Address:</strong> {formData.billingAddress || '—'}</p>
      <p><strong>City/State/Pincode:</strong> {formData.city || '—'} / {formData.state || '—'} / {formData.pincode || '—'}</p>
      <p><strong>Email:</strong> {formData.email || '—'}</p>
      <p><strong>WhatsApp No.:</strong> {formData.whatsapp || '—'}</p>
      <p><strong>Aadhaar:</strong> {formData.aadhaar || '—'}</p>
      <p><strong>DrugsBazaar ID:</strong> {formData.drugsBazaarId || '—'}</p>
      <p><strong>Lead Time:</strong> {formData.leadTimeDays || '—'} days</p>
      <p><strong>Min Order Value:</strong> {formData.minimumOrderValue ? `₹${formData.minimumOrderValue}` : '—'}</p>

      <p><strong>Representatives:</strong></p>
      <ul className="list-disc pl-5">
        {formData.representatives.map((r, i) => (
          <li key={i}>{r.name} {r.role && `(${r.role})`} — {r.phone} / {r.email}</li>
        ))}
      </ul>

      {/* ★ Bank Details */}
      {formData.bankDetails.filter(b => b.bankName && b.accountNumber && b.ifscCode && b.branch).length > 0 && (
        <>
          <p className="mt-2"><strong>Bank Details:</strong></p>
          {formData.bankDetails.map((b, i) =>
            b.bankName ? (
              <div key={i} className="pl-5 text-sm text-slate-700">
                {b.bankName} — A/c {b.accountNumber}, IFSC {b.ifscCode}, Branch: {b.branch}
              </div>
            ) : null
          )}
        </>
      )}
    </div>

    <div className="flex gap-3 mt-4">
      <button onClick={onEdit} className="flex-1 bg-slate-100 py-3 rounded-xl font-semibold text-base">Edit</button>
      <button onClick={onSave} className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-xl text-base">Save Supplier</button>
    </div>
  </>
);