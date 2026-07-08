// client/src/layouts/ClientLayout/components/HamburgerButton.jsx
export const HamburgerButton = ({ open, onClick }) => (
  <button
    onClick={onClick}
    className={`relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200
      ${open ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-50'}`}
  >
    <div className="w-5 h-4 flex flex-col justify-between">
      <span className={`block h-[2px] rounded-full bg-current transition-all duration-300 origin-center ${open ? 'rotate-45 translate-y-[7px]' : ''}`} />
      <span className={`block h-[2px] rounded-full bg-current transition-all duration-200 ${open ? 'opacity-0 scale-x-0' : ''}`} />
      <span className={`block h-[2px] rounded-full bg-current transition-all duration-300 origin-center ${open ? '-rotate-45 -translate-y-[7px]' : ''}`} />
    </div>
  </button>
);