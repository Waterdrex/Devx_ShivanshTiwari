import React from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ShieldCheck, 
  Mail, 
  Star, 
  Bookmark, 
  BookmarkCheck, 
  CalendarPlus, 
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Flag,
  ArrowRight,
  Share2,
  Compass
} from 'lucide-react';
import { EventItem } from '../types';
import { TrustScoreBadge } from './TrustScoreBadge';

interface Props {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleBookmark: (event: EventItem) => void;
  onTogglePlanner: (event: EventItem) => void;
  onRegister: (eventId: string, name: string, email: string) => Promise<void>;
  onOpenTrustModal: (event: EventItem) => void;
  onReportEvent?: (event: EventItem) => void;
  onOpenRegistrationFlow?: (event: EventItem) => void;
}

export const EventDetailModal: React.FC<Props> = ({
  event,
  isOpen,
  onClose,
  onToggleBookmark,
  onTogglePlanner,
  onOpenTrustModal,
  onReportEvent,
  onOpenRegistrationFlow,
}) => {
  if (!isOpen || !event) return null;

  const isFull = (event.available_seats ?? 0) <= 0 && !event.is_registered;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-surface border border-theme rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-elevated p-0 relative text-main transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner with Close and Share buttons */}
        <div className="relative h-60 sm:h-72 w-full bg-slate-900 overflow-hidden">
          <img
            src={event.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
          
          {/* Action buttons top-right */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Share Event Link"
              className="p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 transition-all cursor-pointer backdrop-blur-md"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {onReportEvent && (
              <button
                onClick={() => onReportEvent(event)}
                title="Report Inaccurate Event"
                className="p-2.5 rounded-full bg-black/50 hover:bg-rose-950/80 text-white hover:text-rose-400 border border-white/20 transition-all cursor-pointer backdrop-blur-md"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 transition-all cursor-pointer backdrop-blur-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Banner bottom info */}
          <div className="absolute bottom-4 left-5 right-5 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-bold px-3 py-1 rounded-full bg-brand text-white shadow-sm">
                  {event.category.replace('_', ' ')}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-black/60 text-emerald-300 border border-emerald-500/40 backdrop-blur-md font-semibold">
                  {event.format === 'online' ? '🌐 Virtual' : '📍 In-Person'}
                </span>
                {event.locality && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-black/60 text-teal-300 border border-teal-500/40 backdrop-blur-md font-semibold">
                    📍 {event.locality}
                  </span>
                )}
                {typeof event.distance_km === 'number' && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-black/60 text-purple-300 border border-purple-500/40 backdrop-blur-md font-semibold">
                    {event.distance_km} km away
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight">
                {event.title}
              </h2>
            </div>

            <div className="shrink-0">
              <TrustScoreBadge 
                trust={event.trust} 
                onClick={() => onOpenTrustModal(event)} 
                size="lg"
              />
            </div>
          </div>
        </div>

        {/* Modal Body: Two column desktop layout */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Details (Col 8) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Host info card */}
            <div className="p-4 rounded-2xl bg-surface-secondary border border-theme flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-base shrink-0 border border-brand/20">
                  {event.organizer_name ? event.organizer_name[0] : 'O'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-bold text-main">{event.organizer_name}</h5>
                    {event.organizer_verified ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3" /> Verified Host
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        Community
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-secondary mt-0.5">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-muted" />
                      {event.organizer_email}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-main">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      {event.organizer_rating} / 5.0
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenTrustModal(event)}
                className="text-xs px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-secondary text-secondary hover:text-main border border-theme font-semibold shrink-0 cursor-pointer transition-all"
              >
                Inspect Trust
              </button>
            </div>

            {/* Event Overview */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider font-bold text-muted">
                About this Event
              </h4>
              <p className="text-sm text-secondary leading-relaxed font-normal">
                {event.description}
              </p>
            </div>

            {/* Agenda & Schedule */}
            {event.agenda && (
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-muted">
                  Program Schedule & Milestones
                </h4>
                <div className="p-4 rounded-2xl bg-surface-secondary border border-theme text-xs text-secondary leading-relaxed font-mono whitespace-pre-line">
                  {event.agenda}
                </div>
              </div>
            )}

            {/* Skills & Technologies */}
            {event.skills && event.skills.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-muted">
                  Focus Technologies & Tools
                </h4>
                <div className="flex flex-wrap gap-2">
                  {event.skills.map((sk, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-3 py-1 rounded-xl bg-brand/10 text-brand border border-brand/20 font-bold"
                    >
                      #{sk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location & Coordinates */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider font-bold text-muted">
                Venue & Navigation
              </h4>
              <div className="p-4 rounded-2xl bg-surface-secondary border border-theme space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-main">
                  <MapPin className="w-4 h-4 text-brand" />
                  <span>{event.venue}</span>
                </div>
                <p className="text-secondary pl-6">
                  {event.locality ? `${event.locality}, ` : ''}{event.city}, {event.location}
                </p>
                {typeof event.latitude === 'number' && typeof event.longitude === 'number' && (
                  <div className="pl-6 text-[11px] text-muted font-mono">
                    GPS Coordinates: {event.latitude.toFixed(4)}° N, {event.longitude.toFixed(4)}° E
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Sticky Booking & Pass Summary Card (Col 5) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl bg-surface-secondary border border-theme shadow-card space-y-5">
              
              {/* Pricing & Seat Status */}
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] text-muted uppercase font-bold tracking-wider">Admission</span>
                  <div className="text-2xl font-black text-main">
                    {event.price_type === 'free' ? (
                      <span className="text-emerald-600 dark:text-emerald-400">FREE</span>
                    ) : (
                      `₹${event.price}`
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-muted uppercase font-bold tracking-wider">Availability</span>
                  <div className="text-sm font-bold text-main">
                    {event.available_seats ?? 0} seats left
                  </div>
                </div>
              </div>

              {/* Progress bar of seats */}
              <div className="space-y-1">
                <div className="w-full h-2 rounded-full bg-theme overflow-hidden">
                  <div 
                    className="h-full bg-brand rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, Math.round(((event.registered_seats ?? 0) / (event.total_seats || 1)) * 100))}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted font-medium">
                  <span>{event.registered_seats} reserved</span>
                  <span>{event.total_seats} total capacity</span>
                </div>
              </div>

              {/* Date & Time details */}
              <div className="p-3.5 rounded-2xl bg-surface border border-theme space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand shrink-0" />
                  <span className="font-bold text-main">{event.date}</span>
                </div>
                <div className="flex items-center gap-2 text-secondary">
                  <Clock className="w-4 h-4 text-brand shrink-0" />
                  <span>{event.start_time} - {event.end_time} IST</span>
                </div>
              </div>

              {/* Register / Ticket CTA */}
              <div>
                {event.is_registered ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <div>
                      <div>Pass Confirmed!</div>
                      <div className="text-[11px] font-normal text-secondary">View digital ticket in My Passes hub.</div>
                    </div>
                  </div>
                ) : isFull ? (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div>Event is sold out. Check Smart Planner for recommended alternatives.</div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenRegistrationFlow) onOpenRegistrationFlow(event);
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl bg-brand hover:bg-brand-hover text-white font-extrabold text-sm shadow-md shadow-brand/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Register for Event</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Bookmark & Planner Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-theme">
                <button
                  onClick={() => onToggleBookmark(event)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    event.is_bookmarked
                      ? 'bg-brand/10 text-brand border-brand/30'
                      : 'bg-surface text-secondary hover:text-main border-theme'
                  }`}
                >
                  {event.is_bookmarked ? <BookmarkCheck className="w-3.5 h-3.5 text-brand" /> : <Bookmark className="w-3.5 h-3.5" />}
                  <span>{event.is_bookmarked ? 'Saved' : 'Bookmark'}</span>
                </button>

                <button
                  onClick={() => onTogglePlanner(event)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    event.is_in_planner
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-surface text-secondary hover:text-main border-theme'
                  }`}
                >
                  {event.is_in_planner ? <CalendarCheck className="w-3.5 h-3.5 text-emerald-500" /> : <CalendarPlus className="w-3.5 h-3.5" />}
                  <span>{event.is_in_planner ? 'In Planner' : 'Add Planner'}</span>
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
