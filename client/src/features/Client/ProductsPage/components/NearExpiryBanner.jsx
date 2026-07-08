// src/features/Client/ProductsPage/components/NearExpiryBanner.jsx
import { Flame } from 'lucide-react';

const NearExpiryBanner = () => (
  <div className="bg-linear-to-r from-orange-500 to-amber-500 px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
    <Flame size={20} className="text-white shrink-0" />
    <div>
      <p className="text-white font-bold text-sm sm:text-base">Short Expiry Special</p>
      <p className="text-white/90 text-xs sm:text-sm">Get 10–20% extra off on near-expiry medicines</p>
    </div>
  </div>
);

export default NearExpiryBanner;