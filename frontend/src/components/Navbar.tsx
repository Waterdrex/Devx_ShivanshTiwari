import React, { useState } from 'react';
import {
  Compass,
  CalendarDays,
  Users2,
  LayoutDashboard,
  RotateCcw,
  Menu,
  X,
  Sparkles,
  Ticket,
  Award,
  Vote,
  Radar,
  LogIn,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  FlaskConical,
  UserCircle2,
} from 'lucide-react';
import { UserProfile } from '../types';
import { useTheme } from '../context/ThemeContext';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hasConflicts?: boolean;
  onResetDemo: () => void;
  resetting?: boolean;
  currentUser: UserProfile | null;
  isDemoMode?: boolean;
  onToggleDemoMode?: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  hasConflicts,
  onResetDemo,
  resetting,
  currentUser,
  isDemoMode = false,
  onToggleDemoMode,
  onOpenAuth,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'discover', label: 'Discover', icon: Compass },
    {
      id: 'radar',
      label: 'Radar',
      icon: Radar,
      badge: 'AI',
      badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-400/30',
    },
    {
      id: 'planner',
      label: 'Planner',
      icon: CalendarDays,
      badge: hasConflicts ? '!' : undefined,
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-400/30',
    },
    { id: 'teammatch', label: 'TeamMatch', icon: Users2 },
    { id: 'demands', label: 'Wishlist', icon: Vote },
    { id: 'passport', label: 'Passport', icon: Award },
    { id: 'my-events', label: 'My Passes', icon: Ticket },
    { id: 'organizer', label: 'Host & Admin', icon: LayoutDashboard },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const isDemoUser = currentUser?.id === 'u-1';

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/90 dark:bg-navy-950/90 border-b border-slate-200/80 dark:border-navy-800/80 transition-colors duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">

          {/* Logo */}
          <button
            onClick={() => handleTabClick('discover')}
            className="flex items-center gap-2.5 group text-left shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-violet-500 to-teal-400 flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-4.5 h-4.5 text-white group-hover:rotate-12 transition-transform" />
            </div>
            <div className="hidden sm:block leading-none">
              <div className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                Event<span className="text-violet-600 dark:text-violet-400">Sphere</span>
              </div>
              <div className="text-[9px] font-bold tracking-widest text-teal-600 dark:text-teal-400 uppercase">
                Hyperlocal Community
              </div>
            </div>
          </button>

          {/* Desktop Nav Pills */}
          <div className="hidden xl:flex items-center gap-0.5 bg-slate-100/80 dark:bg-navy-900/60 p-1 rounded-xl border border-slate-200 dark:border-navy-800 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-white dark:bg-violet-600 text-violet-700 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-navy-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 shrink-0">

            {/* Demo Mode Toggle */}
            {onToggleDemoMode && (
              <button
                onClick={onToggleDemoMode}
                title={isDemoMode ? 'Exit Demo Mode → Browse as Guest' : 'Enable Demo Mode (Aarav Sharma judge profile)'}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                  isDemoMode
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/50 shadow-sm shadow-amber-500/10'
                    : 'bg-slate-100 dark:bg-navy-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-navy-700 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-400/40'
                }`}
              >
                <FlaskConical className={`w-3.5 h-3.5 ${isDemoMode ? 'text-amber-500 animate-pulse' : ''}`} />
                <span className="hidden lg:inline">{isDemoMode ? 'Demo ON' : 'Demo'}</span>
              </button>
            )}

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-100 dark:bg-navy-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-violet-500" />
              )}
            </button>

            {/* User Button / Sign-In */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-xl border text-xs transition-all shadow-sm ${
                    isDemoUser && isDemoMode
                      ? 'bg-amber-500/10 border-amber-400/40 text-amber-700 dark:text-amber-300'
                      : 'bg-slate-100 dark:bg-navy-900 border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-200'
                  } hover:shadow-md`}
                >
                  <img
                    src={currentUser.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.name) + '&background=7c3aed&color=fff&size=80'}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-lg object-cover ring-1 ring-violet-500/40"
                  />
                  <div className="hidden sm:block text-left leading-tight max-w-[90px]">
                    <div className="font-bold text-[11px] truncate">{currentUser.name.split(' ')[0]}</div>
                    {isDemoUser && isDemoMode && (
                      <div className="text-[8px] text-amber-600 dark:text-amber-400 font-semibold">DEMO</div>
                    )}
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-2xl p-2 z-50 animate-fade-in text-xs"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    {/* User header */}
                    <div className="px-3 py-2.5 border-b border-slate-100 dark:border-navy-800 mb-1">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={currentUser.avatar_url}
                          alt={currentUser.name}
                          className="w-9 h-9 rounded-xl object-cover ring-2 ring-violet-500/30"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {currentUser.email || `${currentUser.id}@eventsphere.io`}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold border border-violet-400/20">
                              {currentUser.role}
                            </span>
                            {isDemoUser && isDemoMode && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-400/20">
                                DEMO
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <button onClick={() => handleTabClick('my-events')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors">
                        <Ticket className="w-4 h-4 text-teal-500" />
                        <span>My Event Passes</span>
                      </button>
                      <button onClick={() => handleTabClick('passport')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>Growth Passport & XP</span>
                      </button>
                      <button onClick={() => handleTabClick('demands')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors">
                        <Vote className="w-4 h-4 text-violet-500" />
                        <span>Community Wishlist</span>
                      </button>
                      {onToggleDemoMode && (
                        <button
                          onClick={onToggleDemoMode}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                        >
                          <FlaskConical className="w-4 h-4 text-amber-500" />
                          <span>{isDemoMode ? 'Exit Demo Mode' : 'Enable Demo Mode'}</span>
                        </button>
                      )}
                    </div>

                    <div className="mt-1 pt-1 border-t border-slate-100 dark:border-navy-800">
                      <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="font-semibold">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 text-white text-[11px] font-bold hover:brightness-110 active:scale-95 shadow-md shadow-violet-500/25 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Reset Seeds */}
            <button
              onClick={onResetDemo}
              disabled={resetting}
              title="Reset database to fresh hackathon seed data"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-900 hover:bg-slate-200 dark:hover:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-400 text-[11px] font-semibold transition-all disabled:opacity-40"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-teal-500' : ''}`} />
              <span>{resetting ? 'Resetting...' : 'Reset'}</span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl xl:hidden bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-400"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white/98 dark:bg-navy-900/98 border-b border-slate-200 dark:border-navy-800 px-4 pt-3 pb-5 space-y-1 shadow-2xl animate-fade-in max-h-[80vh] overflow-y-auto">

          {/* Demo mode banner at top */}
          {onToggleDemoMode && (
            <div className={`p-2.5 mb-2 rounded-xl border flex items-center justify-between text-xs ${
              isDemoMode
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400/40 text-amber-700 dark:text-amber-300'
                : 'bg-slate-50 dark:bg-navy-950 border-slate-200 dark:border-navy-800 text-slate-600 dark:text-slate-400'
            }`}>
              <div className="flex items-center gap-1.5 font-semibold">
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Demo Mode {isDemoMode ? '(Aarav Sharma)' : ''}</span>
              </div>
              <button
                onClick={() => { onToggleDemoMode(); setMobileMenuOpen(false); }}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all ${
                  isDemoMode
                    ? 'bg-amber-500 text-white'
                    : 'bg-violet-600 text-white'
                }`}
              >
                {isDemoMode ? 'Exit' : 'Enable'}
              </button>
            </div>
          )}

          {/* User info or sign-in */}
          {currentUser ? (
            <div className="p-3 mb-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src={currentUser.avatar_url} alt={currentUser.name} className="w-8 h-8 rounded-lg object-cover ring-1 ring-violet-500" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">{currentUser.name}</div>
                  <div className="text-[10px] text-teal-600 dark:text-teal-400">{currentUser.locality} • {currentUser.role}</div>
                </div>
              </div>
              <button
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }}
              className="w-full mb-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-violet-500/25"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In or Create Account</span>
            </button>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/30'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-200 dark:border-navy-800 flex items-center justify-between text-xs gap-2">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300"
            >
              {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-500" />}
              <span>{resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button
              onClick={() => { onResetDemo(); setMobileMenuOpen(false); }}
              disabled={resetting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 disabled:opacity-40"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-teal-500' : ''}`} />
              <span>Reset Seeds</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
