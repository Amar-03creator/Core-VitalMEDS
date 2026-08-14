import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Pill, ShieldCheck, Zap, TrendingUp, Package,
  ChevronRight, Star, CheckCircle, Phone, Mail,
  Clock, IndianRupee, FileText, Truck, Users,
  ArrowRight, Menu, X, Sparkles, BookOpen
} from 'lucide-react';
import { api } from '../../services/api';
import Navbar from '../../layouts/common/Navbar'

/* ── STATS ── */
const stats = [
  { value: '50+', label: 'Partner Pharmacies' },
  { value: '5 LAKH+', label: 'Monthly Distribution' },
  { value: '140+', label: 'Products Listed' },
  { value: '99%', label: 'Order Accuracy' },
];

const features = [
  {
    icon: ShieldCheck,
    title: 'Verified B2B Platform',
    desc: 'KYC-verified pharmacies only. Every account manually reviewed by our team.',
    color: 'bg-emerald-500',
  },
  {
    icon: IndianRupee,
    title: 'Dynamic Party Pricing',
    desc: 'Custom quotes tailored to your volume. Negotiate rates through our RFQ system.',
    color: 'bg-blue-500',
  },
  {
    icon: Package,
    title: 'Real-Time Inventory',
    desc: 'Live stock levels. FIFO-tracked batches with expiry alerts and near-expiry discounts.',
    color: 'bg-violet-500',
  },
  {
    icon: FileText,
    title: 'GST-Compliant Invoicing',
    desc: 'Auto-generated invoices with proper CGST/SGST breakdown. Download PDFs anytime.',
    color: 'bg-amber-500',
  },
  {
    icon: TrendingUp,
    title: 'Credit Management',
    desc: 'Track your outstanding, payment history, and credit limit — all in one place.',
    color: 'bg-rose-500',
  },
  {
    icon: Truck,
    title: 'Fast Local Delivery',
    desc: 'Same-day dispatch for orders before noon. Delivery routes optimised for Odisha.',
    color: 'bg-cyan-500',
  },
];

const steps = [
  {
    step: '01',
    title: 'Register & Get Verified',
    desc: 'Submit your documents like DL, GSTIN, Aadhaar, PAN. Our team reviews and approves within 24 hours.',
    color: 'text-emerald-400',
  },
  {
    step: '02',
    title: 'Browse & Send Inquiry',
    desc: 'Explore our full catalog. Add medicines to an inquiry and request a custom quote.',
    color: 'text-blue-400',
  },
  {
    step: '03',
    title: 'Accept Quote & Receive',
    desc: 'Review the distributor\'s pricing, accept the quote, and get delivery at your pharmacy.',
    color: 'text-violet-400',
  },
];

