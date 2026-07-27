// modals/AddProductModal/index.jsx
import { useState, useEffect, useRef } from 'react';
import { X, RotateCcw, Loader2 } from 'lucide-react';
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
import { ImageUploadField } from './ImageUploadField';

const STORAGE_KEY = 'addProductForm';

export const AddProductModal = ({
  onClose,
  onSave,
  companies: initialCompanies,
  defaultCompanyId,
  defaultCompanyName,
  productToEdit,
  disableBackTrap = false,
}) => {
  useScrollLock(true);
  useModalTrap(true, { disabled: disableBackTrap, onBackClose: onClose });

  const [companies, setCompanies] = useState(initialCompanies || []);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  const [hasCompError, setHasCompError] = useState(false); // ✨ NEW: Tracks duplicate composition errors

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
        images: productToEdit.images || [],
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
        gstInclusive: 'inclusive', images: [],
        compositions: [''], categories: [], type: '', packing: '',
        hsnCode: '', gstRate: '12', shortExpiryThreshold: '', lowStockThreshold: '',
        description: '', usageTips: '',
      };
    }
    return saved?.formData ?? {
      name: '', companyId: '', companyName: '', gstInclusive: 'inclusive',
      compositions: [''], categories: [], type: '', packing: '', images: [],
      hsnCode: '', gstRate: '12', shortExpiryThreshold: '', lowStockThreshold: '',
      description: '', usageTips: '',
    };
  })();

  const [formData, setFormData] = useState(initialFormData);
  const [originalData] = useState(initialFormData); 
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

    // ✨ 1. VALIDATE IMAGES 
    if (!formData.images || formData.images.length === 0) {
      toast.error('Please upload at least one product image before saving.');
      return;
    }

    // ✨ 2. VALIDATE COMPOSITIONS
    if (hasCompError) {
      toast.error('Please resolve duplicate compositions before saving.');
      return;
    }
    
    setIsSaving(true); 
    
    try {
      const finalImages = [];
      const pendingImages = formData.images.filter(img => img.isPending);
      
      let sigData = null;
      if (pendingImages.length > 0) {
        sigData = await api.getUploadSignature(); 
      }

      for (const img of formData.images) {
        if (img.isPending) {
           const uploadData = new FormData();
           uploadData.append('file', img.file);
           uploadData.append('api_key', sigData.apiKey);
           uploadData.append('timestamp', sigData.timestamp);
           uploadData.append('signature', sigData.signature);
           uploadData.append('folder', 'vitalmeds_products'); 
           
           const uploadRes = await fetch(
             `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
             { method: 'POST', body: uploadData }
           );
           
           const cloudinaryData = await uploadRes.json();
           if (!uploadRes.ok) throw new Error(cloudinaryData.error?.message || 'Cloudinary upload failed');
           
           finalImages.push({ url: cloudinaryData.secure_url, publicId: cloudinaryData.public_id });
        } else {
           finalImages.push(img);
        }
      }

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
        images: finalImages, 
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
    } finally {
      setIsSaving(false);
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
        className="flex items-center gap-1 text-sm font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md hover:bg-amber-100 transition-colors"
      >
        <RotateCcw size={12} /> Undo {label}
      </button>
    );
  };

  return (
    // ✨ FIX: Added md:items-center and p-4 to center the modal on laptops
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4">
      {/* ✨ FIX: Added md:max-w-4xl to restrict width, and md:rounded-2xl for laptop edges */}
      <div className="w-full md:max-w-4xl bg-white rounded-t-2xl md:rounded-2xl flex flex-col mx-auto shadow-2xl" style={{ height: '85dvh', maxHeight: '900px' }}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b z-10 md:rounded-t-2xl">
          <h3 className="font-bold text-slate-900 text-xl">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button onClick={handleClose}><X size={24} className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        <div ref={formRef} className="relative flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {isActive && <div className="absolute inset-0 z-50 bg-transparent" />}

          {/* Row 1: Product Name & Images (Full Width) */}
          <div className="relative">
            <div className="absolute right-0 -top-1"><UndoButton fieldKey="name" label="Name" /></div>
            <ProductNameField
              formData={formData} setFormData={setFormData}
              errors={errors} setErrors={setErrors}
              toast={toast} engageTrap={engageTrap} releaseTrap={releaseTrap}
              isLocked={isEditMode}
            />
            <ImageUploadField formData={formData} setFormData={setFormData} toast={toast} />
          </div>
          
          {/* ✨ Row 2: Company & GST (Side-by-Side on Laptop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              {isCompanyLocked ? (
                <div>
                  <label className="text-base font-semibold text-slate-700 block mb-1">Company</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-base text-slate-700 flex items-center gap-2 cursor-not-allowed">
                    <span className="flex-1">{formData.companyName}</span>
                    <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded uppercase tracking-wider">
                      {isEditMode ? 'Locked' : 'Auto'}
                    </span>
                  </div>
                </div>
              ) : (
                <CompanySelect formData={formData} setFormData={setFormData} companies={companies} onAddCompany={() => setShowAddCompany(true)} />
              )}
            </div>
            
            <div className="relative">
              <div className="absolute right-0 -top-1"><UndoButton fieldKey="gstInclusive" label="Tax Basis" /></div>
              <GSTInclusive formData={formData} setFormData={setFormData} />
            </div>
          </div>

          {/* ✨ Row 3: Compositions & Category (Side-by-Side on Laptop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <div className="absolute right-0 -top-1"><UndoButton fieldKey="compositions" label="Compositions" /></div>
              <CompositionsInput 
                formData={formData} 
                setFormData={setFormData} 
                toast={toast} 
                isLocked={isEditMode} 
                onDuplicateError={setHasCompError} 
              />
            </div>
            
            <div className="relative">
              <div className="absolute right-0 -top-1"><UndoButton fieldKey="categories" label="Categories" /></div>
              <CategoryInput formData={formData} setFormData={setFormData} toast={toast} />
            </div>
          </div>

          {/* ✨ Row 4: Type & Packing (Side-by-Side on ALL Screens) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <div className="absolute right-0 -top-1"><UndoButton fieldKey="type" label="Type" /></div>
              <TypeInput formData={formData} setFormData={setFormData} toast={toast} />
            </div>
            
            <div className="relative">
              <div className="absolute right-0 -top-1"><UndoButton fieldKey="packing" label="Packing" /></div>
              <PackingInput formData={formData} setFormData={setFormData} toast={toast} />
            </div>
          </div>

          {/* Row 5: HSN & GST */}
          <div className="relative">
            <div className="absolute right-0 -top-1"><UndoButton fieldKey="gstRate" label="GST" /></div>
            <HsnGstFields
              formData={formData} setFormData={setFormData}
              errors={errors} setErrors={setErrors}
              toast={toast} engageTrap={engageTrap} releaseTrap={releaseTrap}
              isLocked={isEditMode}
            />
          </div>

          {/* Row 6: Thresholds */}
          <div className="relative">
            <div className="absolute right-0 -top-1"><UndoButton fieldKey="shortExpiryThreshold" label="Thresholds" /></div>
            <ThresholdFields formData={formData} setFormData={setFormData} />
          </div>

          {/* ✨ Row 7: Description & Usage Tips (Side-by-Side on ALL Screens) */}
          <div className="relative">
            <div className="absolute right-0 -top-1"><UndoButton fieldKey="description" label="Desc" /></div>
            <DescriptionFields formData={formData} setFormData={setFormData} />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSaving || hasCompError}
            className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-lg hover:bg-emerald-600 transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving && <Loader2 size={20} className="animate-spin" />}
            {isSaving ? 'Uploading & Saving...' : (isEditMode ? 'Update Product' : 'Save Product')}
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