// pages/Client/ClientProfilePage.jsx
import { useState, useEffect, useCallback } from 'react';
import { UserCircle2, FileText, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

import ProfileInfoTab from '../../features/Client/Profile/ProfileInfoTab';
import DocumentsTab from '../../features/Client/Profile/DocumentsTab';
import SecurityTab from '../../features/Client/Profile/SecurityTab';

const TABS = [
  { key: 'profile', label: 'Profile', icon: UserCircle2 },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'security', label: 'Security', icon: ShieldCheck },
];

const ClientProfilePage = () => {
  const { authAxios } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await authAxios.get('/api/clients/me');
      setProfile(res.data.data || res.data);
    } catch (err) {
      console.error('Failed to load profile', err);
      toast.error('Could not load your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [authAxios]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading || !profile) {
    return (
      <div className="py-20 flex justify-center text-slate-500">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">
      {/* ✨ THE JAIL BANNER */}
      {profile && profile.documentsUploaded === false && (
        <div className="bg-amber-50 border-2 border-amber-500 rounded-2xl p-4 mb-4 flex items-start gap-3 shadow-sm animate-in slide-in-from-top-4">
          <ShieldCheck size={24} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-amber-900 font-black text-base">Account Activation Required</h3>
            <p className="text-amber-800 text-sm mt-1 leading-relaxed">
              Your dashboard and ordering capabilities are currently locked. Please navigate to the <b>Documents</b> tab below and securely upload your required KYC files.
            </p>
          </div>
        </div>
      )}
      <div>
        <h1 className="text-slate-900 text-2xl font-bold">My Account</h1>
        <p className="text-slate-500 text-sm mt-0.5">{profile.establishmentName}</p>
      </div>

      {/* Tab switcher */}
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

      {activeTab === 'profile' && (
        <ProfileInfoTab profile={profile} authAxios={authAxios} onUpdated={fetchProfile} />
      )}
      {activeTab === 'documents' && (
        <DocumentsTab profile={profile} authAxios={authAxios} onUpdated={fetchProfile} />
      )}
      {activeTab === 'security' && <SecurityTab profile={profile} authAxios={authAxios} />}

      <div className="h-2" />
    </div>
  );
};

export default ClientProfilePage;