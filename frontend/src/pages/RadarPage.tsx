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
  DollarSign
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

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      
      {/* Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm dark:shadow-xl relative overflow-hidden">
        <div className="relative max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20 text-xs font-bold">
            <Radar className="w-3.5 h-3.5 text-violet-600 dark:text-teal-400" />
            <span>AI Opportunity Match Engine</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Opportunity Radar
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Multi-factor recommendation matching your developer goals, technical skills, and schedule constraints against upcoming hackathons and masterclasses.
          </p>
        </div>

        {/* User Profile Context Capsule */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-navy-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-500 dark:text-slate-400">Target Goals:</span>
            {currentUser?.goals?.map((g, i) => (
              <span key={i} className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-teal-300 font-semibold border border-slate-200 dark:border-teal-500/30 text-[11px]">
                {g}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Budget:</span>
            <select
              value={maxBudget !== undefined ? String(maxBudget) : 'any'}
              onChange={(e) => setMaxBudget(e.target.value === 'any' ? undefined : Number(e.target.value))}
              className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 text-slate-800 dark:text-slate-200 font-semibold text-xs focus:outline-none"
            >
              <option value="any">Any Budget</option>
              <option value="0">Free Only ($0)</option>
              <option value="50">Up to $50</option>
              <option value="100">Up to $100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recommendations Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-3xl bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-800 animate-pulse" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-navy-800 space-y-3 shadow-sm">
          <Target className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No matches found for current budget filter</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Try adjusting your budget or explore the full catalog in the Discover tab.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((ev, idx) => {
            const radar = ev.radar;
            return (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 hover:border-violet-500/50 shadow-sm hover:shadow-xl dark:shadow-none dark:hover:shadow-2xl transition-all cursor-pointer flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 group"
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Rank & Radar Gauge Pill */}
                  <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/10 to-teal-500/10 dark:from-violet-950 dark:to-teal-950 border border-violet-500/30 text-center shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Rank #{idx + 1}</span>
                    <span className="text-lg font-extrabold text-violet-700 dark:text-teal-300">{radar?.radar_score}%</span>
                    <span className="text-[9px] text-slate-500 font-semibold">Match</span>
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-700">
                        {ev.category.replace('_', ' ')}
                      </span>
                      {ev.locality && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
                          📍 {ev.locality}
                        </span>
                      )}
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {ev.price_type === 'free' ? 'FREE' : `$${ev.price}`}
                      </span>
                      <TrustScoreBadge trust={ev.trust} size="sm" onClick={() => onOpenTrustModal(ev)} />
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                      {ev.title}
                    </h3>

                    {/* Explainable Match Reason Banner */}
                    {radar?.explanation && (
                      <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-500/30 text-xs text-violet-900 dark:text-violet-200 leading-relaxed font-medium">
                        ✨ <strong>Why Recommended:</strong> {radar.explanation}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                        <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        {ev.date} ({ev.start_time} - {ev.end_time})
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {ev.venue}, {ev.city}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4-Factor Breakdown Chips & Register Button */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 w-full lg:w-auto shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-navy-800">
                  {radar && (
                    <div className="grid grid-cols-2 sm:flex lg:grid lg:grid-cols-2 gap-1.5 text-[10px] font-bold">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-navy-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-800">
                        Goal: {radar.goal_score}/35
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-navy-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-800">
                        Skill: {radar.skill_score}/30
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-navy-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-800">
                        Domain: {radar.interest_score}/20
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-navy-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-800">
                        Location: {radar.practicality_score}/15
                      </span>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenRegistrationModal(ev);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 text-white font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-violet-900/20"
                  >
                    Claim Matched Pass
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
