import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  MapPin, 
  Target, 
  Code2, 
  Sparkles, 
  Sun, 
  Moon, 
  Laptop, 
  CheckCircle2, 
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { UserProfile } from '../types';
import { apiUpdateProfile } from '../api';
import { useTheme } from '../context/ThemeContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onProfileUpdated: (user: UserProfile) => void;
  showToast?: (msg: string, type: 'success' | 'warning' | 'info') => void;
}

export const ProfileModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
  showToast
}) => {
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(currentUser?.name || 'Aarav Sharma');
  const [role, setRole] = useState(currentUser?.role || 'Full Stack Engineer');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [locality, setLocality] = useState(currentUser?.locality || 'Koramangala');
  const [skillsStr, setSkillsStr] = useState(
    currentUser?.skills ? currentUser.skills.join(', ') : 'React, TypeScript, FastAPI, AI'
  );
  const [goalsStr, setGoalsStr] = useState(
    currentUser?.goals ? currentUser.goals.join(', ') : 'Win Hackathons, Find Teammates, AI Upskilling'
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setRole(currentUser.role || 'Full Stack Engineer');
      setBio(currentUser.bio || '');
      setLocality(currentUser.locality || 'Koramangala');
      setSkillsStr(currentUser.skills ? currentUser.skills.join(', ') : 'React, TypeScript, FastAPI, AI');
      setGoalsStr(currentUser.goals ? currentUser.goals.join(', ') : 'Win Hackathons, Find Teammates, AI Upskilling');
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const skillsArray = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
      const goalsArray = goalsStr.split(',').map(s => s.trim()).filter(Boolean);

      const updated = await apiUpdateProfile({
        name,
        role,
        bio,
        locality,
        skills: skillsArray,
        goals: goalsArray,
      });

      onProfileUpdated(updated);
      showToast?.('Profile and preferences updated successfully!', 'success');
      onClose();
    } catch (err: any) {
      showToast?.(err.message || 'Failed to update profile', 'warning');
    } finally {
      setSaving(false);
    }
  };

  const displayName = currentUser?.name || name || 'Guest User';
  const avatarUrl = currentUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6546f5&color=fff&size=80`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-surface border border-theme rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-elevated p-6 sm:p-7 relative text-main transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-theme">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-main">Profile & Preferences</h3>
              <p className="text-[11px] text-muted">Customize your developer interests and app appearance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-muted hover:text-main hover:bg-surface-secondary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Avatar and basic details */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface-secondary border border-theme">
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-brand/30"
            />
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-surface border border-theme text-main font-semibold focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-secondary mb-1">Technical Role</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. AI / ML Engineer"
                className="w-full px-3 py-2 rounded-xl bg-surface border border-theme text-main focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-secondary mb-1">Preferred Locality</label>
              <select
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface border border-theme text-main focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="Koramangala">Koramangala (Bengaluru)</option>
                <option value="Indiranagar">Indiranagar (Bengaluru)</option>
                <option value="HSR Layout">HSR Layout (Bengaluru)</option>
                <option value="Whitefield">Whitefield (Bengaluru)</option>
                <option value="Electronic City">Electronic City (Bengaluru)</option>
                <option value="Central Bangalore">Central Bangalore</option>
                <option value="BKC Bandra">BKC (Mumbai)</option>
                <option value="Cyber City">Cyber City (Gurugram/NCR)</option>
                <option value="Hitec City">Hitec City (Hyderabad)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-secondary mb-1">Bio / Profile Summary</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short note about what you are building..."
              className="w-full px-3 py-2 rounded-xl bg-surface border border-theme text-main focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-secondary mb-1">
              Skills & Stack (comma separated)
            </label>
            <input
              type="text"
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              placeholder="React, TypeScript, FastAPI, PyTorch"
              className="w-full px-3 py-2 rounded-xl bg-surface border border-theme text-main focus:outline-none focus:border-brand"
            />
            <span className="text-[10px] text-muted">Used by Opportunity Radar and TeamMatch algorithms.</span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-secondary mb-1">
              Developer Goals (comma separated)
            </label>
            <input
              type="text"
              value={goalsStr}
              onChange={(e) => setGoalsStr(e.target.value)}
              placeholder="Win Hackathons, Find Teammates, AI Upskilling"
              className="w-full px-3 py-2 rounded-xl bg-surface border border-theme text-main focus:outline-none focus:border-brand"
            />
          </div>

          {/* Appearance setting */}
          <div className="pt-2 border-t border-theme">
            <label className="block text-[11px] font-bold text-secondary mb-2">Theme & Appearance</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-brand text-white border-brand shadow-sm'
                    : 'bg-surface border-theme text-secondary hover:text-main'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-brand text-white border-brand shadow-sm'
                    : 'bg-surface border-theme text-secondary hover:text-main'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'system'
                    ? 'bg-brand text-white border-brand shadow-sm'
                    : 'bg-surface border-theme text-secondary hover:text-main'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>System</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-theme flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-secondary hover:text-main cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/20 disabled:opacity-50 transition-all cursor-pointer active:scale-95"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