const tiers = [
  { name: 'Silver', threshold: 'Up to ₹20K/mo', perks: ['Standard pricing', 'Net-30 credit', 'Email support'], color: 'border-slate-300 bg-slate-50', badge: 'bg-gray-100 text-gray-600' },
  { name: 'Gold', threshold: '₹20K – ₹50K/mo', perks: ['5% better pricing', 'Net-45 credit', 'Priority support'], color: 'border-amber-300 bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
  { name: 'Platinum', threshold: '₹50K – ₹1L/mo', perks: ['8% better pricing', 'Net-60 credit', 'Dedicated manager'], color: 'border-slate-400 bg-slate-100', badge: 'bg-slate-200 text-slate-700' },
  { name: 'Diamond', threshold: '₹1L+/mo', perks: ['Best rates + free goods', 'Flexible credit', 'Same-day dispatch'], color: 'border-cyan-300 bg-cyan-50', badge: 'bg-cyan-100 text-cyan-700', highlight: true },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  
  // ✨ FIX: Expanded state to hold all dynamic distributor details
  const [distributor, setDistributor] = useState({ 
    name: 'Loading...', 
    state: '...', 
    phone: '—', 
    email: '—' 
  });

  useEffect(() => {
    const fetchLandingData = async () => {
      // 1. Fetch Companies
      try {
        const res = await api.getPublicCompanies();
        const companyList = res?.data || res || [];
        setCompanies(companyList.map(c => c.companyName || c.name || c));
      } catch (err) {
        console.error('Failed to fetch companies dynamically, using fallback', err);
      } finally {
        setLoadingCompanies(false);
      }

      // 2. Fetch Public Distributor Contact Info (Unauthenticated)
      try {
        const res = await api.getPublicContactInfo();
        const contactData = res?.data || res;
        
        if (contactData) {
          // ✨ FIX: Load the dynamic name and state from the backend
          setDistributor({
            name: contactData.establishmentName || 'Our Distributor',
            state: contactData.state || 'your region',
            phone: contactData.phone || '—',
            email: contactData.email || '—',
          });
        }
      } catch (err) {
        console.error('Failed to fetch distributor info for landing page', err);
        setDistributor({ name: 'Our Distributor', state: 'your region', phone: '—', email: '—' });
      }
    };

    fetchLandingData();
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      <Navbar />

      {/* ── HERO ── */}
      <section className="bg-slate-900 px-4 pt-12 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
            <Sparkles size={12} />
            Trusted Pharma Distributor
          </div>

          <h1 className="text-white text-4xl font-black leading-tight tracking-tight mb-4">
            The Smarter Way to
            <span className="block text-emerald-400">Order Medicines</span>
          </h1>

          <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-sm">
            {/* ✨ FIX: Dynamic State and Business Name */}
            CoreVital MEDS connects pharmacies in {distributor.state} directly with {distributor.name}, with real-time stock, custom pricing, and GST-compliant invoicing.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/register"
              className="flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-2xl text-base shadow-xl shadow-emerald-500/30 hover:bg-emerald-400 transition-all active:scale-95">
              Register Your Pharmacy
              <ArrowRight size={18} />
            </Link>
            <Link to="/login"
              className="flex items-center justify-center gap-2 bg-white/10 text-white font-semibold py-3.5 px-6 rounded-2xl text-base border border-white/20 hover:bg-white/15 transition-all">
              Sign In
            </Link>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-white text-lg font-bold flex items-center gap-2">
                  <Star size={18} className="text-amber-400 fill-amber-400" /> Existing Partner?
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  Have we billed you offline before? Claim your digital account instantly using your Admin Code.
                </p>
              </div>
              <Link to="/claim-account" className="shrink-0 bg-slate-800 text-white border border-slate-700 font-bold py-2.5 px-5 rounded-xl text-sm hover:bg-slate-700 transition-all text-center">
                Claim Account
              </Link>
            </div>
          </div>

          <p className="text-slate-500 text-sm mt-5 flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            KYC verified · GST compliant · Drug License required
          </p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-emerald-500 px-4 py-6">
        <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-white font-black text-xl leading-none">{value}</p>
              <p className="text-emerald-100 text-xs font-semibold mt-1 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-4 py-12 bg-slate-50 max-w-2xl mx-auto">
        <div className="mb-8">
          <p className="text-emerald-600 text-xs font-black uppercase tracking-widest mb-2">Simple Process</p>
          <h2 className="text-slate-900 text-2xl font-black leading-tight">From Registration<br />to Delivery in 3 Steps</h2>
        </div>

        <div className="space-y-4">
          {steps.map((s, i) => (
            <div key={s.step} className="bg-white rounded-2xl border border-slate-200 p-5 flex gap-4">
              <div className={`text-4xl font-black leading-none opacity-20 shrink-0 ${s.color}`}>{s.step}</div>
              <div>
                <h3 className="text-slate-900 font-bold text-base">{s.title}</h3>
                <p className="text-slate-500 text-sm mt-1 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-4 py-12 bg-white max-w-2xl mx-auto">
        <div className="mb-8">
          <p className="text-emerald-600 text-xs font-black uppercase tracking-widest mb-2">Platform Features</p>
          <h2 className="text-slate-900 text-2xl font-black leading-tight">Everything Your<br />Pharmacy Needs</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="flex items-start gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-slate-900 font-bold text-sm">{title}</h3>
                <p className="text-slate-500 text-sm mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TIER SYSTEM ── */}
      <section className="px-4 py-12 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 right-0 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto">
          <div className="mb-8">
            <p className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-2">Loyalty Program</p>
            <h2 className="text-white text-2xl font-black leading-tight">Volume-Based<br />Party Tiers</h2>
            <p className="text-slate-400 text-sm mt-2">Order more, unlock better rates and perks automatically.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tiers.map(({ name, threshold, perks, color, badge, highlight }) => (
              <div key={name}
                className={`rounded-2xl border-2 p-4 ${color} ${highlight ? 'ring-2 ring-cyan-400/50' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${badge}`}>{name}</span>
                  {highlight && <span className="text-xs font-black text-cyan-600 bg-cyan-100 px-2 py-0.5 rounded-full">BEST TIER</span>}
                </div>
                <p className="text-slate-600 text-sm font-semibold mb-2">{threshold}</p>
                <div className="space-y-1">
                  {perks.map(p => (
                    <div key={p} className="flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                      <span className="text-slate-700 text-sm">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNER COMPANIES (DYNAMIC) ── */}
      <section className="px-4 py-10 bg-white max-w-2xl mx-auto">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest text-center mb-6">Stocking Products From</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {companies.map(c => (
            <span key={c} className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200">
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="px-4 py-10 bg-emerald-500 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-white text-2xl font-black leading-tight mb-2">Ready to streamline<br />your pharmacy orders?</h2>
          <p className="text-emerald-100 text-sm mb-6">Join 50+ pharmacies already using CoreVital MEDS.</p>
          <div className="flex flex-col gap-3">
            <Link to="/register"
              className="flex items-center justify-center gap-2 bg-white text-emerald-600 font-black py-3.5 rounded-2xl text-base shadow-xl">
              Register Now — It's Free
              <ArrowRight size={18} />
            </Link>
            {/* ✨ FIX: Used distributor state for phone mapping */}
            <a href={`tel:${distributor.phone !== '—' ? distributor.phone : '+919876543210'}`}
              className="flex items-center justify-center gap-2 bg-emerald-600/40 text-white font-semibold py-3 rounded-2xl text-sm border border-white/20 hover:bg-emerald-600/60 transition-colors">
              <Phone size={15} /> Call Us: {distributor.phone}
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Pill size={14} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">CoreVital MEDS</p>
              {/* ✨ FIX: Dynamic Business Name and State */}
              <p className="text-slate-500 text-xs mt-0.5">by {distributor.name}, {distributor.state}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2.5">Platform</p>
              <Link to="/register" className="block text-slate-500 text-sm py-0.5 hover:text-white transition-colors">Register</Link>
              <Link to="/login" className="block text-slate-500 text-sm py-0.5 hover:text-white transition-colors">Sign In</Link>
              <button onClick={() => setShowHowItWorksModal(true)} className="block text-left text-slate-500 text-sm py-0.5 hover:text-white transition-colors">How It Works</button>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2.5">Contact</p>
              <div className="space-y-2">
                {/* ✨ FIX: Used distributor state for contact info */}
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Phone size={13} /> {distributor.phone}
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Mail size={13} /> {distributor.email}
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Clock size={13} /> 8AM – 9PM, Mon–Sat
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700/50 pt-4 flex flex-col gap-1">
            {/* ✨ FIX: Dynamic Year and Name */}
            <p className="text-slate-600 text-xs">© {new Date().getFullYear()} {distributor.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ── HOW IT WORKS QUICK MODAL ── */}
      {showHowItWorksModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <BookOpen size={20} className="text-emerald-600" /> How Ordering Works
              </h3>
              <button onClick={() => setShowHowItWorksModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-1">1. Verification Requirement</h4>
                <p>Register with your credentials. Submit documents like DL, GSTIN, Aadhaar, PAN. Once verified by admin, you gain full direct ordering capabilities.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-1">2. Inquiries & Custom Quotes</h4>
                <p>Add products to your cart and request a quote. Review distributor pricing, accept quotes, and convert them to orders seamlessly.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-1">3. Direct Fulfillment</h4>
                <p>Enjoy quick order edits within the 2-minute placement window before invoicing, and track dispatches straight to your pharmacy.</p>
              </div>
            </div>

            <button
              onClick={() => { setShowHowItWorksModal(false); navigate('/register'); }}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
            >
              Get Started Now
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;