
import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, Menu, X, LogOut, LayoutDashboard, Megaphone, ShieldCheck, Lock } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout, isLoggedIn } = useAuth();
  const canModerate = Boolean(user?.isAdmin || user?.isCoAdmin || user?.role === 'admin' || user?.role === 'co_admin');

  const navItems = [
    { name: 'About', path: '/about' },
    { name: 'Technologies', path: '/technologies' },
    { name: 'Needs', path: '/needs' },
    { name: 'Updates', path: '/opportunities' },
    { name: 'Stakeholders', path: '/stakeholders' },
    { name: 'AI Matchmaker', path: '/matchmaker' },
  ];

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <NavLink to="/" className="flex items-center gap-3">
            <Globe className="text-blue-600" size={24} />
            <div className="flex flex-col">
              <span className="font-bold text-lg text-slate-900 tracking-tight leading-none">Asia-Pacific TechBridge</span>
              <span className="text-[9px] text-blue-600 font-bold uppercase tracking-[0.2em] leading-none">Regional Innovation Hub</span>
            </div>
          </NavLink>

          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${isActive ? 'text-apctt-blue bg-apctt-light shadow-sm' : 'text-slate-600 hover:text-apctt-blue hover:bg-slate-50'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}

            <div className="h-6 w-px bg-slate-200 mx-2"></div>

            <Link
              to="/register-tech"
              className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-2 rounded-xl text-sm font-black uppercase tracking-wider hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Megaphone size={14} /> Submit
            </Link>

            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${user?.isAdmin ? 'bg-slate-900' : user?.isCoAdmin ? 'bg-indigo-700' : user?.scenario.includes('Representative') ? 'bg-apctt-blue' : 'bg-slate-800'}`}>
                    {user?.name.charAt(0)}
                  </div>
                  <span className="text-sm font-bold text-slate-700">{user?.name.split(' ')[0]}</span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-3 border-b border-slate-50 mb-1 bg-slate-50/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.scenario}</p>
                      <p className="text-sm font-bold text-slate-900 truncate mt-1">{user?.name}</p>
                    </div>
                    <Link to="/dashboard" onClick={() => setIsProfileOpen(false)} className="flex items-center px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-apctt-light hover:text-apctt-blue transition-colors">
                      <LayoutDashboard className="w-4 h-4 mr-3" /> User Dashboard
                    </Link>
                    {canModerate && (
                      <Link to="/moderation" onClick={() => setIsProfileOpen(false)} className="flex items-center px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors font-black uppercase tracking-wider">
                        <ShieldCheck className="w-4 h-4 mr-3" /> Moderation
                      </Link>
                    )}

                    {/* Admin Access: Only for specific staff with isAdmin flag */}
                    {user?.isAdmin && (
                      <Link to="/admin" onClick={() => setIsProfileOpen(false)} className="flex items-center px-4 py-2.5 text-sm text-indigo-700 hover:bg-indigo-50 transition-colors font-black uppercase tracking-wider">
                        <Lock className="w-4 h-4 mr-3" /> Admin Console
                      </Link>
                    )}

                    <button
                      onClick={() => { logout(); setIsProfileOpen(false); }}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-slate-900 text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-slate-800 transition-all"
              >
                Sign In
              </Link>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 p-2">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-b px-2 pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 bg-blue-50">
                User Dashboard
              </Link>
              {canModerate && (
                <Link to="/moderation" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-emerald-700 bg-emerald-50">
                  Moderation
                </Link>
              )}
              {user?.isAdmin && (
                <Link to="/admin" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-indigo-600 bg-indigo-50">
                  Admin Console
                </Link>
              )}
            </>
          ) : (
            <Link to="/login" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-white bg-slate-900">
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
