import React, { useState, useEffect } from 'react';
import { 
  Radar, 
  Sparkles, 
  Target, 
  Zap, 
  Compass, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  SlidersHorizontal,
  DollarSign,
  TrendingUp,
  BrainCircuit,
  Users
} from 'lucide-react';
import { EventItem, UserProfile } from '../types';
import { fetchOpportunityRadar } from '../api';
import { TrustScoreBadge } from '../components/TrustScoreBadge';

interface Props {
  currentUser: UserProfile | null;
  onSelectEvent: (event: EventItem) => void;
  onOpenTrustModal: (event: EventItem) => void;
  onOpenRegistrationModal: (event: EventItem) => void;
}

export const RadarPage: React.FC<Props> = ({
  currentUser,
  onSelectEvent,
  onOpenTrustModal,
  onOpenRegistrationModal,
}) => {
  const [recommendations, setRecommendations] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterChip, setActiveFilterChip] = useState<'all' | 'recommended' | 'skills' | 'networking' | 'growth'>('all');
  const [maxBudget, setMaxBudget] = useState<number | undefined>(undefined);

  const loadRadar = async () => {
    setLoading(true);
    try {
      const data = await fetchOpportunityRadar(currentUser?.id || 'u-1', maxBudget);
      setRecommendations(data.recommendations);
    } catch (err) {
      console.error('Failed to load Opportunity Radar', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRadar();
  }, [currentUser, maxBudget]);

  const filteredRecommendations = recommendations.filter((ev) => {
    if (activeFilterChip === 'skills') {
      return (ev.radar?.skill_score ?? 0) >= 20;
    }
    if (activeFilterChip === 'networking') {
      return ev.category === 'tech_meetups' || ev.category === 'hackathons';
    }
    if (activeFilterChip === 'growth') {
      return (ev.radar?.goal_score ?? 0) >= 25;
    }
    if (activeFilterChip === 'recommended') {
      return (ev.radar?.radar_score ?? 0) >= 80;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* SCREEN 5: Opportunity Radar Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-theme shadow-card relative overflow-hidden transition-all">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-brand/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-2xl space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand border border-brand/20 text-xs font-bold">
            <Radar className="w-3.5 h-3.5 text-brand" />
            <span>Opportunity Radar • Multi-Factor Match Engine</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-main tracking-tight">
            Opportunity Radar
          </h1>

          <p className="text-xs sm:text-sm text-secondary leading-relaxed">
            Multi-factor recommendation matching your developer goals, technical skills, and schedule constraints against upcoming hackathons and masterclasses in Bengaluru.
          </p>
        </div>

        {/* Profile Target Goals & Budget Capsule */}
        <div className="mt-6 pt-5 border-t border-theme flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-muted uppercase text-[11px] tracking-wider">Your Match Profile:</span>
            {currentUser?.goals?.map((g, i) => (
              <span key={i} className="px-3 py-1 rounded-xl bg-surface-secondary text-main font-semibold border border-theme text-xs shadow-inner">
                🎯 {g}
              </span>
            ))}
            {currentUser?.skills?.slice(0, 3).map((sk, i) => (
              <span key={i} className="px-3 py-1 rounded-xl bg-brand/10 text-brand font-bold border border-brand/20 text-xs">
                #{sk}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted" />
            <span className="text-muted font-bold">Budget Filter:</span>
            <select
              value={maxBudget !== undefined ? String(maxBudget) : 'any'}
              onChange={(e) => setMaxBudget(e.target.value === 'any' ? undefined : Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-surface-secondary border border-theme text-main font-semibold text-xs focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="any">Any Budget</option>
              <option value="0">Free Events Only (₹0)</option>
              <option value="500">Up to ₹500</option>
              <option value="1500">Up to ₹1,500</option>
            </select>
          </div>
        </div>
      </div>

      {/* Screen 5 Category Chips Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All Opportunities', icon: Sparkles },
          { id: 'recommended', label: 'Top Recommended (80%+)', icon: Zap },
          { id: 'skills', label: 'High Skill Match', icon: BrainCircuit },
          { id: 'networking', label: 'Networking & Meetups', icon: Users },
          { id: 'growth', label: 'Career Growth', icon: TrendingUp },
        ].map((chip) => {
          const Icon = chip.icon;
          const active = activeFilterChip === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setActiveFilterChip(chip.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? 'bg-brand text-white shadow-md shadow-brand/20'
                  : 'bg-surface text-secondary hover:text-main hover:bg-surface-secondary border border-theme'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Recommendations Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 rounded-3xl bg-surface border border-theme animate-pulse shadow-card" />
          ))}
        </div>
      ) : filteredRecommendations.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface border border-theme space-y-3 shadow-card">
          <Target className="w-10 h-10 text-muted mx-auto" />
          <h3 className="text-base font-bold text-main">No matching opportunities found</h3>
          <p className="text-xs text-secondary max-w-sm mx-auto">
            Try adjusting your budget or selecting the "All Opportunities" chip.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecommendations.map((ev, idx) => {
            const radar = ev.radar;
            return (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className="p-5 sm:p-6 rounded-3xl bg-surface border border-theme hover:border-brand/50 shadow-card hover:shadow-elevated transition-all cursor-pointer flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 group"
              >
                <div className="flex items-start gap-4 flex-1">
                  
                  {/* Visual Match Badge (Screen 5) */}
                  <div className="flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand/10 border border-brand/20 text-center shrink-0">
                    <span className="text-[10px] uppercase font-bold text-muted">Rank #{idx + 1}</span>
                    <span className="text-lg sm:text-xl font-black text-brand leading-none my-0.5">
                      {radar?.radar_score}%
                    </span>
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Match</span>
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-surface-secondary text-secondary border border-theme">
                        {ev.category.replace('_', ' ')}
                      </span>
                      {ev.locality && (
                        <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                          📍 {ev.locality}
                        </span>
                      )}
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {ev.price_type === 'free' ? 'FREE ENTRY' : `₹${ev.price}`}
                      </span>
                      <TrustScoreBadge trust={ev.trust} size="sm" onClick={() => onOpenTrustModal(ev)} />
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-main group-hover:text-brand transition-colors">
                      {ev.title}
                    </h3>

                    {/* Factual Match Explanation Banner (Screen 5) */}
                    {radar?.explanation && (
                      <div className="p-3 rounded-xl bg-surface-secondary border border-theme text-xs text-main leading-relaxed font-medium">
                        ✨ <strong className="text-brand">Why Recommended:</strong> {radar.explanation}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-secondary flex-wrap">
                      <span className="flex items-center gap-1 font-bold text-main">
                        <Clock className="w-3.5 h-3.5 text-brand" />
                        {ev.date} ({ev.start_time} - {ev.end_time} IST)
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {ev.venue}, {ev.city}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4-Factor Breakdown Chips & Register Action */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 w-full lg:w-auto shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-theme">
                  {radar && (
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                      <span className="px-2 py-0.5 rounded-lg bg-surface-secondary text-secondary border border-theme">
                        Goal: {radar.goal_score}/35
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-surface-secondary text-secondary border border-theme">
                        Skill: {radar.skill_score}/30
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-surface-secondary text-secondary border border-theme">
                        Interest: {radar.interest_score}/20
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-surface-secondary text-secondary border border-theme">
                        Distance: {radar.practicality_score}/15
                      </span>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenRegistrationModal(ev);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>Claim Matched Pass</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
