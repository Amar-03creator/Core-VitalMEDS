// pages/Admin/AdminSettingsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { UserCircle2, ScrollText, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';


import AdminProfileTab from '../../features/Admin/Settings/AdminProfileTab';
import LegalInfoTab from '../../features/Admin/Settings/LegalInfoTab'; 
import AdminSecurityTab from '../../features/Admin/Settings/AdminSecurityTab';

const TABS = [
  { key: 'profile', label: 'Profile', icon: UserCircle2 },
  { key: 'legal', label: 'Legal', icon: ScrollText },
  { key: 'security', label: 'Security', icon: ShieldCheck },
];

const AdminSettingsPage = () => {
  const { authAxios } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAdmin = useCallback(async () => {
    try {
      const res = await authAxios.get('/api/admin/me');
      setAdmin(res.data.data || res.data);
    } catch (err) {
      console.error('Failed to load admin profile', err);
      toast.error('Could not load your profile.');
    } finally {
      setLoading(false);
    }
  }, [authAxios]);

  useEffect(() => {
    fetchAdmin();
  }, [fetchAdmin]);

  if (loading || !admin) {
    return (
      <div className="py-20 flex justify-center text-slate-500">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-slate-900 text-2xl font-bold">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">{admin.businessName}</p>
      </div>

      <div className="flex gap-1.5 bg-slate-100 rounded-xl p-1">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all
                ${active ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Icon size={16} strokeWidth={active ? 2.4 : 2} />
              {label}
            </button>
          );
        })}
      </div>

      {activeTab === 'profile' && <AdminProfileTab admin={admin} authAxios={authAxios} onUpdated={fetchAdmin} />}
      {activeTab === 'legal' && <LegalInfoTab admin={admin} authAxios={authAxios} onUpdated={fetchAdmin} />}
      {activeTab === 'security' && <AdminSecurityTab admin={admin} />}

      <div className="h-2" />
    </div>
  );
};

export default AdminSettingsPage;