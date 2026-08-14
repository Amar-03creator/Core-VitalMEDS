import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Pill } from 'lucide-react';
import { api } from '../../services/api';

const Navbar = () => {
  const location = useLocation();
  const [distributorName, setDistributorName] = useState('Loading...');

  // Fetch the dynamic business name independently so it works on any page
  useEffect(() => {
    const fetchName = async () => {
      try {
        const res = await api.getPublicContactInfo();
        const contactData = res?.data || res;
        if (contactData) {
          setDistributorName(contactData.establishmentName || 'Our Distributor');
        }
      } catch (err) {
        setDistributorName('Our Distributor');
      }
    };
    fetchName();
  }, []);

  // Determine current route to adapt text dynamically
  const isLogin = location.pathname === '/login';
  const isRegister = location.pathname === '/register';
  const isLanding = location.pathname === '/';

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700/50">
      {/* ✨ FIX: Removed max-w-2xl and mx-auto so it perfectly stretches to the walls on ALL pages */}
      <div className="flex items-center justify-between px-5 md:px-8 py-3 w-full">
        
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Pill size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-none tracking-tight">CoreVital<span className="text-emerald-400 ml-1.5">MEDS</span></p>
            {/* Dynamic subtitle based on the current page */}
            <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">
              {isLogin ? 'Login' : isRegister ? 'Register' : `by ${distributorName}`}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {!isLogin && (
            <Link to="/login" className="text-slate-300 text-sm font-medium px-3 py-1.5 rounded-lg hover:text-white transition-colors">
              {isLanding ? 'Sign In' : 'Sign In →'}
            </Link>
          )}
          {!isRegister && (
            <Link 
              to="/register" 
              className={isLanding 
                ? "bg-emerald-500 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-colors"
                : "text-slate-400 text-sm font-medium hover:text-white transition-colors"
              }
            >
              {isLanding ? 'Register' : 'Register →'}
            </Link>
          )}
        </div>
        
      </div>
    </nav>
  );
};

export default Navbar;