// client/src/layouts/ClientLayout/Footer.jsx
import { Pill } from 'lucide-react';

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 px-5 py-8 mt-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
          <Pill size={18} className="text-white" />
        </div>
        <p className="text-white font-bold text-lg m-0">VitalMEDS</p>
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-white font-semibold text-base mb-1.5">About Us</p>
          <p className="text-slate-400 text-sm leading-relaxed">
            VitalMEDS is Mila Agencies' B2B ordering platform, connecting pharmacies across Odisha with
            reliable pharmaceutical distribution and transparent billing.
          </p>
        </div>

        <div>
          <p className="text-white font-semibold text-base mb-1.5">Contact Us</p>
          <div className="text-slate-400 text-sm space-y-1">
            <p>Mila Agencies, Brahmapur, Odisha, India</p>
            <p>Phone: +91 00000 00000</p>
            <p>Email: support@vitalmeds.in</p>
          </div>
        </div>

        <div>
          <p className="text-white font-semibold text-base mb-1.5">Compliance</p>
          <div className="text-slate-400 text-sm space-y-1">
            <p>GSTIN: 21XXXXX0000X1ZX</p>
            <p>Drug License No: OD-XX-000000</p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-800">
        <p className="text-slate-500 text-sm">
          © {year} Mila Agencies. All rights reserved. Prices and stock are subject to change without notice.
        </p>
      </div>
    </footer>
  );
};