import { useState, useMemo } from 'react';
import { SearchableSelect } from '../AddPurchaseBillModal/SearchableSelect';

export const CompanySelect = ({ formData, setFormData, companies, onAddCompany }) => {
  const [search, setSearch] = useState(formData.companyName || '');
  const [showList, setShowList] = useState(false);

  const options = useMemo(() => {
    if (!search) return [];
    const s = search.toLowerCase();
    return companies.filter(c => c.companyName.toLowerCase().includes(s)).map(c => ({ id: c.id, label: c.companyName }));
  }, [search, companies]);

  const handleSelect = (item) => {
    setFormData(prev => ({ ...prev, companyId: item.id, companyName: item.label }));
    setSearch(item.label);
    setShowList(false);
  };

  const handleClear = () => {
    setFormData(prev => ({ ...prev, companyId: '', companyName: '' }));
    setSearch('');
    setShowList(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-base font-semibold text-slate-700">Company *</label>
        <button type="button" onClick={onAddCompany} className="text-sm font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg hover:bg-slate-200">+ Add Company</button>
      </div>
      <SearchableSelect
        value={search}
        onChange={val => { setSearch(val); if (!formData.companyId) setShowList(true); }}
        options={options}
        onSelect={handleSelect}
        onClear={handleClear}
        placeholder="Search company..."
        show={showList}
        setShow={setShowList}
      />
    </div>
  );
};