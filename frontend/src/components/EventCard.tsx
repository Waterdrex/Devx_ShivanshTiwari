import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Bookmark, 
  BookmarkCheck, 
  Users, 
  Sparkles, 
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { EventItem } from '../types';
import { TrustScoreBadge } from './TrustScoreBadge';

interface Props {
  event: EventItem;
  onSelect: (event: EventItem) => void;
  onToggleBookmark: (event: EventItem) => void;
  onTogglePlanner?: (event: EventItem) => void;
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
  onOpenTrustModal,
  onQuickRegister,
  isHighlighted,
}) => {
  const fallback = CATEGORY_FALLBACK_IMAGES[event.category] || DEFAULT_FALLBACK_IMAGE;
  const [imgSrc, setImgSrc] = useState(event.banner_url || fallback);

  const availableSeats = event.available_seats ?? Math.max(0, event.total_seats - event.registered_seats);
  const isFull = availableSeats <= 0 && !event.is_registered;
  const isBookmarked = !!event.is_bookmarked;
  const isRegistered = !!event.is_registered;

  return (
    <div
      onClick={() => onSelect(event)}
      className={`group relative flex flex-col rounded-3xl overflow-hidden border transition-all duration-300 cursor-pointer ${
        isHighlighted
          ? 'ring-2 ring-brand scale-[1.01] shadow-card-hover'
          : ''
      } bg-surface hover:bg-hover-surface/50 border-theme hover:border-brand/40 shadow-card hover:shadow-card-hover`}
    >
      {/* 16:9 Event Cover Image with Badges */}
      <div className="relative h-48 w-full overflow-hidden bg-surface-secondary">
        <img
          src={imgSrc}
          alt={event.title}
          onError={() => setImgSrc(fallback)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand text-white shadow-sm">
              {event.category.replace('_', ' ')}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10">
              {event.format === 'online' ? '🌐 Virtual' : '📍 In-Person'}
            </span>
            {event.locality && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-teal-300 backdrop-blur-md border border-white/10">
                {event.locality}
              </span>
            )}
            {event.distance_km !== undefined && event.distance_km !== null && event.format !== 'online' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-950/80 text-violet-200 backdrop-blur-md border border-violet-400/30">
                {event.distance_km} km
              </span>
            )}
          </div>

          <TrustScoreBadge trust={event.trust} onClick={() => onOpenTrustModal(event)} size="sm" />
        </div>

        {/* Bottom Floating Price & Match Indicator */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          {event.radar && (
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg backdrop-blur-md bg-brand text-white shadow-sm flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              <span>{event.radar.radar_score}% Match</span>
            </span>
          )}

          <div className="ml-auto">
            <span
              className={`text-xs font-extrabold px-2.5 py-1 rounded-lg backdrop-blur-md border ${
                event.price_type === 'free'
                  ? 'bg-emerald-600/90 text-white border-emerald-400/80 shadow-xs'
                  : 'bg-black/75 text-white border-white/20'
              }`}
            >
              {event.price_type === 'free' ? 'FREE' : `₹${event.price}`}
            </span>
          </div>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Duplicate listing penalty alert if flagged */}
          {event.trust?.is_duplicate_flagged && (
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/70 px-2.5 py-1 rounded-xl border border-rose-300 dark:border-rose-800">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Suspected Clone Listing • Score Penalized</span>
            </div>
          )}

          {/* Title with link arrow */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-main group-hover:text-brand transition-colors line-clamp-2 leading-snug">
              {event.title}
            </h3>
            <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-brand opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5" />
          </div>

          <p className="text-xs text-secondary mt-1.5 line-clamp-2 leading-relaxed">
            {event.description}
          </p>

          {/* Date & Venue Logistics */}
          <div className="mt-3.5 space-y-1.5 text-xs text-secondary">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-brand shrink-0" />
              <span className="font-semibold text-main">{event.date}</span>
              <span className="text-muted">•</span>
              <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>{event.start_time} - {event.end_time}</span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{event.venue}, {event.city}</span>
            </div>
          </div>

          {/* Skills tags */}
          {event.skills && event.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {event.skills.slice(0, 3).map((sk, i) => (
                <span
                  key={i}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-surface-secondary text-secondary border border-theme"
                >
                  {sk}
                </span>
              ))}
              {event.skills.length > 3 && (
                <span className="text-[10px] text-muted px-1.5 py-0.5">
                  +{event.skills.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="pt-3 border-t border-theme/60 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted text-[11px]">
            <Users className="w-3.5 h-3.5" />
            <span>
              <strong className="text-main">{availableSeats}</strong> seats left
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(event);
              }}
              className={`p-2 rounded-xl border transition-all ${
                isBookmarked
                  ? 'bg-brand/10 border-brand text-brand'
                  : 'bg-surface border-theme text-muted hover:text-main hover:bg-hover-surface'
              }`}
              title={isBookmarked ? 'Saved to bookmarks' : 'Save event'}
            >
              {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!isRegistered && !isFull) {
                  onQuickRegister(event);
                }
              }}
              disabled={isFull && !isRegistered}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                isRegistered
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold'
                  : isFull
                  ? 'bg-surface-secondary border border-theme text-muted cursor-not-allowed'
                  : 'bg-brand hover:bg-brand-hover text-white shadow-md shadow-brand/20 active:scale-95'
              }`}
            >
              {isRegistered ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Registered</span>
                </>
              ) : isFull ? (
                <span>Full</span>
              ) : (
                <span>Register</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
