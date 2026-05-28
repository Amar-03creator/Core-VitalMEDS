// components/Admin/Layout/GlassDropdown.jsx
export const GlassDropdown = ({ children, onClose }) => (
  <>
    <div className="fixed inset-0 z-40" onClick={onClose} />
    <div className="absolute right-0 top-full mt-2 w-80 z-50 rounded-2xl overflow-hidden shadow-2xl
                    bg-slate-900/95 backdrop-blur-sm border border-slate-700/50
                    animate-slideDown origin-top-right">
      {children}
    </div>
  </>
);