import { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { api } from '../../../../services/api';
import { useScrollLock, useModalTrap } from '../../../../hooks/useBackHandler';{}

export const InventoryFilterModal = ({ isOpen, onClose, filters, setFilters }) => {
  // Start with completely empty arrays (No hardcoded data!)
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Dynamically load ALL companies and categories when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCompanies(filters.companies || []);
      setSelectedCategories(filters.categories || []);

      // Fetch Companies and Products simultaneously
      Promise.all([
        api.getCompanies(),
        api.getProducts({ limit: 5000 }) // High limit to ensure we check the whole catalog
      ])
        .then(([compRes, prodRes]) => {
          // 1. Populate dynamic companies
          if (compRes.data) {
            const dynamicCompanies = compRes.data.map(c => c.companyName).sort();
            setCompanies(dynamicCompanies);
          }

          // 2. Populate dynamic unique categories
          if (prodRes.data) {
            const uniqueCategories = new Set();
            prodRes.data.forEach(product => {
              if (product.categories && Array.isArray(product.categories)) {
                product.categories.forEach(cat => uniqueCategories.add(cat));
              }
            });
            // Convert the Set back to a sorted array
            setCategories([...uniqueCategories].sort());
          }
        })
        .catch(err => {
          console.error("Failed to load dynamic filter options:", err);
          // We no longer fallback to hardcoded data. If it fails, it fails gracefully.
        });
    }
  }, [isOpen, filters]);

  // Lock background scroll and trap back button when modal is open
  useScrollLock(isOpen);
  useModalTrap(isOpen, { onBackClose: onClose });

  // If the modal is not open, don't render anything
  if (!isOpen) return null;

  const toggleCompany = (comp) => {
    setSelectedCompanies(prev => prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp]);
  };

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleApply = () => {
    setFilters({ ...filters, companies: selectedCompanies, categories: selectedCategories });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="w-full sm:w-[450px] bg-white rounded-t-2xl sm:rounded-2xl px-5 py-4 space-y-4 max-h-[85vh] flex flex-col shadow-xl">
        
        <div className="flex justify-between items-center border-b pb-3 shrink-0">
          <h3 className="font-bold text-lg text-slate-900">Filter Inventory</h3>
          <button onClick={onClose}><XCircle size={24} className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-6 pr-2 pb-2">
          
          {/* ── COMPANY CHECKBOXES ── */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-700 tracking-wide uppercase">Companies</label>
              <button 
                onClick={() => setSelectedCompanies(selectedCompanies.length === companies.length ? [] : companies)} 
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                {selectedCompanies.length === companies.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            {companies.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Loading companies...</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {companies.map(comp => (
                  <label key={comp} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedCompanies.includes(comp)}
                      onChange={() => toggleCompany(comp)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-800 truncate" title={comp}>{comp}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* ── CATEGORY CHECKBOXES ── */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-700 tracking-wide uppercase">Categories</label>
              <button 
                onClick={() => setSelectedCategories(selectedCategories.length === categories.length ? [] : categories)} 
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                {selectedCategories.length === categories.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {categories.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Loading categories...</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {categories.map(cat => (
                  <label key={cat} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-800 truncate" title={cat}>{cat}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

        </div>

        <button onClick={handleApply} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl shrink-0 hover:bg-slate-800 transition-colors">
          Apply Filters
        </button>
      </div>
    </div>
  );
};