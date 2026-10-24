import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Bookmark, 
  BookmarkCheck, 
  CalendarPlus, 
  CalendarCheck, 
  Users, 
  Sparkles, 
  AlertCircle,
  Flag,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { EventItem } from '../types';
import { TrustScoreBadge } from './TrustScoreBadge';

interface Props {
  event: EventItem;
  onSelect: (event: EventItem) => void;
  onToggleBookmark: (event: EventItem) => void;
  onTogglePlanner: (event: EventItem) => void;
  onOpenTrustModal: (event: EventItem) => void;
  onQuickRegister: (event: EventItem) => void;
  onReportEvent?: (event: EventItem) => void;
  isHighlighted?: boolean;
}

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  hackathons: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
  workshops: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
  tech_meetups: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80',
  coding_contests: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
  volunteering: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80',
};

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';

export const EventCard: React.FC<Props> = ({
  event,
  onSelect,
  onToggleBookmark,
  onTogglePlanner,
  onOpenTrustModal,
  onQuickRegister,
  onReportEvent,
  isHighlighted,
}) => {
  const fallback = CATEGORY_FALLBACK_IMAGES[event.category] || DEFAULT_FALLBACK_IMAGE;
  const [imgSrc, setImgSrc] = useState(event.banner_url || fallback);

  const availableSeats = event.available_seats ?? Math.max(0, event.total_seats - event.registered_seats);
  const isFull = availableSeats <= 0;
  const isBookmarked = !!event.is_bookmarked;
  const isInPlanner = !!event.is_in_planner;
  const isRegistered = !!event.is_registered;

  const categoryStyles: Record<string, { dark: string; light: string }> = {
    hackathons: {
      dark: 'bg-violet-950/90 text-violet-300 border-violet-700/60',
      light: 'bg-violet-50 text-violet-700 border-violet-200',
    },
    workshops: {
      dark: 'bg-teal-950/90 text-teal-300 border-teal-700/60',
      light: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    tech_meetups: {
      dark: 'bg-sky-950/90 text-sky-300 border-sky-700/60',
      light: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    coding_contests: {
      dark: 'bg-amber-950/90 text-amber-300 border-amber-700/60',
      light: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    volunteering: {
      dark: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60',
      light: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  };

  const catStyle = categoryStyles[event.category] || {
    dark: 'bg-slate-800 text-slate-300 border-slate-700',
    light: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div
      onClick={() => onSelect(event)}
      className={`group relative flex flex-col rounded-3xl overflow-hidden border transition-all duration-300 cursor-pointer ${
        isHighlighted
          ? 'ring-2 ring-violet-500 scale-[1.01] shadow-2xl'
          : ''
      } bg-white dark:bg-navy-900/90 hover:bg-slate-50/90 dark:hover:bg-navy-850/95 border-slate-200 dark:border-navy-800 hover:border-violet-500/50 dark:hover:border-violet-500/40 shadow-sm hover:shadow-xl dark:shadow-none dark:hover:shadow-2xl dark:hover:shadow-violet-950/30`}
    >
      {/* Image Banner */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-navy-950">
        <img
          src={imgSrc}
          alt={event.title}
          onError={() => setImgSrc(fallback)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent dark:from-navy-900 dark:via-navy-900/20 dark:to-transparent" />

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border backdrop-blur-md ${catStyle.light} dark:${catStyle.dark}`}
            >
              {event.category.replace('_', ' ')}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 dark:bg-navy-950/80 backdrop-blur-md text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-navy-700">
              {event.format === 'online' ? '🌐 Virtual' : '📍 In-Person'}
            </span>
            {event.locality && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50/90 dark:bg-teal-950/80 backdrop-blur-md text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
                {event.locality}
              </span>
            )}
          </div>

          <TrustScoreBadge trust={event.trust} onClick={() => onOpenTrustModal(event)} size="sm" />
        </div>

        {/* Price & Match Gauge */}
        <div className="absolute bottom-2.5 right-3 flex items-center gap-2">
          {event.radar && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md bg-violet-600 text-white shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-300" />
              {event.radar.radar_score}% Match
            </span>
          )}
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-md backdrop-blur-md border ${
              event.price_type === 'free'
                ? 'bg-emerald-600/90 text-white border-emerald-400'
                : 'bg-slate-900/90 dark:bg-violet-950/90 text-white dark:text-violet-300 border-slate-700 dark:border-violet-500/40'
            }`}
          >
            {event.price_type === 'free' ? 'FREE' : `$${event.price}`}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Duplicate warning callout */}
          {event.trust?.is_duplicate_flagged && (
            <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800/60">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Suspected Clone Listing • Score Penalized</span>
            </div>
          )}

          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors line-clamp-2 leading-snug">
              {event.title}
            </h3>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5" />
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
            {event.description}
          </p>

          {/* Logistics */}
          <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">{event.date}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>
                {event.start_time} - {event.end_time}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
              <span className="truncate text-slate-700 dark:text-slate-300">
                {event.venue}, {event.city}
              </span>
            </div>
          </div>

          {/* Skills Tags */}
          {event.skills && event.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {event.skills.slice(0, 3).map((sk, i) => (
                <span
                  key={i}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-700"
                >
                  {sk}
                </span>
              ))}
              {event.skills.length > 3 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-navy-800/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-navy-700">
                  +{event.skills.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-800/80 flex items-center justify-between gap-2">
          {/* Seats capacity indicator */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Users className="w-3.5 h-3.5" />
            <span>
              {isFull ? (
                <span className="text-rose-600 dark:text-rose-400 font-bold">Sold Out</span>
              ) : (
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {availableSeats} <span className="text-slate-400 dark:text-slate-500">left</span>
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Report button */}
            {onReportEvent && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReportEvent(event);
                }}
                title="Report suspicious event or clone"
                className="p-2 rounded-xl bg-slate-100 dark:bg-navy-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-navy-700/60 transition-colors"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Bookmark button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(event);
              }}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Event'}
              className={`p-2 rounded-xl border transition-colors ${
                isBookmarked
                  ? 'bg-violet-50 dark:bg-violet-950/80 text-violet-600 dark:text-violet-300 border-violet-200 dark:border-violet-500/50'
                  : 'bg-slate-100 dark:bg-navy-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-navy-700'
              }`}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>

            {/* Smart Planner Toggle button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePlanner(event);
              }}
              title={isInPlanner ? 'Remove from Planner' : 'Add to Smart Planner'}
              className={`p-2 rounded-xl border transition-colors ${
                isInPlanner
                  ? 'bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-300 border-teal-200 dark:border-teal-500/50'
                  : 'bg-slate-100 dark:bg-navy-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-navy-700'
              }`}
            >
              {isInPlanner ? (
                <CalendarCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              ) : (
                <CalendarPlus className="w-4 h-4" />
              )}
            </button>

            {/* Register button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickRegister(event);
              }}
              disabled={isFull && !isRegistered}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                isRegistered
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 cursor-default'
                  : isFull
                  ? 'bg-slate-200 dark:bg-navy-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-teal-500 text-white hover:brightness-110 active:scale-95 shadow-md shadow-violet-900/20'
              }`}
            >
              {isRegistered ? 'Registered ✓' : isFull ? 'Full' : 'Register'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
