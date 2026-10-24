import React from 'react';
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Trash2, 
  CheckCircle2, 
  Sparkles,
  CalendarPlus,
  Navigation,
  ArrowRight
} from 'lucide-react';
import { PlannerScheduleResponse, EventItem } from '../types';
import { TrustScoreBadge } from '../components/TrustScoreBadge';

interface Props {
  plannerData: PlannerScheduleResponse | null;
  loading: boolean;
  onRemoveFromPlanner: (eventId: string) => Promise<void>;
  onAddToPlanner: (eventId: string) => Promise<void>;
  onSelectEvent: (event: EventItem) => void;
  onOpenTrustModal: (event: EventItem) => void;
}

export const PlannerPage: React.FC<Props> = ({
  plannerData,
  loading,
  onRemoveFromPlanner,
  onAddToPlanner,
  onSelectEvent,
  onOpenTrustModal,
}) => {
  const schedule = plannerData?.schedule || [];
  const hasConflicts = !!plannerData?.has_conflicts;
  const conflicts = plannerData?.conflicts || [];
  const travelConflicts = plannerData?.travel_conflicts || [];
  const alternatives = plannerData?.recommended_alternatives || [];

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-theme shadow-card relative overflow-hidden transition-colors">
        <div className="relative max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand border border-brand/20 text-xs font-bold">
            <CalendarDays className="w-3.5 h-3.5 text-brand" />
            <span>Smart Schedule & Transit Intelligence</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-main tracking-tight">
            Smart Planner
          </h1>

          <p className="text-xs sm:text-sm text-secondary leading-relaxed">
            Coordinate your upcoming tech conferences, hackathons, and workshops with automatic time-overlap conflict detection, Bengaluru cross-locality transit feasibility analysis, and clash-free recommendations.
          </p>
        </div>
      </div>

      {/* Dynamic Schedule Time-Overlap Conflict Alert Banner */}
      {hasConflicts && (
        <div className="p-5 rounded-3xl bg-rose-500/10 border-2 border-rose-500/40 shadow-card space-y-3 animate-fade-in">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 font-extrabold text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Time Overlap Conflict Detected! ({conflicts.length} overlapping sessions)</span>
          </div>

          <div className="space-y-2.5">
            {conflicts.map((conf, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded-2xl bg-surface border border-rose-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-rose-600 dark:text-rose-400">
                      '{conf.event_a_title}' ({conf.event_a_time})
                    </span>
                    <span className="text-rose-500 font-black">vs</span>
                    <span className="font-extrabold text-rose-600 dark:text-rose-400">
                      '{conf.event_b_title}' ({conf.event_b_time})
                    </span>
                  </div>
                  <p className="text-secondary text-[11px]">
                    Date: <strong className="text-main">{conf.date}</strong> • Direct overlap of {Math.floor(conf.overlap_minutes / 60)}h {conf.overlap_minutes % 60}m.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onRemoveFromPlanner(conf.event_b_id)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Remove 2nd Event
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Recommended Alternatives */}
          {alternatives.length > 0 && (
            <div className="pt-3 border-t border-rose-500/20 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand">
                <Sparkles className="w-3.5 h-3.5 text-brand" />
                <span>Recommended Alternatives (No Schedule Clashes)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {alternatives.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-4 rounded-2xl bg-surface border border-theme flex flex-col justify-between text-xs space-y-3 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] uppercase font-bold text-brand px-2 py-0.5 rounded-full bg-brand/10 border border-brand/20">
                          {alt.category.replace('_', ' ')}
                        </span>
                        <TrustScoreBadge trust={alt.trust} size="sm" onClick={() => onOpenTrustModal(alt)} />
                      </div>
                      <h4 className="font-bold text-main line-clamp-1">{alt.title}</h4>
                      <p className="text-secondary text-[11px] mt-0.5">
                        {alt.date} • {alt.start_time} - {alt.end_time}
                      </p>
                    </div>

                    <button
                      onClick={() => onAddToPlanner(alt.id)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 font-bold transition-all cursor-pointer text-xs"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span>Switch to This Event</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hyperlocal Transit Warnings */}
      {travelConflicts.length > 0 && (
        <div className="p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 shadow-card space-y-3 animate-fade-in">
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-extrabold text-sm">
            <Navigation className="w-5 h-5 shrink-0" />
            <span>Hyperlocal Travel Alert: Tight Cross-Locality Transit ({travelConflicts.length} warnings)</span>
          </div>

          <div className="space-y-2">
            {travelConflicts.map((tconf, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded-2xl bg-surface border border-amber-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      '{tconf.event_a_title}' ({tconf.event_a_locality})
                    </span>
                    <span className="text-amber-500 font-black">➔</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      '{tconf.event_b_title}' ({tconf.event_b_locality})
                    </span>
                  </div>
                  <p className="text-secondary text-[11px] leading-relaxed">
                    Distance: <strong className="text-main">{tconf.distance_km} km</strong> • Estimated Transit: <strong className="text-amber-600 dark:text-amber-400">{tconf.required_transit_minutes} mins</strong> • Available Gap: <strong className="text-main">{tconf.available_gap_minutes} mins</strong>
                  </p>
                  <p className="text-amber-600 dark:text-amber-400 text-[11px] italic font-semibold">
                    {tconf.warning}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clean Route Success Badge */}
      {!hasConflicts && travelConflicts.length === 0 && schedule.length > 0 && (
        <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-600 dark:text-emerald-400 font-bold shadow-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>
            Clean Schedule & Route: All {schedule.length} planned events are verified with zero timing clashes and feasible transit corridors.
          </span>
        </div>
      )}

      {/* Saved Events Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-main flex items-center gap-2">
            <span>Your Scheduled Sessions</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-surface-secondary text-secondary border border-theme">
              {schedule.length}
            </span>
          </h2>
        </div>

        {schedule.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-surface border border-theme space-y-3 shadow-card">
            <CalendarDays className="w-10 h-10 text-muted mx-auto" />
            <h3 className="text-base font-bold text-main">Your planner is empty</h3>
            <p className="text-xs text-secondary max-w-sm mx-auto">
              Add events from the Discover page to build your itinerary and verify there are no time overlaps or impossible cross-city commute gaps.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedule.map((ev) => (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className={`p-5 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-card hover:shadow-elevated ${
                  ev.has_conflict
                    ? 'bg-rose-500/10 border-rose-500/40'
                    : 'bg-surface border-theme hover:border-brand/40'
                }`}
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Date Badge */}
                  <div className="hidden sm:flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-surface-secondary border border-theme text-center shrink-0">
                    <span className="text-[10px] uppercase font-bold text-brand">
                      {ev.date.split('-')[1]}
                    </span>
                    <span className="text-xl font-black text-main">
                      {ev.date.split('-')[2]}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-surface-secondary text-secondary border border-theme">
                        {ev.category.replace('_', ' ')}
                      </span>
                      {ev.locality && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                          📍 {ev.locality}
                        </span>
                      )}
                      {ev.has_conflict && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
                          ⚠️ Time Conflict
                        </span>
                      )}
                      <TrustScoreBadge trust={ev.trust} size="sm" onClick={() => onOpenTrustModal(ev)} />
                    </div>

                    <h3 className="text-base font-extrabold text-main hover:text-brand transition-colors">
                      {ev.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-secondary flex-wrap">
                      <span className="flex items-center gap-1.5 font-bold text-main">
                        <Clock className="w-3.5 h-3.5 text-brand" />
                        {ev.start_time} - {ev.end_time} IST
                      </span>
                      <span className="text-muted">•</span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {ev.venue}, {ev.city}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFromPlanner(ev.id);
                    }}
                    title="Remove from schedule"
                    className="p-2.5 rounded-xl bg-surface-secondary hover:bg-rose-500/10 text-muted hover:text-rose-600 border border-theme hover:border-rose-500/30 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
