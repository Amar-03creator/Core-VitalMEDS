// modals/AddProductModal/index.jsx
import { useState, useEffect, useRef } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/api';
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
import { useModalTrap, useScrollLock } from '../../hooks/useBackHandler';
import { AddCompanyModal } from '../AddCompanyModal';

const STORAGE_KEY = 'addProductForm';

export const AddProductModal = ({
  onClose,
  onSave,
  companies: initialCompanies,
  defaultCompanyId,
  defaultCompanyName,
  productToEdit,
  disableBackTrap=false,
}) => {
  useScrollLock(true);
  useModalTrap(true, { disabled: disableBackTrap, onBackClose: onClose });

  const [companies, setCompanies] = useState(initialCompanies || []);
  const [showAddCompany, setShowAddCompany] = useState(false);

  const isEditMode = Boolean(productToEdit);

  const load = () => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { return null; }
  };
  const saved = load();

  

  const initialFormData = (() => {
    if (isEditMode) {
      return {
        name: productToEdit.name || '',
        companyId: productToEdit.companyId?._id || productToEdit.companyId || '',
        companyName: productToEdit.companyDetails?.[0]?.companyName || productToEdit.company || '',
        gstInclusive: productToEdit.gstInclusive || 'inclusive',
        compositions: productToEdit.compositions?.length ? productToEdit.compositions : [''],
        categories: productToEdit.categories || [],
        type: productToEdit.type || '',
        packing: productToEdit.packing || '',
        hsnCode: productToEdit.hsnCode || '',
        gstRate: productToEdit.gstRate?.toString() || '12',
        shortExpiryThreshold: productToEdit.shortExpiryThreshold?.toString() || '',
        lowStockThreshold: productToEdit.lowStockThreshold?.toString() || '',
        description: productToEdit.description || '',
        usageTips: productToEdit.usageTips || '',
      };
    }
    if (defaultCompanyId) {
      return {
        name: '', companyId: defaultCompanyId, companyName: defaultCompanyName || '',
        gstInclusive: 'inclusive',
        compositions: [''], categories: [], type: '', packing: '',
        hsnCode: '', gstRate: '12', shortExpiryThreshold: '', lowStockThreshold: '',
        description: '', usageTips: '',
      };
    }
    return saved?.formData ?? {
      name: '', companyId: '', companyName: '', gstInclusive: 'inclusive',
      compositions: [''], categories: [], type: '', packing: '',
      hsnCode: '', gstRate: '12', shortExpiryThreshold: '', lowStockThreshold: '',
      description: '', usageTips: '',
    };
  })();

  const [formData, setFormData] = useState(initialFormData);
  const [originalData] = useState(initialFormData); // Snapshot for Undo
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  const { engageTrap, releaseTrap, isActive } = useFocusTrap(errors, formRef);

  useEffect(() => {
    if (!defaultCompanyId && !isEditMode) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ formData }));
    }
  }, [formData, defaultCompanyId, isEditMode]);

  const handleClose = () => {
    if (!defaultCompanyId && !isEditMode) sessionStorage.removeItem(STORAGE_KEY);
    onClose();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.companyId || !formData.type || !formData.packing || !formData.hsnCode) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      const payload = {
        name: formData.name.trim(),
        company: formData.companyName,
        companyId: formData.companyId,
        gstInclusive: formData.gstInclusive,
        compositions: formData.compositions.filter(c => c.trim()),
        categories: formData.categories,
        type: formData.type,
        packing: formData.packing,
        hsnCode: formData.hsnCode,
        gstRate: parseFloat(formData.gstRate) || 12,
        shortExpiryThreshold: formData.shortExpiryThreshold ? parseInt(formData.shortExpiryThreshold) : undefined,
        lowStockThreshold: formData.lowStockThreshold ? parseInt(formData.lowStockThreshold) : undefined,
        description: formData.description,
        usageTips: formData.usageTips,
      };

      if (isEditMode) {
        await api.updateProduct(productToEdit._id, payload);
        toast.success('Product updated successfully');
      } else {
        await api.createProduct(payload);
        toast.success('Product saved successfully');
      }

      if (!defaultCompanyId && !isEditMode) sessionStorage.removeItem(STORAGE_KEY);
      onSave(); 
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    if (!companies || companies.length === 0) {
      const fetchCompanies = async () => {
        try {
          const res = await api.getCompanies();
          setCompanies(res.data.map(c => ({ id: c._id, companyName: c.companyName })));
        } catch { /* ignore */ }
      };
      fetchCompanies();
    }
  }, []);

  const handleCompanyAdded = () => {
    api.getCompanies().then(res => {
      setCompanies(res.data.map(c => ({ id: c._id, companyName: c.companyName })));
    });
    setShowAddCompany(false);
  };

  const isCompanyLocked = Boolean(defaultCompanyId) || isEditMode;

  /* ── UNDO ENGINE ── */
  const revertField = (fieldKey) => {
    setFormData(prev => ({ ...prev, [fieldKey]: originalData[fieldKey] }));
  };

  const UndoButton = ({ fieldKey, label }) => {
    if (!isEditMode) return null;
    const isChanged = JSON.stringify(formData[fieldKey]) !== JSON.stringify(originalData[fieldKey]);
    if (!isChanged) return null;
    
    return (
      <button 
        type="button"
        onClick={() => revertField(fieldKey)}
        className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md hover:bg-amber-100 transition-colors"
      >
        <RotateCcw size={12} /> Undo {label}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-100 bg-black/60 flex items-end">
      <div className="w-full bg-white rounded-t-2xl flex flex-col" style={{ height: '85dvh' }}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b z-10">
          <h3 className="font-bold text-slate-900 text-xl">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button onClick={handleClose}><X size={24} className="text-slate-400" /></button>
        </div>

        <div ref={formRef} className="relative flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {isActive && <div className="absolute inset-0 z-50 bg-transparent" />}

          {/* Product Name - LOCKED */}
          <div className="relative">
            <div className="absolute right-0 -top-1"><UndoButton fieldKey="name" label="Name" /></div>
            <ProductNameField
              formData={formData} setFormData={setFormData}
              errors={errors} setErrors={setErrors}
              toast={toast} engageTrap={engageTrap} releaseTrap={releaseTrap}
              isLocked={isEditMode}
            />
          </div>

          {/* Company Selection - LOCKED */}
          {isCompanyLocked ? (
            <div>
              <label className="text-base font-semibold text-slate-700 block mb-1">Company</label>
              <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-base text-slate-700 flex items-center gap-2 cursor-not-allowed">
                <span className="flex-1">{formData.companyName}</span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded uppercase tracking-wider">
                  {isEditMode ? 'Locked' : 'Auto-filled'}
                </span>
              </div>
            </div>
          ) : (
            <CompanySelect
              formData={formData} setFormData={setFormData}
              companies={companies}
              onAddCompany={() => setShowAddCompany(true)}
            />
          )}

          <div className="relative">
            <div className="absolute right-0 -top-1"><UndoButton fieldKey="gstInclusive" label="Tax Basis" /></div>
            <GSTInclusive formData={formData} setFormData={setFormData} />
          </div>
          
          {/* Compositions - LOCKED */}
          <div className="relative">
            <div className="absolute right-0 -top-1"><UndoButton fieldKey="compositions" label="Compositions" /></div>
            <CompositionsInput formData={formData} setFormData={setFormData} toast={toast} isLocked={isEditMode} />
          </div>

          <div className="relative">
            <div className="absolute right-0 -top-1"><UndoButton fieldKey="categories" label="Categories" /></div>
            <CategoryInput formData={formData} setFormData={setFormData} toast={toast} />
          </div>

          <div className="relative">
            <div className="absolute right-0 -top-1"><UndoButton fieldKey="type" label="Type" /></div>
            <TypeInput formData={formData} setFormData={setFormData} toast={toast} />
          </div>

          <div className="relative">
            <div className="absolute right-0 -top-1"><UndoButton fieldKey="packing" label="Packing" /></div>
            <PackingInput formData={formData} setFormData={setFormData} toast={toast} />
          </div>
          
          {/* HSN & GST - HSN LOCKED */}
          <div className="relative">
            <div className="absolute right-0 -top-1"><UndoButton fieldKey="gstRate" label="GST" /></div>
            <HsnGstFields
              formData={formData} setFormData={setFormData}
              errors={errors} setErrors={setErrors}
              toast={toast} engageTrap={engageTrap} releaseTrap={releaseTrap}
              isLocked={isEditMode}
            />
          </div>
          
          <div className="relative">
             <div className="absolute right-0 -top-1"><UndoButton fieldKey="shortExpiryThreshold" label="Thresholds" /></div>
             <ThresholdFields formData={formData} setFormData={setFormData} />
          </div>

          <div className="relative">
            <div className="absolute right-0 -top-1"><UndoButton fieldKey="description" label="Description" /></div>
            <DescriptionFields formData={formData} setFormData={setFormData} />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-lg hover:bg-emerald-600 transition-colors mt-2"
          >
            {isEditMode ? 'Update Product' : 'Save Product'}
          </button>
        </div>
      </div>

      {showAddCompany && (
        <AddCompanyModal
          onClose={() => setShowAddCompany(false)}
          onSave={handleCompanyAdded}
        />
      )}
    </div>
  );
};