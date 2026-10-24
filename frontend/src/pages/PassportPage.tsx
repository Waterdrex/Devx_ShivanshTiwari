import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Sparkles, 
  ShieldCheck, 
  CalendarCheck, 
  Users, 
  Code2, 
  Zap, 
  TrendingUp, 
  CheckCircle2 
} from 'lucide-react';
import { GrowthPassport, UserProfile } from '../types';
import { fetchGrowthPassport } from '../api';

interface Props {
  currentUser: UserProfile | null;
}

export const PassportPage: React.FC<Props> = ({ currentUser }) => {
  const [passport, setPassport] = useState<GrowthPassport | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPassport = async () => {
    setLoading(true);
    try {
      const data = await fetchGrowthPassport(currentUser?.id || 'u-1');
      setPassport(data);
    } catch (err) {
      console.error('Failed to load growth passport', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPassport();
  }, [currentUser]);

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      
      {/* Passport Header Hero */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm dark:shadow-xl relative overflow-hidden">
        <div className="relative max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20 text-xs font-bold">
            <Award className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Verified Developer Credential</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Developer Growth Passport
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Your tamper-evident proof of hackathon attendance, squad leadership, and verified technical competencies recognized across the local developer ecosystem.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 rounded-3xl bg-slate-100 dark:bg-navy-900 animate-pulse" />
      ) : passport ? (
        <div className="space-y-6">
          {/* XP & Tier Progress Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm dark:shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Current Standing</span>
                <div className="flex items-center gap-3 mt-1">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">{passport.tier_title}</h3>
                  <span className="px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-bold text-xs border border-violet-200 dark:border-violet-800">
                    Tier {passport.tier_level} / 4
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total Experience</span>
                <div className="text-3xl font-black text-violet-600 dark:text-teal-300 mt-1">{passport.xp} XP</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
                <span>Progress to Tier {passport.tier_level + 1}</span>
                <span>{passport.progress_pct}% ({passport.xp} / {passport.next_tier_xp} XP)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-600 to-teal-400 transition-all duration-500"
                  style={{ width: `${passport.progress_pct}%` }}
                />
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-navy-800">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-center">
                <CalendarCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 mx-auto mb-1" />
                <div className="text-xl font-bold text-slate-900 dark:text-white">{passport.events_attended}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Events Attended</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-center">
                <Users className="w-5 h-5 text-violet-600 dark:text-violet-400 mx-auto mb-1" />
                <div className="text-xl font-bold text-slate-900 dark:text-white">{passport.teams_joined}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Squads Joined</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-center">
                <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <div className="text-xl font-bold text-slate-900 dark:text-white">{passport.hackathons_won}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Hackathon Wins</div>
              </div>
            </div>
          </div>

          {/* Dynamic Badges */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm dark:shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Earned Achievements & Badges</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {passport.badges.map((b) => (
                <div
                  key={b.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    b.earned
                      ? 'bg-slate-50 dark:bg-navy-950 border-slate-200 dark:border-navy-800'
                      : 'opacity-40 bg-slate-100/50 dark:bg-navy-950/40 border-dashed border-slate-300 dark:border-navy-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{b.icon}</span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">{b.name}</span>
                    {b.earned && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{b.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Verified Skills Cloud */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm dark:shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Verified Skill Cloud</span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {passport.skills_verified.map((sk) => (
                <div
                  key={sk.skill}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm"
                >
                  <span className="text-violet-600 dark:text-teal-400 font-bold">#{sk.skill}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-navy-800 text-slate-600 dark:text-slate-400 font-mono">
                    {sk.endorsements} endorsements
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
