// customers/modals/AddCustomerModal/CustomerReviewStep.jsx

const Row = ({ label, value }) => (
  <p><strong>{label}:</strong> {value || '—'}</p>
);

export const CustomerReviewStep = ({ formData, onEdit, onSave }) => {
  const primary = formData.contacts?.find(c => c.isPrimary) || formData.contacts?.[0];

  return (
    <>
      <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-base">
        <Row label="Establishment"   value={formData.establishmentName} />
        <Row label="Business Type"   value={formData.businessType} />
        <Row label="Status"          value={formData.status} />
        <Row label="GSTIN"           value={formData.gstin} />
        <Row label="PAN"             value={formData.pan} />
        <Row label="Drug License 20B" value={formData.drugLicense20B} />
        <Row label="Drug License 21B" value={formData.drugLicense21B} />
        <Row label="Aadhaar"         value={formData.aadhaar} />
        <Row label="Address"         value={formData.billingAddress} />
        <Row label="City / District" value={`${formData.city || '—'} / ${formData.district || '—'}`} />
        <Row label="State / Pincode" value={`${formData.state || '—'} / ${formData.pincode || '—'}`} />
        <Row label="Delivery Line"   value={formData.line} />
        <Row label="Credit Limit"    value={formData.creditLimit ? `₹${Number(formData.creditLimit).toLocaleString('en-IN')}` : null} />
        <Row label="Payment Terms"   value={formData.paymentTermsDays ? `${formData.paymentTermsDays} days` : null} />
        <Row label="Default Discount" value={formData.defaultDiscountPercent ? `${formData.defaultDiscountPercent}%` : null} />

        {formData.contacts?.length > 0 && (
          <>
            <p className="font-semibold mt-2">Contacts:</p>
            <ul className="list-disc pl-5 space-y-1">
              {formData.contacts.map((c, i) => (
                <li key={i}>
                  {c.name} ({c.designation}){c.isPrimary ? ' — Primary' : ''}{c.phone ? ` · ${c.phone}` : ''}{c.email ? ` · ${c.email}` : ''}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* <div className="flex gap-3 mt-4">
        <button
          onClick={onEdit}
          className="flex-1 bg-slate-100 py-3 rounded-xl font-semibold text-base"
        >
          Edit
        </button>
        <button
          onClick={onSave}
          className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-xl text-base"
        >
          Save Customer
        </button>
      </div> */}
    </>
  );
};
