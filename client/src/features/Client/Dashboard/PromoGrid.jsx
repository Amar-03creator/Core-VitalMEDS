import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Tag,
  ListOrdered,
  CreditCard,
  Headphones,
  Bell,
  Phone,
  ArrowRight,
  X,
} from 'lucide-react';

const promoTiles = [
  {
    id: 1,
    icon: Zap,
    shortLabel: 'Instant\nDiscount',
    badge: '10% OFF',
    accent: 'sky',
    border: 'border-sky-200',
    softBg: 'bg-sky-50',
    softBg2: 'bg-sky-100/60',
    iconText: 'text-sky-700',
    expandTitle: 'Special Discount on Instant Payment',
    expandDesc:
      'Get up to 10% extra discount when you pay immediately. Clear dues faster and unlock exclusive savings on every order placed with us.',
    expandIcon: Zap,
    actionLabel: 'View All Products',
    actionType: 'navigate',
    actionTo: '/client-dashboard/products',
  },
  {
    id: 2,
    icon: Tag,
    shortLabel: 'Bulk Order\nDiscount',
    badge: '₹20K+',
    accent: 'emerald',
    border: 'border-emerald-200',
    softBg: 'bg-emerald-50',
    softBg2: 'bg-emerald-100/60',
    iconText: 'text-emerald-700',
    expandTitle: 'Bulk Order Discount',
    expandDesc:
      'Place orders above ₹20,000 in a single transaction and unlock special wholesale rates. The bigger your order, the better the deal.',
    expandIcon: Tag,
    actionLabel: 'Send Inquiry Now',
    actionType: 'navigate',
    actionTo: '/client-dashboard/inquiry',
  },
  {
    id: 3,
    icon: ListOrdered,
    shortLabel: 'Ordering\nProcess',
    badge: '3 STEPS',
    accent: 'slate',
    border: 'border-slate-200',
    softBg: 'bg-slate-50',
    softBg2: 'bg-slate-100/60',
    iconText: 'text-slate-700',
    expandTitle: 'Simple 3-Step Ordering',
    expandDesc:
      '① Browse catalog and add medicines to your Inquiry.\n② Our team reviews and sends you a custom price quote.\n③ Accept the quote and confirm your order.',
    expandIcon: ListOrdered,
    actionLabel: null,
    actionType: 'none',
  },
  {
    id: 4,
    icon: CreditCard,
    shortLabel: 'Credit\nTerms',
    badge: 'FLEXIBLE',
    accent: 'indigo',
    border: 'border-indigo-200',
    softBg: 'bg-indigo-50',
    softBg2: 'bg-indigo-100/60',
    iconText: 'text-indigo-700',
    expandTitle: 'Flexible Credit Terms',
    expandDesc:
      'Choose between Cash Bill (instant payment) or Credit Bill (pay later). Your credit limit and payment history determine available terms.',
    expandIcon: CreditCard,
    actionLabel: 'Know More',
    actionType: 'none',
  },
  {
    id: 5,
    icon: Headphones,
    shortLabel: 'Customer\nSupport',
    badge: '8AM–9PM',
    accent: 'rose',
    border: 'border-rose-200',
    softBg: 'bg-rose-50',
    softBg2: 'bg-rose-100/60',
    iconText: 'text-rose-700',
    expandTitle: 'Dedicated Customer Support',
    expandDesc:
      'Our pharmacist support team is available 8 AM to 9 PM, every day. Get help with orders, billing queries, or product information.',
    expandIcon: Phone,
    actionLabel: 'Contact Support',
    actionType: 'dialogue',
  },
  {
    id: 6,
    icon: Bell,
    shortLabel: 'Important\nNotice',
    badge: 'NOTICE',
    accent: 'amber',
    border: 'border-amber-200',
    softBg: 'bg-amber-50',
    softBg2: 'bg-amber-100/60',
    iconText: 'text-amber-800',
    expandTitle: 'Important Notice',
    expandDesc:
      'Warehouse will be closed for upcoming holidays from May 17–19. Please place your orders before May 16 to avoid delays. Regular delivery resumes May 20.',
    expandIcon: Bell,
    actionLabel: 'Read More',
    actionType: 'dialogue',
  },
];

