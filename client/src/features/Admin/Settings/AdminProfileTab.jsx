import { useState, useEffect } from 'react';
import { Pencil, X, Check, Lock, Unlock, Building2, User, UserCheck, ShieldAlert, Power, UserMinus, UserPlus, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

// ✨ NEW: Strict Regex Validation Engine
const validatePerson = (data) => {
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[6-9]\d{9}$/;
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const aadhaarRegex = /^[2-9][0-9]{11}$/;

  if (!data.email) errors.email = "Email is required";
  else if (!emailRegex.test(data.email.trim())) errors.email = "Invalid email format";

  if (!data.phone) errors.phone = "Phone is required";
  else if (!phoneRegex.test(data.phone.replace(/\D/g, '').slice(-10))) errors.phone = "Invalid 10-digit Indian number";

  if (data.pan && !panRegex.test(data.pan.trim().toUpperCase())) {
    errors.pan = "Format must be ABCDE1234F";
  }

  if (data.aadhaar && !aadhaarRegex.test(data.aadhaar.replace(/\D/g, ''))) {
    errors.aadhaar = "Must be a valid 12-digit number";
  }

  return errors;
};

const AdminProfileTab = ({ admin, authAxios, onUpdated }) => {

  const [editingBusiness, setEditingBusiness] = useState(false);
  const [editingProp, setEditingProp] = useState(false);
  const [editingCP, setEditingCP] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✨ NEW: Error Tracking States
  const [propErrors, setPropErrors] = useState({});
  const [cpErrors, setCpErrors] = useState({});

  const [businessForm, setBusinessForm] = useState({
    establishmentName: admin.establishmentName || '',
    street: admin.address?.street || '',
    city: admin.address?.city || '',
    district: admin.address?.district || '',
    state: admin.address?.state || '',
    pincode: admin.address?.pincode || ''
  });

  const [propForm, setPropForm] = useState({
    name: admin.proprietor?.name || '',
    email: admin.proprietor?.emails?.[0] || '',
    phone: admin.proprietor?.phones?.[0] || '',
    pan: admin.proprietor?.pan || '',
    aadhaar: admin.proprietor?.aadhaar || ''
  });

  const [cpForm, setCpForm] = useState({
    name: admin.competentPerson?.name || '',
    email: admin.competentPerson?.emails?.[0] || '',
    phone: admin.competentPerson?.phones?.[0] || '',
    pan: admin.competentPerson?.pan || '',
    aadhaar: admin.competentPerson?.aadhaar || ''
  });

  const [vault, setVault] = useState({ isOpen: false, actionType: null, proposedData: null, password: '' });

  const isProprietor = admin.sessionRole === 'PROPRIETOR' || admin.sessionRole === 'DUAL_OWNER' || admin.sessionRole === 'SYSTEM_ADMIN';
  const isCP = admin.sessionRole === 'COMPETENT_PERSON' || admin.sessionRole === 'DUAL_OWNER' || admin.sessionRole === 'SYSTEM_ADMIN';

  // Keep local forms perfectly synced with the database
  useEffect(() => {
    setBusinessForm({
      establishmentName: admin.establishmentName || '',
      street: admin.address?.street || '',
      city: admin.address?.city || '',
      state: admin.address?.state || '',
      pincode: admin.address?.pincode || '',
      district: admin.address?.district || ''
    });
    
    setPropForm({
      name: admin.proprietor?.name || '',
      email: admin.proprietor?.emails?.[0] || '',
      phone: admin.proprietor?.phones?.[0] || '',
      pan: admin.proprietor?.pan || '',
      aadhaar: admin.proprietor?.aadhaar || ''
    });

    setCpForm({
      name: admin.competentPerson?.name || '',
      email: admin.competentPerson?.emails?.[0] || '',
      phone: admin.competentPerson?.phones?.[0] || '',
      pan: admin.competentPerson?.pan || '',
      aadhaar: admin.competentPerson?.aadhaar || ''
    });

    // Clear any lingering errors on sync
    setPropErrors({});
    setCpErrors({});
  }, [admin]); 

  const handleDirectSave = async (target, data, closeEditFn) => {
    setSaving(true);
    try {
      await authAxios.put('/api/admin/me/profile', { target, data });
      toast.success(`${target} updated successfully.`);
      if (closeEditFn) closeEditFn(false);
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update.');
    } finally {
      setSaving(false);
    }
  };

  const handleSuspendToggle = () => {
    const isCurrentlySuspended = admin.competentPerson?.isSuspended || false;
    handleDirectSave('TOGGLE_CP_SUSPENSION', { isSuspended: !isCurrentlySuspended });
  };

  const openVault = (actionType, proposedData) => {
    setVault({ isOpen: true, actionType, proposedData, password: '' });
  };

  const verifyVaultPassword = async () => {
    setSaving(true);
    try {
      await authAxios.post('/api/admin/me/vault/verify', {
        actionType: vault.actionType,
        proposedData: vault.proposedData,
        password: vault.password
      });
      
      toast.success('Authorized. Changes applied permanently.');
      setVault({ isOpen: false, actionType: null, proposedData: null, password: '' });

      setEditingBusiness(false); setEditingProp(false); setEditingCP(false);
      setPropErrors({}); setCpErrors({});
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Incorrect password.');
    } finally {
      setSaving(false);
    }
  };

  const saveBusiness = () => {
    const payload = {
      establishmentName: businessForm.establishmentName,
      address: {
        street: businessForm.street, city: businessForm.city,
        state: businessForm.state, pincode: businessForm.pincode, district: businessForm.district
      }
    };
    if (admin.isBusinessVaultLocked) openVault('CHANGE_BUSINESS_LEGAL', payload);
    else handleDirectSave('BUSINESS', payload, setEditingBusiness);
  };

  const saveProprietor = () => {
    // ✨ NEW: Run validation before doing anything
    const errors = validatePerson(propForm);
    if (Object.keys(errors).length > 0) {
      setPropErrors(errors);
      return toast.error("Please fix the highlighted errors.");
    }
    setPropErrors({});

    if (!admin.isProprietorAlsoCP && propForm.email.toLowerCase() === cpForm.email.toLowerCase()) {
      return toast.error("Proprietor and CP cannot use the same email.");
    }

    const payload = {
      name: propForm.name, emails: [propForm.email], phones: [propForm.phone],
      pan: propForm.pan, aadhaar: propForm.aadhaar
    };
    if (admin.isProprietorVaultLocked) openVault('CHANGE_PROP_INFO', payload);
    else handleDirectSave('PROPRIETOR', payload, setEditingProp);
  };

  const saveCP = () => {
    // ✨ NEW: Run validation before doing anything
    const errors = validatePerson(cpForm);
    if (Object.keys(errors).length > 0) {
      setCpErrors(errors);
      return toast.error("Please fix the highlighted errors.");
    }
    setCpErrors({});

    if (!admin.isProprietorAlsoCP && cpForm.email.toLowerCase() === propForm.email.toLowerCase()) {
      return toast.error("Proprietor and CP cannot use the same email.");
    }

    const payload = {
      name: cpForm.name, emails: [cpForm.email], phones: [cpForm.phone],
      pan: cpForm.pan, aadhaar: cpForm.aadhaar
    };
    if (admin.isCPVaultLocked) openVault('CHANGE_CP_INFO', payload);
    else handleDirectSave('COMPETENT_PERSON', payload, setEditingCP);
  };

  const handleInviteCP = async () => {
    setSaving(true);
    try {
      const res = await authAxios.post('/api/admin/me/cp/invite');
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invite.');
    } finally {
      setSaving(false);
    }
  };

  const assignOrRevokeRole = (isProprietorAlsoCP) => {
    openVault('TOGGLE_DUAL_ROLE', { isProprietorAlsoCP });
  };

  const VaultBadge = ({ isLocked }) => (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${isLocked ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
      {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
      {isLocked ? 'Vault Locked' : '72h Unlocked'}
    </span>
  );

  // ✨ NEW: Redesigned Field Renderer with UX Auto-Formatting & Error Handling
  const renderField = (label, value, isEditing, setter, key, type = "text", placeholder = "", errorMsg = "") => (
    <div>
      <label className="text-slate-500 text-xs font-bold uppercase tracking-wider">{label}</label>
      {isEditing ? (
        <div>
          <input 
            type={type} 
            value={value} 
            onChange={(e) => {
              let val = e.target.value;
              // Auto-format UX for PAN (Uppercase)
              if (key === 'pan') val = val.toUpperCase();
              // Prevent typing letters in phone/aadhaar
              if (key === 'aadhaar' || key === 'phone') val = val.replace(/\D/g, '');
              setter(prev => ({ ...prev, [key]: val }));
            }} 
            placeholder={placeholder}
            maxLength={key === 'aadhaar' ? 12 : key === 'pan' ? 10 : key === 'phone' ? 10 : 255}
            className={`mt-1 w-full text-slate-900 text-sm font-medium border ${errorMsg ? 'border-red-400 focus:border-red-500 bg-red-50' : 'border-slate-300 focus:border-emerald-500 bg-white'} rounded-lg px-3 py-2 focus:outline-none transition-colors`} 
          />
          {errorMsg && <p className="text-red-500 text-[11px] font-bold mt-1">{errorMsg}</p>}
        </div>
      ) : (
        <p className="text-slate-900 text-sm font-medium mt-1">{value || '—'}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* 1. BUSINESS PROFILE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Building2 size={20} /></div>
            <div>
              <h2 className="text-slate-800 font-bold text-lg leading-tight">Establishment</h2>
              <VaultBadge isLocked={admin.isBusinessVaultLocked} />
            </div>
          </div>
          {isProprietor && (
            !editingBusiness ? (
              <button onClick={() => setEditingBusiness(true)} className="flex items-center gap-1 text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100">
                <Pencil size={14} /> Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setEditingBusiness(false)} className="text-slate-500 text-sm font-bold px-3 py-1.5 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={saveBusiness} disabled={saving} className="text-white bg-slate-900 text-sm font-bold px-4 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1">
                  {saving ? 'Processing...' : admin.isBusinessVaultLocked ? <><Lock size={14} /> Request</> : 'Save'}
                </button>
              </div>
            )
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">{renderField('Establishment Name', businessForm.establishmentName, editingBusiness, setBusinessForm, 'establishmentName')}</div>
          <div className="md:col-span-2">{renderField('Street Address', businessForm.street, editingBusiness, setBusinessForm, 'street')}</div>
          {renderField('City', businessForm.city, editingBusiness, setBusinessForm, 'city')}
          {renderField('District', businessForm.district, editingBusiness, setBusinessForm, 'district')}
          {renderField('State', businessForm.state, editingBusiness, setBusinessForm, 'state')}
          {renderField('Pincode', businessForm.pincode, editingBusiness, setBusinessForm, 'pincode')}
        </div>
      </div>

      {/* 2. PROPRIETOR PROFILE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><User size={20} /></div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-slate-800 font-bold text-lg leading-tight">Proprietor</h2>
                {admin.sessionRole === 'PROPRIETOR' && (
                  <span className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">You</span>
                )}
              </div>
              <VaultBadge isLocked={admin.isProprietorVaultLocked} />
            </div>
          </div>
          {isProprietor && (
            !editingProp ? (
              <button onClick={() => setEditingProp(true)} className="flex items-center gap-1 text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100">
                <Pencil size={14} /> Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditingProp(false); setPropErrors({}); }} className="text-slate-500 text-sm font-bold px-3 py-1.5 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={saveProprietor} disabled={saving} className="text-white bg-slate-900 text-sm font-bold px-4 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1">
                  {saving ? 'Processing...' : admin.isProprietorVaultLocked ? <><Lock size={14} /> Request</> : 'Save'}
                </button>
              </div>
            )
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">{renderField('Full Legal Name', propForm.name, editingProp, setPropForm, 'name', 'text', 'Enter Name', propErrors.name)}</div>
          {renderField('Primary Email', propForm.email, editingProp, setPropForm, 'email', 'email', 'name@example.com', propErrors.email)}
          {renderField('Primary Phone', propForm.phone, editingProp, setPropForm, 'phone', 'text', '10-digit number', propErrors.phone)}
          {renderField('PAN Number', propForm.pan, editingProp, setPropForm, 'pan', 'text', 'ABCDE1234F', propErrors.pan)}
          {renderField('Aadhaar Number', propForm.aadhaar, editingProp, setPropForm, 'aadhaar', 'text', '12-digit number', propErrors.aadhaar)}
        </div>
      </div>

      {/* 3. COMPETENT PERSON PROFILE */}
      <div className={`bg-white rounded-2xl border ${admin.competentPerson?.isSuspended ? 'border-red-300' : 'border-slate-200'} p-5 shadow-sm relative overflow-hidden transition-colors`}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${admin.competentPerson?.isSuspended ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
              <UserCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-slate-800 font-bold text-lg leading-tight">
                  Competent Person 
                  {admin.competentPerson?.isSuspended && <span className="text-red-500 text-sm ml-2">(Suspended)</span>}
                </h2>
                {admin.sessionRole === 'COMPETENT_PERSON' && (
                  <span className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">You</span>
                )}
              </div>
              <VaultBadge isLocked={admin.isCPVaultLocked} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!admin.isProprietorAlsoCP && isProprietor && !editingCP && admin.competentPerson?.emails?.length > 0 && !admin.competentPerson?.hasClaimedAccount && (
              <button onClick={handleInviteCP} disabled={saving} className="text-blue-700 text-sm font-bold bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                Send Login Invite
              </button>
            )}

            {!admin.isProprietorAlsoCP && (isCP || (isProprietor && !admin.isCPVaultLocked)) && (
              !editingCP ? (
                <button onClick={() => setEditingCP(true)} className="flex items-center gap-1 text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100">
                  <Pencil size={14} /> Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditingCP(false); setCpErrors({}); }} className="text-slate-500 text-sm font-bold px-3 py-1.5 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={saveCP} disabled={saving} className="text-white bg-slate-900 text-sm font-bold px-4 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1">
                    {saving ? 'Processing...' : admin.isCPVaultLocked ? <><Lock size={14} /> Request</> : 'Save'}
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {!admin.isProprietorAlsoCP ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="md:col-span-2">{renderField('Full Legal Name', cpForm.name, editingCP, setCpForm, 'name', 'text', 'Enter Name', cpErrors.name)}</div>
              {renderField('Primary Email', cpForm.email, editingCP, setCpForm, 'email', 'email', 'name@example.com', cpErrors.email)}
              {renderField('Primary Phone', cpForm.phone, editingCP, setCpForm, 'phone', 'text', '10-digit number', cpErrors.phone)}
              {renderField('PAN Number', cpForm.pan, editingCP, setCpForm, 'pan', 'text', 'ABCDE1234F', cpErrors.pan)}
              {renderField('Aadhaar Number', cpForm.aadhaar, editingCP, setCpForm, 'aadhaar', 'text', '12-digit number', cpErrors.aadhaar)}
            </div>

            {isProprietor && !editingCP && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                <button onClick={handleSuspendToggle} disabled={saving}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${admin.competentPerson?.isSuspended ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
                  <Power size={16} />
                  {admin.competentPerson?.isSuspended ? 'Restore Access' : 'Suspend Access'}
                </button>
                
                <button onClick={() => assignOrRevokeRole(true)} disabled={saving}
                  className="flex items-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                  <UserMinus size={16} /> Revoke & Remove CP
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-slate-500 font-medium mb-4">The Proprietor is currently acting as the Competent Person.</p>
            {isProprietor && (
              <button onClick={() => assignOrRevokeRole(false)} disabled={saving}
                className="inline-flex items-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">
                <UserPlus size={16} /> Assign Separate Competent Person
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── ✨ THE NEW PASSWORD VAULT MODAL ── */}
      {vault.isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-900">
              <h3 className="font-bold text-lg text-white flex items-center gap-2"><ShieldAlert size={18} className="text-amber-400" /> Security Vault</h3>
              <button onClick={() => setVault({ isOpen: false, password: '' })} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-600 font-medium mb-5 bg-amber-50 p-3 rounded-lg border border-amber-100 text-amber-900">
                You are requesting a change to legally locked data or revoking employee access. Please enter your login password to authorize this action.
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

                <button onClick={verifyVaultPassword} disabled={saving || !vault.password}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
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

export default AdminProfileTab;