export const DescriptionFields = ({ formData, setFormData }) => (
  <>
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">Description</label>
      <textarea
        value={formData.description}
        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
        rows={2}
        placeholder="e.g. Broad‑spectrum antibiotic for respiratory and urinary tract infections..."
        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base outline-none focus:border-emerald-400 resize-none"
      />
    </div>
    <div>
      <label className="text-base font-semibold text-slate-700 block mb-1">Usage Tips</label>
      <textarea
        value={formData.usageTips}
        onChange={e => setFormData(prev => ({ ...prev, usageTips: e.target.value }))}
        rows={2}
        placeholder="e.g. Take after meals. Keep out of reach of children. Store below 30°C."
        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base outline-none focus:border-emerald-400 resize-none"
      />
    </div>
  </>
);