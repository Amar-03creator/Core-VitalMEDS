import React, { useState, useEffect } from 'react';
import {
  Building2, MapPin, Phone, Mail, FileText,
  ShieldCheck, User, Truck, Clock, RefreshCcw,
  CreditCard, Award, BadgeCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { Spinner } from '@/components/ui/spinner';

export default function AboutUsAdminPage() {
  const [distributor, setDistributor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // ✨ FIX 2: Now using the REAL database data instead of the timeout mock!
        const res = await api.getDistributorPublicProfile();
        setDistributor(res.data?.data || res.data);
      } catch (error) {
        console.error("Failed to load distributor profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-3"><Spinner /> Loading business details...</div>;
  }

  if (!distributor) {
    return <div className="py-20 text-center text-slate-500">Failed to load business profile.</div>;
  }

  const addressString = [
    distributor.address?.street,
    distributor.address?.city,
    distributor.address?.state,
    distributor.address?.pincode ? `-${distributor.address?.pincode}` : ''
  ].filter(Boolean).join(', ').replace(', -', ' -');

  const dlString = (distributor.drugLicenses || []).map(dl => dl.dlNumber).join(', ');

  const emails = Array.from(new Set([
    distributor?.email,
    ...(distributor?.proprietor?.emails || []),
    ...(distributor?.competentPerson?.emails || [])
  ].filter(Boolean)));

  // ✨ FIX: Collect all unique phones
  const phones = Array.from(new Set([
    distributor?.phone,
    ...(distributor?.proprietor?.phones || []),
    ...(distributor?.competentPerson?.phones || [])
  ].filter(Boolean)));

  const emailString = emails.length ? emails.join(', ') : "—";
  const phoneString = phones.length ? phones.join(', ') : "—";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fadeIn">

      {/* ── HERO SECTION ── */}
      <div className="bg-slate-900 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
          <Building2 size={250} />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-bold border border-emerald-500/30">
            <BadgeCheck size={16} /> Authorized Wholesale Distributor
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">{distributor.establishmentName}</h1>
          <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
            Your trusted B2B pharmaceutical distribution partner. Providing transparent pricing, reliable stock, and seamless compliance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── CONTACT & LOCATION ── */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
              <MapPin size={20} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-black text-slate-800">Contact & Location</h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Registered Address</p>
              <p className="text-slate-700 font-medium leading-relaxed">{addressString}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Phone size={12} /> Phone</p>
                {/* ✨ FIX: Inject the combined phone string */}
                <p className="text-slate-700 font-bold">{phoneString}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Mail size={12} /> Email</p>
                {/* ✨ FIX: Inject the combined email string */}
                <p className="text-slate-700 font-bold break-all">{emailString}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── LEGAL COMPLIANCE ── */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
              <ShieldCheck size={20} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-black text-slate-800">Legal Compliance</h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><FileText size={12} /> GSTIN</p>
              <p className="text-slate-800 font-mono font-bold text-lg bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block">
                {distributor.gstinAdmin || 'Pending'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Award size={12} /> Drug Licenses</p>
              <p className="text-slate-700 font-medium">{dlString || '—'}</p>
            </div>
            {distributor.drugsBazaarId && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">DrugsBazaar ID</p>
                <p className="text-slate-700 font-medium">{distributor.drugsBazaarId}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── LEADERSHIP ── */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6 md:col-span-2">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center border border-violet-100">
              <User size={20} className="text-violet-600" />
            </div>
            <h2 className="text-xl font-black text-slate-800">Key Personnel</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                <span className="font-black text-slate-400 text-lg">
                  {distributor.proprietor?.name?.charAt(0) || 'P'}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proprietor</p>
                <p className="text-slate-800 font-bold text-lg">{distributor.proprietor?.name || '—'}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                <span className="font-black text-slate-400 text-lg">
                  {distributor.isProprietorAlsoCP ? distributor.proprietor?.name?.charAt(0) : distributor.competentPerson?.name?.charAt(0) || 'C'}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Competent Person</p>
                <p className="text-slate-800 font-bold text-lg">
                  {distributor.isProprietorAlsoCP ? `${distributor.proprietor?.name} (Dual Role)` : distributor.competentPerson?.name || '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── BUSINESS POLICIES (STATIC FAQS) ── */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm md:col-span-2 space-y-6">
          <h2 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-4">Business Logistics & Policies</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="mt-1 shrink-0"><Clock size={24} className="text-slate-400" /></div>
              <div>
                <h3 className="font-bold text-slate-800 text-base mb-1">Order Processing</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Orders placed before 2:00 PM are processed and packed the same day. Our virtual stock engine reserves your inventory instantly to prevent overselling.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 shrink-0"><Truck size={24} className="text-slate-400" /></div>
              <div>
                <h3 className="font-bold text-slate-800 text-base mb-1">Shipping & Delivery</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  All local deliveries are dispatched via assigned routes. For out-of-station orders, tracking IDs (LR numbers) are provided upon dispatch and attached to your invoices.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 shrink-0"><CreditCard size={24} className="text-slate-400" /></div>
              <div>
                <h3 className="font-bold text-slate-800 text-base mb-1">Billing & Payments</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  We support both Cash and Credit billing. Credit terms are strictly monitored. Invoices are strictly GST compliant, and real-time outstanding balances are visible on your dashboard.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 shrink-0"><RefreshCcw size={24} className="text-slate-400" /></div>
              <div>
                <h3 className="font-bold text-slate-800 text-base mb-1">Expiry & Returns (FIFO)</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Stock is dispatched strictly using a First-In-First-Out (FIFO) algorithm ensuring optimal shelf life. Breakage or expiry returns must be reported within standard contractual windows.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}