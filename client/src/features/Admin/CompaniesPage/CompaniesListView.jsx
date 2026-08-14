import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useCompanies } from './hooks/useCompanies';
import { CompanySearchBar } from './components/Companysearchbar';
import { CompanyCard } from './components/CompanyCard';
import { AddCompanyModal } from '../../../modals/AddCompanyModal';
import { CompanyStatsBar } from './components/Companystatsbar';

export const CompaniesListView = ({ onSelectCompany }) => {
  const { companies, loading, search, setSearch, refetch } = useCompanies();
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto pb-24 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-3xl font-black tracking-tight">Companies</h1>
          <p className="text-slate-500 text-base font-medium">Suppliers & purchase management</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-transform active:scale-95 shadow-sm"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      <CompanyStatsBar companies={companies} />

      <CompanySearchBar value={search} onChange={setSearch} />

      {loading ? (
        <p className="py-10 text-center text-slate-500 text-base">Loading suppliers…</p>
      ) : (
        <div className="space-y-3">
          {companies.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-base bg-white rounded-2xl border border-slate-200">
              {search ? 'No suppliers match your search' : 'No suppliers added yet'}
            </div>
          ) : (
            companies.map((c, index) => (
              <CompanyCard 
                key={c._id} 
                company={c} 
                index={index} 
                onClick={() => onSelectCompany(c)} 
              />
            ))
          )}
        </div>
      )}

      {showAddModal && (
        <AddCompanyModal
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};