import React, { useState } from 'react';
import { X, Lock, Mail, User, MapPin, Sparkles, LogIn, UserPlus, CheckCircle2 } from 'lucide-react';
import { apiLogin, apiSignup } from '../api';
import { UserProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Full Stack Developer');
  const [locality, setLocality] = useState('Koramangala');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiLogin({ email, password });
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiSignup({
        name,
        email,
        password,
        role,
        locality,
        goals: ['Win Hackathons', 'Find Teammates', 'AI Upskilling'],
        skills: ['React', 'TypeScript', 'Tailwind CSS'],
      });
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try another email.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiLogin({ email: demoEmail, password: 'password123' });
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-surface border border-theme rounded-3xl max-w-md w-full shadow-elevated p-6 sm:p-7 relative text-main transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-muted hover:text-main p-1 rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-2 shadow-sm">
            <Sparkles className="w-6 h-6 text-brand" />
          </div>
          <h3 className="text-xl font-black text-main tracking-tight">
            Event<span className="text-brand">Sphere</span> Authentication
          </h3>
          <p className="text-xs text-secondary mt-0.5">
            Access personalized Opportunity Radar, Growth Passport & verified tickets
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-surface-secondary p-1 rounded-2xl border border-theme mb-5">
          <button
            onClick={() => { setTab('login'); setError(null); }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === 'login' ? 'bg-brand text-white shadow-sm' : 'text-secondary hover:text-main'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('signup'); setError(null); }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === 'signup' ? 'bg-brand text-white shadow-sm' : 'text-secondary hover:text-main'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-main mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aarav.sharma@demo.eventsphere.io"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main placeholder-muted focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-main mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main placeholder-muted focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs transition-all shadow-md shadow-brand/20 disabled:opacity-50 mt-1 cursor-pointer active:scale-95"
            >
              {loading ? 'Authenticating...' : 'Sign In to EventSphere'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-main mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rohan Mehta"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main placeholder-muted focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-main mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rohan@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main placeholder-muted focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-main mb-1">Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. AI Engineer"
                  className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-main mb-1">Locality</label>
                <select
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl bg-surface-secondary border border-theme text-main focus:outline-none focus:border-brand cursor-pointer"
                >
                  <option value="Koramangala">Koramangala</option>
                  <option value="Indiranagar">Indiranagar</option>
                  <option value="HSR Layout">HSR Layout</option>
                  <option value="Whitefield">Whitefield</option>
                  <option value="Electronic City">Electronic City</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-main mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main placeholder-muted focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs transition-all shadow-md shadow-brand/20 disabled:opacity-50 mt-1 cursor-pointer active:scale-95"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>
        )}

        {/* 1-Click Quick Demo Profiles */}
        <div className="mt-5 pt-4 border-t border-theme">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-muted tracking-wider">
              1-Click Demo Profiles (Judge Switcher)
            </span>
            <span className="text-[10px] text-brand font-semibold">Auto-fill password</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {[
              { name: 'Aarav (Attendee)', email: 'aarav.sharma@demo.eventsphere.io', role: 'Lead AI Engineer' },
              { name: 'Karan (Organizer)', email: 'organizer@demo.eventsphere.io', role: 'Event Host' },
              { name: 'Priya (Teammate)', email: 'priya.nair@demo.eventsphere.io', role: 'Backend Candidate' },
              { name: 'System Admin', email: 'admin@demo.eventsphere.io', role: 'Safety Moderator' },
            ].map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => handleQuickLogin(u.email)}
                disabled={loading}
                className="p-2.5 rounded-xl bg-surface-secondary hover:bg-surface border border-theme text-left transition-all group cursor-pointer"
              >
                <div className="font-bold text-main group-hover:text-brand truncate">
                  {u.name}
                </div>
                <div className="text-[10px] text-secondary truncate">{u.role}</div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