const PromoGrid = () => {
  const [activeTile, setActiveTile] = useState(null);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef(null);
  const progressRef = useRef(null);
  const DURATION = 7500;

  const openTile = (tile) => {
    clearTimeout(timerRef.current);
    clearInterval(progressRef.current);

    setActiveTile(tile);
    setProgress(100);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });

    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(progressRef.current);
    }, 50);

    timerRef.current = setTimeout(() => {
      closeTile();
    }, DURATION);
  };

  const closeTile = () => {
    setVisible(false);
    clearTimeout(timerRef.current);
    clearInterval(progressRef.current);
    setTimeout(() => setActiveTile(null), 320);
  };

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(progressRef.current);
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-3 grid-rows-2 gap-2 p-2 sm:gap-2.5 sm:p-2.5">
        {promoTiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.id}
              onClick={() => openTile(tile)}
              className={`relative flex aspect-square flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border ${tile.border} ${tile.softBg} p-2 transition-transform active:scale-95 sm:rounded-3xl sm:p-3`}
            >
              <div className={`absolute inset-0 ${tile.softBg2} opacity-70`} />
              <div className="absolute -right-5 -top-5 h-16 w-16 rounded-full bg-white/50 blur-[2px]" />
              <div className="absolute -bottom-5 -left-5 h-16 w-16 rounded-full bg-white/50 blur-[2px]" />

              <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm sm:h-12 sm:w-12`}>
                <Icon size={18} className={`h-5 w-5 ${tile.iconText} sm:h-6 sm:w-6`} />
              </div>

              <p className="relative whitespace-pre-line text-center text-[13px] font-semibold leading-tight text-slate-800 sm:text-[14px] md:text-[15px]">
                {tile.shortLabel}
              </p>

              <span className="relative rounded-full bg-white px-2 py-0.5 text-[10px] font-bold tracking-wider text-slate-600 shadow-sm sm:px-3">
                {tile.badge}
              </span>
            </button>
          );
        })}
      </div>

      {activeTile && (
        <div
          className={`absolute inset-0 overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 ease-out ${
            visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          <div className={`absolute inset-0 ${activeTile.softBg}`} />
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/45" />
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/35" />
          <div className="absolute inset-x-0 top-0 h-1 bg-slate-200" />
          <div
            className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${
              activeTile.accent === 'sky'
                ? 'from-sky-400 to-sky-600'
                : activeTile.accent === 'emerald'
                ? 'from-emerald-400 to-emerald-600'
                : activeTile.accent === 'indigo'
                ? 'from-indigo-400 to-indigo-600'
                : activeTile.accent === 'rose'
                ? 'from-rose-400 to-rose-600'
                : activeTile.accent === 'amber'
                ? 'from-amber-400 to-amber-600'
                : 'from-slate-400 to-slate-600'
            }`}
          />

          <div className="relative flex h-full flex-col justify-between p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm sm:h-12 sm:w-12">
                {(() => {
                  const ExpandIcon = activeTile.expandIcon;
                  return <ExpandIcon size={20} className={`sm:h-6 sm:w-6 ${activeTile.iconText}`} />;
                })()}
              </div>

              <button
                onClick={closeTile}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm transition-colors hover:bg-white"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="my-2 flex-1">
              <h3 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                {activeTile.expandTitle}
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600 sm:text-base">
                {activeTile.expandDesc}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              {activeTile.actionLabel &&
                (activeTile.actionType === 'navigate' ? (
                  <Link
                    to={activeTile.actionTo}
                    onClick={closeTile}
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors sm:text-base ${
                      activeTile.accent === 'sky'
                        ? 'bg-sky-600 hover:bg-sky-700'
                        : activeTile.accent === 'emerald'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : activeTile.accent === 'indigo'
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : activeTile.accent === 'rose'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : activeTile.accent === 'amber'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {activeTile.actionLabel}
                    <ArrowRight size={14} />
                  </Link>
                ) : (
                  <button
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm sm:text-base ${
                      activeTile.accent === 'sky'
                        ? 'bg-sky-600'
                        : activeTile.accent === 'emerald'
                        ? 'bg-emerald-600'
                        : activeTile.accent === 'indigo'
                        ? 'bg-indigo-600'
                        : activeTile.accent === 'rose'
                        ? 'bg-rose-600'
                        : activeTile.accent === 'amber'
                        ? 'bg-amber-600'
                        : 'bg-slate-700'
                    }`}
                  >
                    {activeTile.actionLabel}
                    <ArrowRight size={14} />
                  </button>
                ))}

              <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-none ${
                    activeTile.accent === 'sky'
                      ? 'bg-sky-500'
                      : activeTile.accent === 'emerald'
                      ? 'bg-emerald-500'
                      : activeTile.accent === 'indigo'
                      ? 'bg-indigo-500'
                      : activeTile.accent === 'rose'
                      ? 'bg-rose-500'
                      : activeTile.accent === 'amber'
                      ? 'bg-amber-500'
                      : 'bg-slate-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoGrid;