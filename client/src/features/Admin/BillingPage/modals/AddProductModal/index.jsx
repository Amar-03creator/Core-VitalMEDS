// modals/AddProductModal/index.jsx
import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../../../services/api';
import { useFocusTrap } from '../AddCompanyModal/hooks/useFocusTrap';
import { ProductNameField } from './ProductNameField';
import { CompanySelect } from './CompanySelect';
import { GSTInclusive } from './GSTInclusive';
import { CompositionsInput } from './CompositionsInput';
import { CategoryInput } from './CategoryInput';
import { TypeInput } from './TypeInput';
import { PackingInput } from './PackingInput';
import { HsnGstFields } from './HsnGstFields';
import { ThresholdFields } from './ThresholdFields';
import { DescriptionFields } from './DescriptionFields';
import { useModalTrap, useScrollLock } from '../../../../../hooks/useBackHandler';
import { AddCompanyModal } from '../AddCompanyModal';

const STORAGE_KEY = 'addProductForm';

export const AddProductModal = ({
  onClose,
  onSave,
  companies: initialCompanies,
  /*
   * When opened from PurchaseEntryModal (step 2 → "Add Product"):
   *   defaultCompanyId   — pre-select and lock the company field
   *   defaultCompanyName — display name to show in the locked field
   * When opened standalone (PurchasesTab → "Add Product"):
   *   both are undefined → company field is freely editable
   */
  defaultCompanyId,
  defaultCompanyName,
}) => {
  useScrollLock(true);
  useModalTrap(true);

  const [companies, setCompanies]       = useState(initialCompanies);
  const [showAddCompany, setShowAddCompany] = useState(false);

  /* ── Decide whether to restore session or start fresh ──────────────── */
  const load = () => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { return null; }
  };
  const saved = load();

  /*
   * If a defaultCompanyId is provided (context-aware open from PurchaseEntryModal),
   * ignore any saved session data for the company field and start fresh for
   * that company. This avoids leftover state from a previous different company.
   */
  const initialFormData = (() => {
    if (defaultCompanyId) {
      // Always start fresh when opened with a locked company
      return {
        name: '', companyId: defaultCompanyId, companyName: defaultCompanyName || '',
        gstInclusive: 'inclusive',
        compositions: [''], categories: [], type: '', packing: '',
        hsnCode: '', gstRate: '12', shortExpiryThreshold: '', lowStockThreshold: '',
        description: '', usageTips: '',
      };
    }
    // Standalone open — restore session if available
    return saved?.formData ?? {
      name: '', companyId: '', companyName: '', gstInclusive: 'inclusive',
      compositions: [''], categories: [], type: '', packing: '',
      hsnCode: '', gstRate: '12', shortExpiryThreshold: '', lowStockThreshold: '',
      description: '', usageTips: '',
    };
  })();

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors]     = useState({});
  const formRef                 = useRef(null);
  const { engageTrap, releaseTrap, isActive } = useFocusTrap(errors, formRef);

  /* ── Only persist session for standalone opens ──────────────────────── */
  useEffect(() => {
    if (!defaultCompanyId) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ formData }));
    }
  }, [formData, defaultCompanyId]);

  const handleClose = () => {
    if (!defaultCompanyId) sessionStorage.removeItem(STORAGE_KEY);
    onClose();
  };

  /* ── Submit ──────────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.companyId || !formData.type || !formData.packing || !formData.hsnCode) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      await api.createProduct({
        name:                 formData.name.trim(),
        company:              formData.companyName,
        companyId:            formData.companyId,
        gstInclusive:         formData.gstInclusive,
        compositions:         formData.compositions.filter(c => c.trim()),
        categories:           formData.categories,
        type:                 formData.type,
        packing:              formData.packing,
        hsnCode:              formData.hsnCode,
        gstRate:              parseFloat(formData.gstRate) || 12,
        shortExpiryThreshold: formData.shortExpiryThreshold ? parseInt(formData.shortExpiryThreshold) : undefined,
        lowStockThreshold:    formData.lowStockThreshold    ? parseInt(formData.lowStockThreshold)    : undefined,
        description:          formData.description,
        usageTips:            formData.usageTips,
      });
      if (!defaultCompanyId) sessionStorage.removeItem(STORAGE_KEY);
      toast.success('Product saved');
      onSave();    // signal parent to refresh — parent does NOT re-create
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
  };

  /* ── Fetch companies list (only needed for standalone opens) ─────────── */
  const fetchCompanies = async () => {
    try {
      const res = await api.getCompanies();
      setCompanies(res.data.map(c => ({ id: c._id, companyName: c.companyName })));
    } catch { /* ignore */ }
  };

  /* ── Nested AddCompanyModal (only reachable in standalone mode) ──────── */
  const handleCompanyAdded = () => {
    // AddCompanyModal already saved to DB — just refresh our dropdown
    fetchCompanies();
    setShowAddCompany(false);
  };

  const isCompanyLocked = Boolean(defaultCompanyId);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
      <div className="w-full bg-white rounded-t-2xl flex flex-col" style={{ height: '85dvh' }}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b z-10">
          <h3 className="font-bold text-slate-900 text-xl">Add New Product</h3>
          <button onClick={handleClose}><X size={24} className="text-slate-400" /></button>
        </div>

        <div ref={formRef} className="relative flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {isActive && <div className="absolute inset-0 z-50 bg-transparent" />}

          <ProductNameField
            formData={formData} setFormData={setFormData}
            errors={errors} setErrors={setErrors}
            toast={toast} engageTrap={engageTrap} releaseTrap={releaseTrap}
          />

          {/*
           * Company field:
           *   isCompanyLocked = true  → show a read-only chip; no "Add Company" link
           *   isCompanyLocked = false → show the full CompanySelect with "+ Add Company"
           */}
          {isCompanyLocked ? (
            <div>
              <label className="text-base font-semibold text-slate-700 block mb-1">Company</label>
              <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-base text-slate-700 flex items-center gap-2">
                <span className="flex-1">{formData.companyName}</span>
                <span className="text-xs text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">Auto-filled</span>
              </div>
            </div>
          ) : (
            <CompanySelect
              formData={formData} setFormData={setFormData}
              companies={companies}
              onAddCompany={() => setShowAddCompany(true)}
            />
          )}

          <GSTInclusive formData={formData} setFormData={setFormData} />
          <CompositionsInput formData={formData} setFormData={setFormData} toast={toast} />
          <CategoryInput formData={formData} setFormData={setFormData} toast={toast} />
          <TypeInput formData={formData} setFormData={setFormData} toast={toast} />
          <PackingInput formData={formData} setFormData={setFormData} toast={toast} />
          <HsnGstFields
            formData={formData} setFormData={setFormData}
            errors={errors} setErrors={setErrors}
            toast={toast} engageTrap={engageTrap} releaseTrap={releaseTrap}
          />
          <ThresholdFields formData={formData} setFormData={setFormData} />
          <DescriptionFields formData={formData} setFormData={setFormData} />

          <button
            onClick={handleSubmit}
            className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-lg hover:bg-emerald-600"
          >
            Save Product
          </button>
        </div>
      </div>

      {/* Only shown in standalone mode (isCompanyLocked = false) */}
      {showAddCompany && (
        <AddCompanyModal
          onClose={() => setShowAddCompany(false)}
          onSave={handleCompanyAdded}
        />
      )}
    </div>
  );
};