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
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* Passport Header Hero */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-theme shadow-card relative overflow-hidden transition-colors">
        <div className="relative max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand border border-brand/20 text-xs font-bold">
            <Award className="w-3.5 h-3.5 text-brand" />
            <span>Verified Developer Credential</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-main tracking-tight">
            Developer Growth Passport
          </h1>
          <p className="text-xs sm:text-sm text-secondary leading-relaxed">
            Your tamper-evident record of hackathon participation, squad leadership, and verified technical competencies recognized across the local developer ecosystem.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 rounded-3xl bg-surface border border-theme animate-pulse shadow-card" />
      ) : passport ? (
        <div className="space-y-6">
          {/* XP & Tier Progress Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-theme shadow-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold text-muted tracking-wider">Current Standing</span>
                <div className="flex items-center gap-3 mt-1">
                  <h3 className="text-2xl font-black text-main">{passport.tier_title}</h3>
                  <span className="px-3 py-1 rounded-full bg-brand/10 text-brand font-bold text-xs border border-brand/20">
                    Tier {passport.tier_level} / 4
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs uppercase font-bold text-muted tracking-wider">Total Experience</span>
                <div className="text-3xl font-black text-brand mt-1">{passport.xp} XP</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-secondary font-semibold">
                <span>Progress to Tier {passport.tier_level + 1}</span>
                <span>{passport.progress_pct}% ({passport.xp} / {passport.next_tier_xp} XP)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-surface-secondary border border-theme overflow-hidden">
                <div 
                  className="h-full bg-brand transition-all duration-500 rounded-full"
                  style={{ width: `${passport.progress_pct}%` }}
                />
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-theme">
              <div className="p-4 rounded-2xl bg-surface-secondary border border-theme text-center">
                <CalendarCheck className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <div className="text-xl font-black text-main">{passport.events_attended}</div>
                <div className="text-[11px] text-muted">Events Attended</div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-secondary border border-theme text-center">
                <Users className="w-5 h-5 text-brand mx-auto mb-1" />
                <div className="text-xl font-black text-main">{passport.teams_joined}</div>
                <div className="text-[11px] text-muted">Squads Joined</div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-secondary border border-theme text-center">
                <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <div className="text-xl font-black text-main">{passport.hackathons_won}</div>
                <div className="text-[11px] text-muted">Hackathon Wins</div>
              </div>
            </div>
          </div>

          {/* Dynamic Badges */}
          <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-theme shadow-card space-y-4">
            <h3 className="text-lg font-bold text-main flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Earned Achievements & Badges</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {passport.badges.map((b) => (
                <div
                  key={b.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    b.earned
                      ? 'bg-surface-secondary border-theme'
                      : 'opacity-40 bg-surface-secondary/40 border-dashed border-theme'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{b.icon}</span>
                    <span className="font-bold text-main text-xs">{b.name}</span>
                    {b.earned && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                    )}
                  </div>
                  <p className="text-[11px] text-secondary leading-relaxed">{b.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Verified Skills Cloud */}
          <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-theme shadow-card space-y-4">
            <h3 className="text-lg font-bold text-main flex items-center gap-2">
              <Code2 className="w-5 h-5 text-brand" />
              <span>Verified Skill Cloud</span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {passport.skills_verified.map((sk) => (
                <div
                  key={sk.skill}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-secondary border border-theme text-xs font-semibold text-main shadow-sm"
                >
                  <span className="text-brand font-bold">#{sk.skill}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface text-secondary font-mono border border-theme">
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
