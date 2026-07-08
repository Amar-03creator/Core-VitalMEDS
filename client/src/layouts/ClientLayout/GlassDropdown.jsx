// src/layouts/ClientLayout/GlassDropdown.jsx
export const GlassDropdown = ({ children, onClose }) => (
  <>
    <div className="fixed inset-0 z-40" onClick={onClose} />
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 rounded-2xl overflow-hidden shadow-2xl
                    bg-white border border-slate-200
                    animate-slideDown origin-top-right">
      {children}
    </div>
  </>
);