import React, { useState } from 'react';
import {
  Compass,
  CalendarDays,
  Users2,
  LayoutDashboard,
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
  User,
  Sliders,
  ShieldCheck,
  Check
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
  onOpenProfile?: () => void;
  activePassesCount?: number;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  hasConflicts,
  currentUser,
  isDemoMode = false,
  onToggleDemoMode,
  onOpenAuth,
  onLogout,
  onOpenProfile,
  activePassesCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const { theme, resolvedTheme, toggleTheme, setTheme } = useTheme();

  // Primary navigation tabs reflecting the 12 concepts
  const primaryTabs = [
    { id: 'discover', label: 'Discover', icon: Compass },
    {
      id: 'radar',
      label: 'Opportunity Radar',
      icon: Radar,
      badge: 'AI',
      badgeColor: 'bg-brand/10 text-brand border-brand/20',
    },
    { id: 'demands', label: 'Community', icon: Vote },
    { id: 'organizer', label: 'Organizer Hub', icon: LayoutDashboard },
    ...(currentUser ? [{
      id: 'my-events',
      label: 'My Passes',
      icon: Ticket,
      badge: activePassesCount > 0 ? String(activePassesCount) : undefined,
      badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
    }] : []),
  ];

  // Secondary tabs grouped cleanly
  const secondaryTabs = [
    { id: 'planner', label: 'Smart Planner', icon: CalendarDays, badge: hasConflicts ? '!' : undefined },
    { id: 'teammatch', label: 'TeamMatch 2.0', icon: Users2 },
    { id: 'passport', label: 'Growth Passport', icon: Award },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setMoreDropdownOpen(false);
  };

  const isSecondaryActive = secondaryTabs.some((t) => t.id === activeTab);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-surface/90 border-b border-theme transition-colors duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">

          {/* Brand Logo */}
          <button
            onClick={() => handleTabClick('discover')}
            className="flex items-center gap-2.5 group text-left shrink-0 focus:outline-none"
            aria-label="EventSphere Home"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand to-teal-400 flex items-center justify-center shadow-md shadow-brand/20 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
            </div>
            <div className="hidden sm:block leading-none">
              <div className="text-base font-extrabold tracking-tight text-main flex items-center gap-1">
                Event<span className="text-brand">Sphere</span>
              </div>
              <div className="text-[9px] font-bold tracking-widest text-brand uppercase opacity-90">
                Hyperlocal Tech
              </div>
            </div>
          </button>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-surface-secondary/70 p-1 rounded-2xl border border-theme/60 shadow-inner">
            {primaryTabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-surface text-brand font-bold shadow-sm border border-theme/40'
                      : 'text-secondary hover:text-main hover:bg-surface/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full border font-bold ${item.badgeColor || 'border-theme'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* More Features Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSecondaryActive
                    ? 'bg-surface text-brand font-bold shadow-sm border border-theme/40'
                    : 'text-secondary hover:text-main hover:bg-surface/50'
                }`}
              >
                <span>More</span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" />
              </button>

              {moreDropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-48 rounded-2xl bg-surface border border-theme shadow-xl p-1.5 z-50 animate-fade-in text-xs"
                  onClick={() => setMoreDropdownOpen(false)}
                >
                  {secondaryTabs.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                          isActive
                            ? 'bg-brand/10 text-brand font-bold'
                            : 'text-secondary hover:text-main hover:bg-hover-surface'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-brand" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-bold">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Quick Demo Persona Indicator / Switcher */}
            {onToggleDemoMode && (
              <button
                onClick={onToggleDemoMode}
                title={isDemoMode ? 'Exit Demo Mode → Browse as Guest' : 'Enable Demo Mode (Aarav Sharma judge profile)'}
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isDemoMode
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-400/40 shadow-sm'
                    : 'bg-surface border-theme text-secondary hover:text-brand hover:border-brand/40'
                }`}
              >
                <FlaskConical className={`w-3.5 h-3.5 ${isDemoMode ? 'text-amber-500 animate-pulse' : ''}`} />
                <span>{isDemoMode ? 'Demo Persona ON' : 'Demo Mode'}</span>
              </button>
            )}

            {/* Theme Toggle (Sun / Moon) */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-2 rounded-xl border border-theme bg-surface hover:bg-hover-surface text-secondary hover:text-main transition-all active:scale-95 shadow-sm"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-brand" />
              )}
            </button>

            {/* User Profile Dropdown or Sign In */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-2xl border border-theme bg-surface hover:bg-hover-surface transition-all shadow-sm"
                  aria-expanded={userDropdownOpen}
                >
                  <img
                    src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=6546f5&color=fff&size=80`}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-xl object-cover ring-1 ring-brand/40"
                  />
                  <div className="hidden sm:block text-left leading-tight max-w-[100px]">
                    <div className="font-bold text-xs text-main truncate">{currentUser.name.split(' ')[0]}</div>
                    <div className="text-[9px] text-muted truncate">{currentUser.role || 'Attendee'}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0 opacity-70" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-surface border border-theme shadow-2xl p-2 z-50 animate-fade-in text-xs"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    {/* Header info */}
                    <div className="px-3 py-2.5 border-b border-theme/60 mb-1">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=6546f5&color=fff&size=80`}
                          alt={currentUser.name}
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-brand/30"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-main truncate">{currentUser.name}</div>
                          <div className="text-[10px] text-muted truncate">
                            {currentUser.email || `${currentUser.id}@demo.eventsphere.io`}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand/10 text-brand font-semibold border border-brand/20">
                              {currentUser.role || 'Member'}
                            </span>
                            {currentUser.is_admin ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-bold border border-rose-500/20">
                                ADMIN
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-0.5 py-1">
                      <button
                        onClick={() => handleTabClick('my-events')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-secondary hover:text-main hover:bg-hover-surface transition-colors"
                      >
                        <Ticket className="w-4 h-4 text-emerald-500" />
                        <span>My Event Passes</span>
                      </button>

                      {onOpenProfile && (
                        <button
                          onClick={onOpenProfile}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-secondary hover:text-main hover:bg-hover-surface transition-colors"
                        >
                          <Sliders className="w-4 h-4 text-brand" />
                          <span>Profile & Preferences</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleTabClick('passport')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-secondary hover:text-main hover:bg-hover-surface transition-colors"
                      >
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>Growth Passport & XP</span>
                      </button>

                      {/* Theme selection in menu */}
                      <div className="px-3 py-2 flex items-center justify-between text-[11px] text-muted border-t border-theme/40 mt-1">
                        <span>Appearance</span>
                        <div className="flex items-center gap-1 bg-surface-secondary p-0.5 rounded-lg border border-theme/50">
                          <button
                            onClick={(e) => { e.stopPropagation(); setTheme('light'); }}
                            className={`p-1 rounded-md ${theme === 'light' ? 'bg-surface text-brand shadow-xs' : 'text-muted'}`}
                            title="Light theme"
                          >
                            <Sun className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setTheme('dark'); }}
                            className={`p-1 rounded-md ${theme === 'dark' ? 'bg-surface text-brand shadow-xs' : 'text-muted'}`}
                            title="Dark theme"
                          >
                            <Moon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-1 pt-1 border-t border-theme/60">
                      <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors font-semibold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all shadow-md shadow-brand/20 active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-theme text-secondary hover:text-main"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-theme bg-surface px-4 pt-3 pb-6 space-y-2 animate-fade-in shadow-xl">
          <div className="text-[10px] uppercase font-bold tracking-wider text-muted px-2 pt-1">
            Primary Navigation
          </div>
          {primaryTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                  isActive
                    ? 'bg-brand text-white font-bold'
                    : 'text-secondary hover:text-main hover:bg-hover-surface'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="text-[10px] uppercase font-bold tracking-wider text-muted px-2 pt-2 border-t border-theme/60">
            More Tools & Squads
          </div>
          {secondaryTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                  isActive
                    ? 'bg-brand/10 text-brand font-bold'
                    : 'text-secondary hover:text-main hover:bg-hover-surface'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-brand" />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}

          {onToggleDemoMode && (
            <div className="pt-2 border-t border-theme/60">
              <button
                onClick={onToggleDemoMode}
                className="w-full py-2.5 px-3 rounded-xl bg-surface-secondary border border-theme text-main text-xs font-bold flex items-center justify-center gap-2"
              >
                <FlaskConical className="w-4 h-4 text-amber-500" />
                <span>{isDemoMode ? 'Turn Off Demo Persona' : 'Switch to Judge Demo Persona'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
