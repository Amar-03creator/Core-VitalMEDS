// customers/modals/AddCustomerModal/components/AddressFields.jsx

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman & Nicobar','Chandigarh','DNH & DD','Delhi','Jammu & Kashmir',
  'Ladakh','Lakshadweep','Puducherry',
];

export const AddressFields = ({ formData, handleChange, handleBlur, errors }) => (
  <>
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">Billing Address *</label>
      <textarea
        name="billingAddress"
        value={formData.billingAddress}
        onChange={handleChange}
        rows={2}
        placeholder="Street, area, landmark…"
        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400 resize-none"
      />
    </div>

    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">Shipping Address</label>
      <textarea
        name="shippingAddress"
        value={formData.shippingAddress}
        onChange={handleChange}
        rows={2}
        placeholder="Leave blank if same as billing"
        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400 resize-none"
      />
    </div>

    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className="text-base font-semibold text-slate-700 block mb-1">City *</label>
        <input
          name="city"
          value={formData.city}
          onChange={handleChange}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
        />
      </div>
      <div>
        <label className="text-base font-semibold text-slate-700 block mb-1">District *</label>
        <input
          name="district"
          value={formData.district}
          onChange={handleChange}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
        />
      </div>
      <div>
        <label className="text-base font-semibold text-slate-700 block mb-1">Pincode *</label>
        <input
          name="pincode"
          value={formData.pincode}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full bg-white border ${errors.pincode ? 'border-red-500' : 'border-slate-300'} rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400`}
        />
        {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-base font-semibold text-slate-700 block mb-1">State *</label>
        <select
          name="state"
          value={formData.state}
          onChange={handleChange}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
        >
          <option value="">Select state</option>
          {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="text-base font-semibold text-slate-700 block mb-1">Delivery Line</label>
        <input
          name="line"
          value={formData.line}
          onChange={handleChange}
          placeholder="e.g., Buxi Bazar Line"
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
        />
      </div>
    </div>
  </>
);
