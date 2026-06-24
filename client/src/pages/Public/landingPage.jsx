import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Pill, ShieldCheck, Zap, TrendingUp, Package,
  ChevronRight, Star, CheckCircle, Phone, Mail,
  Clock, IndianRupee, FileText, Truck, Users,
  ArrowRight, Menu, X, Sparkles
} from 'lucide-react';

/* ── DEMO STATS ── */
const stats = [
  { value: '120+', label: 'Partner Pharmacies' },
  { value: '₹2Cr+', label: 'Monthly Distribution' },
  { value: '1400+', label: 'Products Listed' },
  { value: '99.2%', label: 'Order Accuracy' },
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
    desc: 'Submit your Drug License and GSTIN. Our team reviews and approves within 24 hours.',
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
    desc: 'Review the distributor\'s pricing, accept the quote, and get delivery at your doorstep.',
    color: 'text-violet-400',
  },
];

const tiers = [
  { name: 'Silver',   threshold: 'Up to ₹50K/mo',   perks: ['Standard pricing', 'Net-30 credit', 'Email support'], color: 'border-slate-300 bg-slate-50', badge: 'bg-gray-100 text-gray-600' },
  { name: 'Gold',     threshold: '₹50K – ₹1L/mo',   perks: ['5% better pricing', 'Net-45 credit', 'Priority support'], color: 'border-amber-300 bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
  { name: 'Platinum', threshold: '₹1L – ₹2L/mo',    perks: ['8% better pricing', 'Net-60 credit', 'Dedicated manager'], color: 'border-slate-400 bg-slate-100', badge: 'bg-slate-200 text-slate-700' },
  { name: 'Diamond',  threshold: '₹2L+/mo',          perks: ['Best rates + free goods', 'Flexible credit', 'Same-day dispatch'], color: 'border-cyan-300 bg-cyan-50', badge: 'bg-cyan-100 text-cyan-700', highlight: true },
];

const companies = ['Cipla', 'Sun Pharma', "Dr. Reddy's", 'Mankind', 'Torrent', 'USV', 'Alkem', 'Aster', 'Sanofi', 'Macleods'];

/* ── COMPONENT ── */
const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700/50">
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Pill size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-none tracking-tight">CoreVital<span className="text-emerald-400 ml-1.5">MEDS</span></p>
              <p className="text-emerald-400 text-[9px] font-semibold tracking-widest uppercase">by Mila Agencies</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/login" className="text-slate-300 text-sm font-medium px-3 py-1.5 rounded-lg hover:text-white transition-colors">
              Sign in
            </Link>
            <Link to="/register" className="bg-emerald-500 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-colors">
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="bg-slate-900 px-4 pt-12 pb-16 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-slate-700/30 blur-3xl" />
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative max-w-2xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
            <Sparkles size={12} />
            Odisha's Trusted Pharma Distributor
          </div>

          {/* Headline */}
          <h1 className="text-white text-4xl font-black leading-tight tracking-tight mb-4">
            The Smarter Way to
            <span className="block text-emerald-400">Order Medicines</span>
          </h1>

          <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-sm">
            VitalMEDS connects pharmacies in Odisha directly with Mila Agencies,  with real-time stock, custom pricing, and GST-compliant invoicing.
          </p>

          {/* CTAs */}
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

          {/* Trust line */}
          <p className="text-slate-500 text-xs mt-5 flex items-center gap-2">
            <ShieldCheck size={13} className="text-emerald-500" />
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
              <p className="text-emerald-100 text-[9px] font-semibold mt-1 leading-tight">{label}</p>
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
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{desc}</p>
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

          <div className="grid grid-cols-2 gap-3">
            {tiers.map(({ name, threshold, perks, color, badge, highlight }) => (
              <div key={name}
                className={`rounded-2xl border-2 p-4 ${color} ${highlight ? 'col-span-2 ring-2 ring-cyan-400/50' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${badge}`}>{name}</span>
                  {highlight && <span className="text-[10px] font-black text-cyan-600 bg-cyan-100 px-2 py-0.5 rounded-full">BEST TIER</span>}
                </div>
                <p className="text-slate-600 text-xs font-semibold mb-2">{threshold}</p>
                <div className="space-y-1">
                  {perks.map(p => (
                    <div key={p} className="flex items-center gap-1.5">
                      <CheckCircle size={11} className="text-emerald-600 shrink-0" />
                      <span className="text-slate-700 text-xs">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNER COMPANIES ── */}
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
          <p className="text-emerald-100 text-sm mb-6">Join 120+ pharmacies already using VitalMEDS.</p>
          <div className="flex flex-col gap-3">
            <Link to="/register"
              className="flex items-center justify-center gap-2 bg-white text-emerald-600 font-black py-3.5 rounded-2xl text-base shadow-xl">
              Register Now — It's Free
              <ArrowRight size={18} />
            </Link>
            <a href="tel:+919876543210"
              className="flex items-center justify-center gap-2 bg-emerald-600/40 text-white font-semibold py-3 rounded-2xl text-sm border border-white/20">
              <Phone size={15} /> Call Us: +91 98765 43210
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
              <p className="text-white font-bold text-sm leading-none">VitalMEDS</p>
              <p className="text-slate-500 text-[10px]">by Mila Agencies, Odisha</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2.5">Platform</p>
              {['Register', 'Sign In', 'Browse Products', 'How It Works'].map(l => (
                <p key={l} className="text-slate-500 text-sm py-0.5">{l}</p>
              ))}
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2.5">Contact</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Phone size={13} /> +91 98765 43210
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Mail size={13} /> info@milaagencies.in
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Clock size={13} /> 8AM – 9PM, Mon–Sat
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700/50 pt-4 flex flex-col gap-1">
            <p className="text-slate-600 text-xs">© 2025 Mila Agencies. All rights reserved.</p>
            <p className="text-slate-700 text-xs">Drug License No. XX-XXXX-XXX | GSTIN: 21XXXXX</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;