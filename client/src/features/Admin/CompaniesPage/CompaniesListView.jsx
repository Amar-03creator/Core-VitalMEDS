import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';
import { CompanySearchBar } from './components/CompanySearchBar';
import { CompanyListItem } from './components/CompanyListItem';
import { AddCompanyModal } from '../../../modals/AddCompanyModal';

export const CompaniesListView = ({ onSelectCompany }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchCompanies = async () => {
    try {
      const res = await api.getCompanies();
      setCompanies(res.data || []);
    } catch {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const filtered = useMemo(() => {
    if (!search) return companies;
    const s = search.toLowerCase();
    return companies.filter(c =>
      c.companyName?.toLowerCase().includes(s) ||
      c.shortCode?.toLowerCase().includes(s) ||
      c.gstin?.toLowerCase().includes(s)
    );
  }, [companies, search]);

  const handleCompanySaved = () => {
    setShowAddModal(false);
    fetchCompanies();
  };

  if (loading) {
    return <p className="py-10 text-center text-slate-500 text-base">Loading companies…</p>;
  }

  return (
    <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-lg font-bold">Companies</h1>
          <p className="text-slate-500 text-sm">Suppliers & purchase management</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-slate-900 text-white text-sm font-semibold px-3.5 py-2.5 rounded-xl"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      <CompanySearchBar value={search} onChange={setSearch} />

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-base bg-white rounded-2xl border border-slate-200">
            {companies.length === 0 ? 'No suppliers added yet' : 'No suppliers match your search'}
          </div>
        ) : (
          filtered.map(c => (
            <CompanyListItem key={c._id} company={c} onClick={() => onSelectCompany(c)} />
          ))
        )}
      </div>

      {showAddModal && (
        <AddCompanyModal
          onClose={() => setShowAddModal(false)}
          onSave={handleCompanySaved}
        />
      )}
    </div>
  );
};