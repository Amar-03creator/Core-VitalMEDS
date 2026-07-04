// customers/modals/AddCustomerModal/components/ContactsList.jsx
import { Trash2 } from 'lucide-react';

const DESIGNATIONS = ['Owner', 'Proprietor', 'Manager', 'Partner', 'Staff'];

const ContactCard = ({ contact, index, onChange, onRemove, onSetPrimary, errors }) => (
  <div className="border border-slate-300 rounded-xl p-3 mt-2 space-y-2">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-700">Contact {index + 1}</span>
        {contact.isPrimary && (
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
            Primary
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {!contact.isPrimary && (
          <button
            type="button"
            onClick={() => onSetPrimary(index)}
            className="text-xs text-emerald-600 font-semibold"
          >
            Set primary
          </button>
        )}
        <button type="button" onClick={() => onRemove(index)}>
          <Trash2 size={14} className="text-red-400" />
        </button>
      </div>
    </div>

    <input
      placeholder="Name *"
      value={contact.name}
      onChange={e => onChange(index, 'name', e.target.value)}
      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400"
    />

    <div className="grid grid-cols-2 gap-2">
      <select
        value={contact.designation}
        onChange={e => onChange(index, 'designation', e.target.value)}
        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400"
      >
        {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
      </select>
      <input
        placeholder="Phone"
        value={contact.phone}
        onChange={e => onChange(index, 'phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
        className={`w-full bg-white border ${errors?.[`contact_phone_${index}`] ? 'border-red-500' : 'border-slate-300'} rounded-lg px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400`}
      />
    </div>

    <div className="grid grid-cols-2 gap-2">
      <input
        placeholder="Email"
        value={contact.email}
        onChange={e => onChange(index, 'email', e.target.value.toLowerCase())}
        className={`w-full bg-white border ${errors?.[`contact_email_${index}`] ? 'border-red-500' : 'border-slate-300'} rounded-lg px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400`}
      />
      <label className="flex items-center gap-2 text-sm text-slate-600 px-1">
        <input
          type="checkbox"
          checked={contact.prefersWhatsApp}
          onChange={e => onChange(index, 'prefersWhatsApp', e.target.checked)}
          className="accent-emerald-500"
        />
        WhatsApp
      </label>
    </div>

    {errors?.[`contact_phone_${index}`] && (
      <p className="text-red-500 text-xs">{errors[`contact_phone_${index}`]}</p>
    )}
    {errors?.[`contact_email_${index}`] && (
      <p className="text-red-500 text-xs">{errors[`contact_email_${index}`]}</p>
    )}
  </div>
);

const initialContact = () => ({
  name: '', designation: 'Owner', phone: '', email: '',
  isPrimary: false, prefersWhatsApp: true,
});

export const ContactsList = ({ formData, setFormData, errors }) => {
  const contacts = formData.contacts || [];

  const handleChange = (index, field, value) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, contacts: updated }));
  };

  const addContact = () => {
    const isFirst = contacts.length === 0;
    setFormData(prev => ({
      ...prev,
      contacts: [...contacts, { ...initialContact(), isPrimary: isFirst }],
    }));
  };

  const removeContact = (index) => {
    const updated = contacts.filter((_, i) => i !== index);
    // Ensure at least one primary
    if (updated.length && !updated.some(c => c.isPrimary)) {
      updated[0].isPrimary = true;
    }
    setFormData(prev => ({ ...prev, contacts: updated }));
  };

  const setPrimary = (index) => {
    const updated = contacts.map((c, i) => ({ ...c, isPrimary: i === index }));
    setFormData(prev => ({ ...prev, contacts: updated }));
  };

  return (
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">Contacts *</label>
      {contacts.map((contact, idx) => (
        <ContactCard
          key={idx}
          contact={contact}
          index={idx}
          onChange={handleChange}
          onRemove={removeContact}
          onSetPrimary={setPrimary}
          errors={errors}
        />
      ))}
      <button
        type="button"
        onClick={addContact}
        className="text-sm text-emerald-600 font-semibold mt-2"
      >
        + Add Contact
      </button>
    </div>
  );
};
