import { Save, X, Camera, Check, ShieldAlert, KeyRound } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { RepCard } from './Repcard'; 

export const ProfileEdit = ({ 
  form, errors, saving, logoPreview, cropper,
  vault, setVault, verifyVaultPassword,
  onCancel, onInitiateSave, onFieldChange, onBlurValidate,
  onLogoSelect, setCropper, handleCropSave, fileInputRef,
  updateRep, setMainRep, addRep, removeRep,
  updateBank, addBank, removeBank,
  updateLicense, addLicenseField, removeLicenseField 
}) => {
  return (
    <div className="space-y-4 pb-10 relative">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-900 font-bold text-lg">Editing Profile</h3>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex items-center gap-1 bg-slate-100 text-slate-600 text-sm font-semibold px-3 py-2 rounded-xl hover:bg-slate-200">
            <X size={14} /> Cancel
          </button>
          <button onClick={onInitiateSave} disabled={saving} className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-60 transition-colors">
            <Save size={14} /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* LOGO UPLOADER */}
      <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl border-dashed">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-24 h-24 rounded-full border-2 border-slate-300 bg-white overflow-hidden shadow-sm flex items-center justify-center">
            {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" /> : <Camera size={32} className="text-slate-300" />}
          </div>
        </div>
        <p className="mt-3 text-sm font-bold text-slate-500">Click to change Company Logo</p>
        <p className="text-xs text-slate-400 font-medium">Requires Admin Password</p>
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onLogoSelect} />
      </div>

      <LabeledInput label="Company Name *" value={form.companyName} onChange={(v) => onFieldChange('companyName', v)} />
      
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput label="Short Code" value={form.shortCode} onChange={(v) => onFieldChange('shortCode', v)} onBlur={() => onBlurValidate('shortCode', form.shortCode)} error={errors.shortCode} />
        <LabeledInput label="GSTIN" value={form.gstin} onChange={(v) => onFieldChange('gstin', v.toUpperCase())} onBlur={() => onBlurValidate('gstin', form.gstin)} error={errors.gstin} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LabeledInput label="PAN" value={form.pan} onChange={(v) => onFieldChange('pan', v.toUpperCase())} onBlur={() => onBlurValidate('pan', form.pan)} error={errors.pan} />
        <LabeledInput label="Aadhaar" value={form.aadhaar} onChange={(v) => onFieldChange('aadhaar', v.replace(/\D/g, ''))} onBlur={() => onBlurValidate('aadhaar', form.aadhaar)} error={errors.aadhaar} />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 block mb-1">Drug Licenses</label>
        <div className="space-y-2">
          {form.drugLicenses.map((lic, i) => (
            <div key={i} className="flex gap-2">
              <input value={lic} onChange={(e) => updateLicense(i, e.target.value)} className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base outline-none focus:border-emerald-400" />
              {form.drugLicenses.length > 1 && <button onClick={() => removeLicenseField(i)} className="px-3 text-red-500 font-semibold">✕</button>}
            </div>
          ))}
        </div>
        <button onClick={addLicenseField} className="text-emerald-600 text-sm font-semibold mt-1.5">+ Add license</button>
      </div>

      <LabeledInput type="date" label="Drug License Expiry" value={form.drugLicenseExpiry} onChange={(v) => onFieldChange('drugLicenseExpiry', v)} />
      <LabeledInput label="DrugsBazaar ID" value={form.drugsBazaarId} onChange={(v) => onFieldChange('drugsBazaarId', v.toUpperCase())} onBlur={() => onBlurValidate('drugsBazaarId', form.drugsBazaarId)} error={errors.drugsBazaarId} />

      <div className="grid grid-cols-2 gap-3">
        <LabeledInput label="Email" value={form.email} onChange={(v) => onFieldChange('email', v.toLowerCase())} onBlur={() => onBlurValidate('email', form.email)} error={errors.email} />
        <LabeledInput label="WhatsApp" value={form.whatsapp} onChange={(v) => onFieldChange('whatsapp', v.replace(/\D/g, '').slice(0, 10))} />
      </div>

      <LabeledInput label="Billing Address" value={form.billingAddress} onChange={(v) => onFieldChange('billingAddress', v)} textarea />

      <div className="grid grid-cols-3 gap-3">
        <LabeledInput label="City" value={form.city} onChange={(v) => onFieldChange('city', v)} />
        <LabeledInput label="State" value={form.state} onChange={(v) => onFieldChange('state', v)} />
        <LabeledInput label="Pincode" value={form.pincode} onChange={(v) => onFieldChange('pincode', v.replace(/\D/g, ''))} onBlur={() => onBlurValidate('pincode', form.pincode)} error={errors.pincode} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LabeledInput type="number" label="Lead Time (days)" value={form.leadTimeDays} onChange={(v) => onFieldChange('leadTimeDays', v)} />
        <LabeledInput type="number" label="Min. Order Value (₹)" value={form.minimumOrderValue} onChange={(v) => onFieldChange('minimumOrderValue', v)} />
      </div>

      <div>
        <h4 className="text-slate-700 font-semibold text-base mb-2 mt-4">Representatives *</h4>
        <div className="space-y-2">
          {form.representatives.map((rep, i) => (
            <RepCard key={i} rep={rep} isMain={i === 0} editable onChange={(field, value) => updateRep(i, field, value)} onSetMain={() => setMainRep(i)} onRemove={form.representatives.length > 1 ? () => removeRep(i) : undefined} />
          ))}
        </div>
        <button onClick={addRep} className="text-emerald-600 text-sm font-semibold mt-2">+ Add Representative</button>
      </div>

      <div>
        <h4 className="text-slate-700 font-semibold text-base mb-2 mt-4">Bank Details</h4>
        <div className="space-y-2">
          {form.bankDetails.map((b, i) => (
            <div key={i} className="border border-slate-300 rounded-xl p-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-slate-700">Bank #{i + 1}</span>
                <button onClick={() => removeBank(i)} className="text-red-500 text-sm font-bold">Remove</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Bank Name" value={b.bankName} onChange={(e) => updateBank(i, 'bankName', e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-base outline-none focus:border-emerald-400" />
                <input placeholder="Account Number" value={b.accountNumber} onChange={(e) => updateBank(i, 'accountNumber', e.target.value.replace(/\D/g, ''))} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-base outline-none focus:border-emerald-400" />
                <input placeholder="IFSC Code" value={b.ifscCode} onChange={(e) => updateBank(i, 'ifscCode', e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-base outline-none focus:border-emerald-400" />
                <input placeholder="Branch" value={b.branch} onChange={(e) => updateBank(i, 'branch', e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-base outline-none focus:border-emerald-400" />
              </div>
            </div>
          ))}
        </div>
        <button onClick={addBank} className="text-emerald-600 text-sm font-semibold mt-2">+ Add Bank</button>
      </div>

      {/* CROPPER OVERLAY */}
      {cropper.imageSrc && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center">
          <div className="relative w-full h-[60vh] max-w-md bg-black">
            <Cropper
              image={cropper.imageSrc} crop={cropper.crop} zoom={cropper.zoom} rotation={cropper.rotation} aspect={1} cropShape="round"
              onCropChange={(c) => setCropper(p => ({ ...p, crop: c }))}
              onZoomChange={(z) => setCropper(p => ({ ...p, zoom: z }))}
              onRotationChange={(r) => setCropper(p => ({ ...p, rotation: r }))}
              onCropComplete={(_, pixels) => setCropper(p => ({ ...p, pixels }))}
            />
          </div>
          <div className="w-full max-w-md bg-white p-5 rounded-t-3xl sm:rounded-b-3xl mt-2 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Zoom</label>
              <input type="range" value={cropper.zoom} min={1} max={3} step={0.1} onChange={(e) => setCropper(p => ({ ...p, zoom: Number(e.target.value) }))} className="w-full accent-emerald-500" />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button type="button" onClick={() => setCropper({ imageSrc: null, crop: { x: 0, y: 0 }, zoom: 1, rotation: 0, pixels: null })} className="bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200">Cancel</button>
              <button type="button" onClick={handleCropSave} disabled={saving} className="bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 flex justify-center items-center gap-2 disabled:opacity-50">
                {saving ? 'Processing...' : <><Check size={18} /> Apply</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✨ THE NEW PASSWORD VAULT MODAL */}
      {vault.isOpen && (
        <div className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-900">
              <h3 className="font-bold text-lg text-white flex items-center gap-2"><ShieldAlert size={18} className="text-amber-400" /> Security Vault</h3>
              <button onClick={() => setVault({ isOpen: false, password: '' })} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 font-medium mb-5 bg-amber-50 p-3 rounded-lg border border-amber-100 text-amber-900">
                You are requesting a change to legally locked data or brand assets. Please enter your login password to authorize this action.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-slate-700 text-sm font-bold mb-1.5 flex items-center gap-1"><KeyRound size={14}/> Proprietor Password</label>
                  <input 
                    type="password" 
                    value={vault.password} 
                    onChange={(e) => setVault({ ...vault, password: e.target.value })} 
                    placeholder="Enter your password" 
                    className="w-full text-lg font-medium border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 bg-slate-50" 
                  />
                </div>
                <button onClick={verifyVaultPassword} disabled={saving || !vault.password} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? 'Verifying...' : <><Check size={18} /> Authorize & Apply</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LabeledInput = ({ label, value, onChange, onBlur, error, type = 'text', textarea = false }) => (
  <div>
    <label className="text-sm font-semibold text-slate-700 block mb-1">{label}</label>
    {textarea ? (
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={`w-full bg-white border ${error ? 'border-red-500' : 'border-slate-300'} rounded-xl px-3 py-2.5 text-base outline-none focus:border-emerald-400 resize-none`} />
    ) : (
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} className={`w-full bg-white border ${error ? 'border-red-500' : 'border-slate-300'} rounded-xl px-3 py-2.5 text-base outline-none focus:border-emerald-400`} />
    )}
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);