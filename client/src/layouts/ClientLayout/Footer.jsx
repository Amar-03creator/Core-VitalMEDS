// client/src/layouts/ClientLayout/Footer.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pill } from 'lucide-react';
import { api } from '../../services/api';

export const Footer = () => {
  const year = new Date().getFullYear();
  const [distributor, setDistributor] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Fetching the dynamic legal/business data
        const res = await api.getDistributorPublicProfile();
        setDistributor(res.data?.data || res.data);
      } catch (err) {
        console.error("Failed to load distributor details for footer:", err);
      }
    };
    fetchProfile();
  }, []);

  // Strictly Dynamic - No fake fallbacks!
  const name = distributor?.establishmentName || "Loading...";

  // ✨ FIX: Collect all unique emails from root, proprietor, and CP
  const emails = Array.from(new Set([
    distributor?.email,
    ...(distributor?.proprietor?.emails || []),
    ...(distributor?.competentPerson?.emails || [])
  ].filter(Boolean)));

  // ✨ FIX: Collect all unique phones from root, proprietor, and CP
  const phones = Array.from(new Set([
    distributor?.phone,
    ...(distributor?.proprietor?.phones || []),
    ...(distributor?.competentPerson?.phones || [])
  ].filter(Boolean)));

  const emailString = emails.length ? emails.join(', ') : "—";
  const phoneString = phones.length ? phones.join(', ') : "—";

  const gstin = distributor?.gstinAdmin || "—";
  const dlString = distributor?.drugLicenses?.length
    ? distributor.drugLicenses.map(dl => dl.dlNumber).join(', ')
    : "—";

  let address = "—";
  if (distributor?.address) {
    const addr = distributor.address;
    address = [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');
  }

  return (
    <footer className="bg-slate-900 text-slate-300 px-5 py-8 mt-80">
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
            VitalMEDS is {name}' B2B ordering platform, connecting pharmacies across Odisha with
            reliable pharmaceutical distribution and transparent billing.{' '}
            <Link to="/client-dashboard/about" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
              [Know More]
            </Link>
          </p>
        </div>

        <div>
          <p className="text-white font-semibold text-base mb-1.5">Contact Us</p>
          <div className="text-slate-400 text-sm space-y-1">
            <p>{name}, {address}</p>
            {/* ✨ FIX: Render the merged strings here */}
            <p>Phone: {phoneString}</p>
            <p>Email: {emailString}</p>
          </div>
        </div>

        <div>
          <p className="text-white font-semibold text-base mb-1.5">Compliance</p>
          <div className="text-slate-400 text-sm space-y-1">
            <p>GSTIN: {gstin}</p>
            <p>Drug License No: {dlString}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-800">
        <p className="text-slate-500 text-sm">
          © {year} {name}. All rights reserved. Prices and stock are subject to change without notice.
        </p>
      </div>
    </footer>
  );
};