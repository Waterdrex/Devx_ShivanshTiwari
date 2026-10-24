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
  Navigation
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
    <div className="space-y-6 pb-16 animate-fade-in">
      
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm dark:shadow-xl relative overflow-hidden">
        <div className="relative max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 text-xs font-bold">
            <CalendarDays className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Smart Schedule & Mobility Intelligence</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Personal Event Planner
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Organize your upcoming tech conferences, hackathons, and workshops with automatic time-overlap conflict detection, Bengaluru cross-locality transit feasibility analysis, and zero-clash recommendations.
          </p>
        </div>
      </div>

      {/* Dynamic Schedule Time-Overlap Conflict Alert Banner */}
      {hasConflicts && (
        <div className="p-5 rounded-3xl bg-rose-50/90 dark:bg-gradient-to-r dark:from-rose-950/90 dark:to-navy-900 border-2 border-rose-300 dark:border-rose-500/60 shadow-lg space-y-3 animate-fade-in">
          <div className="flex items-center gap-2.5 text-rose-800 dark:text-rose-300 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>Time Overlap Conflict Detected! ({conflicts.length} overlapping sessions)</span>
          </div>

          <div className="space-y-2">
            {conflicts.map((conf, idx) => (
              <div 
                key={idx} 
                className="p-3.5 rounded-2xl bg-white dark:bg-navy-950/90 border border-rose-200 dark:border-rose-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-rose-900 dark:text-rose-200">
                      '{conf.event_a_title}' ({conf.event_a_time})
                    </span>
                    <span className="text-rose-500 font-extrabold">vs</span>
                    <span className="font-bold text-rose-900 dark:text-rose-200">
                      '{conf.event_b_title}' ({conf.event_b_time})
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                    Date: <strong className="text-slate-900 dark:text-white">{conf.date}</strong> • Direct overlap of {Math.floor(conf.overlap_minutes / 60)}h {conf.overlap_minutes % 60}m.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onRemoveFromPlanner(conf.event_b_id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm"
                  >
                    Remove 2nd Event
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Recommended Alternatives Section */}
          {alternatives.length > 0 && (
            <div className="pt-3 border-t border-rose-200 dark:border-rose-900/50 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-300">
                <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Recommended Alternatives (No Schedule Clashes)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {alternatives.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 flex flex-col justify-between text-xs space-y-2 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800">
                          {alt.category.replace('_', ' ')}
                        </span>
                        <TrustScoreBadge trust={alt.trust} size="sm" onClick={() => onOpenTrustModal(alt)} />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{alt.title}</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                        {alt.date} • {alt.start_time} - {alt.end_time}
                      </p>
                    </div>

                    <button
                      onClick={() => onAddToPlanner(alt.id)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-600/20 hover:bg-teal-100 dark:hover:bg-teal-600/30 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-500/40 font-bold transition-colors"
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

      {/* Dynamic Hyperlocal Physical Travel-Conflict Alert Banner */}
      {travelConflicts.length > 0 && (
        <div className="p-5 rounded-3xl bg-amber-50 dark:bg-gradient-to-r dark:from-amber-950/90 dark:to-navy-900 border-2 border-amber-300 dark:border-amber-500/60 shadow-lg space-y-3 animate-fade-in">
          <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300 font-bold text-sm">
            <Navigation className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Hyperlocal Travel Warning: Tight Physical Transit ({travelConflicts.length} warnings)</span>
          </div>

          <div className="space-y-2">
            {travelConflicts.map((tconf, idx) => (
              <div 
                key={idx} 
                className="p-3.5 rounded-2xl bg-white dark:bg-navy-950/90 border border-amber-200 dark:border-amber-500/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-amber-900 dark:text-amber-200">
                      '{tconf.event_a_title}' ({tconf.event_a_locality})
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-extrabold">➔</span>
                    <span className="font-bold text-amber-900 dark:text-amber-200">
                      '{tconf.event_b_title}' ({tconf.event_b_locality})
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    Distance: <strong className="text-slate-900 dark:text-white">{tconf.distance_km} km</strong> • Estimated Transit: <strong className="text-amber-700 dark:text-amber-300">{tconf.required_transit_minutes} mins</strong> • Available Gap: <strong className="text-slate-900 dark:text-white">{tconf.available_gap_minutes} mins</strong>
                  </p>
                  <p className="text-amber-700 dark:text-amber-400 text-[11px] italic font-semibold">
                    {tconf.warning}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Conflicts Success Indicator */}
      {!hasConflicts && travelConflicts.length === 0 && schedule.length > 0 && (
        <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300 font-bold shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            Clean Schedule & Route: All {schedule.length} planned events are verified with zero timing clashes and feasible transit corridors.
          </span>
        </div>
      )}

      {/* Saved Events Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Your Scheduled Sessions</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-700">
              {schedule.length}
            </span>
          </h2>
        </div>

        {schedule.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-navy-800 space-y-3 shadow-sm">
            <CalendarDays className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Your planner is empty</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Add events from the Discover page to build your itinerary and verify there are no time overlaps or impossible cross-city commute gaps.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedule.map((ev) => (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className={`p-4 sm:p-5 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:shadow-md ${
                  ev.has_conflict
                    ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/50'
                    : 'bg-white dark:bg-navy-900/90 border-slate-200 dark:border-navy-800 hover:border-violet-500/40'
                }`}
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Date Badge */}
                  <div className="hidden sm:flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-center shrink-0">
                    <span className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400">
                      {ev.date.split('-')[1]}
                    </span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {ev.date.split('-')[2]}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-700">
                        {ev.category.replace('_', ' ')}
                      </span>
                      {ev.locality && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
                          📍 {ev.locality}
                        </span>
                      )}
                      {ev.has_conflict && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 animate-pulse">
                          ⚠️ Time Conflict
                        </span>
                      )}
                      <TrustScoreBadge trust={ev.trust} size="sm" onClick={() => onOpenTrustModal(ev)} />
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-300 transition-colors">
                      {ev.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                        <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        {ev.start_time} - {ev.end_time}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {ev.venue}, {ev.city}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFromPlanner(ev.id);
                    }}
                    title="Remove from schedule"
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-navy-950 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-300 border border-slate-200 dark:border-navy-800 hover:border-rose-300 dark:hover:border-rose-700 transition-colors"
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
