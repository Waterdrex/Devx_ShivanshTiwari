import React from 'react';
import { 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Bookmark, 
  Sparkles, 
  ChevronRight,
  Ticket
} from 'lucide-react';
import { EventItem } from '../types';

interface Props {
  event: EventItem;
  isSelected?: boolean;
  onSelect: (event: EventItem) => void;
  onToggleBookmark: (event: EventItem) => void;
  onOpenTrustModal?: (event: EventItem) => void;
  onQuickRegister?: (event: EventItem) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  hackathons: { bg: '#8B5CF6', text: 'Hackathons', icon: '⚡' },
  workshops: { bg: '#14B8A6', text: 'Workshops', icon: '🛠️' },
  tech_meetups: { bg: '#38BDF8', text: 'Meetup', icon: '☕' },
  coding_contests: { bg: '#F59E0B', text: 'Contest', icon: '🏆' },
  volunteering: { bg: '#10B981', text: 'Volunteering', icon: '🌱' },
};

export const CompactEventCard: React.FC<Props> = ({
  event,
  isSelected = false,
  onSelect,
  onToggleBookmark,
  onOpenTrustModal,
  onQuickRegister,
  onMouseEnter,
  onMouseLeave,
}) => {
  const cat = CATEGORY_COLORS[event.category] || { bg: '#8B5CF6', text: 'Event', icon: '🌟' };
  const isFree = event.price_type === 'free';
  const availableSeats = event.available_seats ?? (event.total_seats - (event.registered_seats || 0));

  return (
    <div
      onClick={() => onSelect(event)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'bg-brand/5 border-brand shadow-card ring-2 ring-brand/30'
          : 'bg-surface hover:bg-surface-secondary/60 border-theme hover:border-brand/40 shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Cover Thumbnail */}
        <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden shrink-0 ring-1 ring-theme">
          <img
            src={
              event.banner_url ||
              'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&q=80'
            }
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Price Tag Pill Overlay */}
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-black/75 text-white backdrop-blur-sm">
            {isFree ? 'FREE' : `₹${event.price}`}
          </div>
        </div>

        {/* Content Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Top Tag Row */}
            <div className="flex items-center justify-between gap-1 mb-1">
              <span
                className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                style={{
                  backgroundColor: `${cat.bg}1A`,
                  color: cat.bg,
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.text}</span>
              </span>

              {/* Bookmark Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBookmark(event);
                }}
                title={event.is_bookmarked ? 'Remove Bookmark' : 'Bookmark Event'}
                className="p-1 rounded-lg text-muted hover:text-brand transition-colors cursor-pointer"
              >
                <Bookmark
                  className={`w-3.5 h-3.5 ${
                    event.is_bookmarked ? 'fill-brand text-brand' : ''
                  }`}
                />
              </button>
            </div>

            {/* Title */}
            <h4 className="text-xs sm:text-sm font-bold text-main line-clamp-1 group-hover:text-brand transition-colors">
              {event.title}
            </h4>

            {/* Date & Time */}
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-secondary">
              <Calendar className="w-3 h-3 text-brand shrink-0" />
              <span>{event.date}</span>
              <span className="text-muted">• {event.start_time}</span>
            </div>

            {/* Venue & Locality & Distance */}
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-secondary truncate">
              <MapPin className="w-3 h-3 text-muted shrink-0" />
              <span className="truncate">
                <strong className="text-main">{event.locality || 'Bengaluru'}</strong> • {event.venue}
              </span>
              {typeof event.distance_km === 'number' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand/10 text-brand font-semibold shrink-0">
                  {event.distance_km.toFixed(1)} km
                </span>
              )}
            </div>
          </div>

          {/* Bottom Trust & Action Strip */}
          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-theme/60">
            {/* Trust badge */}
            {event.trust && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenTrustModal?.(event);
                }}
                className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{event.trust.score}% Trust</span>
              </button>
            )}

            {/* Seats status & action */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-secondary">
                {availableSeats > 0 ? (
                  <span>
                    <strong className="text-main font-semibold">{availableSeats}</strong> seats left
                  </span>
                ) : (
                  <span className="text-rose-500 font-bold">Sold Out</span>
                )}
              </span>

              {event.is_registered ? (
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Pass Active
                </span>
              ) : onQuickRegister && availableSeats > 0 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickRegister(event);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-brand text-white hover:bg-brand-hover active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  <Ticket className="w-3 h-3" />
                  <span>Get Pass</span>
                </button>
              ) : null}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
