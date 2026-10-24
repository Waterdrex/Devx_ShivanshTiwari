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
  ArrowRight
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-navy-950/85 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/80 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-0 relative text-slate-900 dark:text-slate-100 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner with Close button */}
        <div className="relative h-56 sm:h-64 w-full bg-slate-900 overflow-hidden">
          <img
            src={event.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/30" />
          
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {onReportEvent && (
              <button
                onClick={() => onReportEvent(event)}
                title="Report Event"
                className="p-2 rounded-full bg-black/50 hover:bg-rose-950/80 text-white hover:text-rose-400 border border-white/20 transition-colors"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-violet-600 text-white shadow-sm">
                  {event.category.replace('_', ' ')}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/60 text-teal-300 border border-teal-500/40 backdrop-blur-md">
                  {event.format === 'online' ? '🌐 Virtual' : '📍 In-Person'}
                </span>
                {event.locality && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/60 text-teal-300 border border-teal-500/40 backdrop-blur-md">
                    📍 {event.locality}
                  </span>
                )}
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
                  {event.price_type === 'free' ? 'FREE ENTRY' : `$${event.price}`}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                {event.title}
              </h2>
            </div>

            <TrustScoreBadge 
              trust={event.trust} 
              onClick={() => onOpenTrustModal(event)} 
              size="lg"
            />
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6">
          
          {/* Quick Action Toolbar */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-navy-800 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>
                Capacity: <strong className="text-slate-900 dark:text-white">{event.registered_seats}</strong> / {event.total_seats} registered
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleBookmark(event)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  event.is_bookmarked
                    ? 'bg-violet-50 dark:bg-violet-950/90 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-500/50'
                    : 'bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {event.is_bookmarked ? <BookmarkCheck className="w-4 h-4 text-violet-600 dark:text-violet-400" /> : <Bookmark className="w-4 h-4" />}
                <span>{event.is_bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
              </button>

              <button
                onClick={() => onTogglePlanner(event)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  event.is_in_planner
                    ? 'bg-teal-50 dark:bg-teal-950/90 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-500/50'
                    : 'bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {event.is_in_planner ? <CalendarCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" /> : <CalendarPlus className="w-4 h-4" />}
                <span>{event.is_in_planner ? 'Saved in Planner' : 'Add to Planner'}</span>
              </button>
            </div>
          </div>

          {/* Logistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-1">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Calendar className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span className="font-bold uppercase tracking-wider">Date & Time</span>
              </div>
              <p className="font-bold text-slate-900 dark:text-slate-200 pl-6 text-sm">
                {event.date}
              </p>
              <p className="text-slate-500 dark:text-slate-400 pl-6">
                {event.start_time} - {event.end_time} IST
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-1">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <MapPin className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                <span className="font-bold uppercase tracking-wider">Venue Location</span>
              </div>
              <p className="font-bold text-slate-900 dark:text-slate-200 pl-6 text-sm">
                {event.venue}
              </p>
              <p className="text-slate-500 dark:text-slate-400 pl-6">
                {event.locality ? `${event.locality}, ` : ''}{event.city}, {event.location}
              </p>
            </div>
          </div>

          {/* Overview */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-2">
              Event Overview
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Agenda */}
          {event.agenda && (
            <div>
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-2">
                Program Timeline & Agenda
              </h4>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
                {event.agenda}
              </div>
            </div>
          )}

          {/* Skills / Tech Stack */}
          {event.skills && event.skills.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-2">
                Target Technologies & Focus Areas
              </h4>
              <div className="flex flex-wrap gap-2">
                {event.skills.map((sk, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-navy-800 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-teal-500/30 font-semibold"
                  >
                    #{sk}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Host & Organizer Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-navy-800 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                Organized by
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <h5 className="text-sm font-bold text-slate-900 dark:text-white">{event.organizer_name}</h5>
                {event.organizer_verified ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Host
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/30">
                    Community Host
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {event.organizer_email}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  {event.organizer_rating} / 5.0
                </span>
              </div>
            </div>

            <button
              onClick={() => onOpenTrustModal(event)}
              className="text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-navy-800 hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-700 font-semibold shrink-0 shadow-sm"
            >
              Why Trust Score {event.trust?.score}?
            </button>
          </div>

          {/* Registration Section */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-gradient-to-br dark:from-violet-950/40 dark:via-navy-900 dark:to-teal-950/40 border border-slate-200 dark:border-violet-500/30 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-teal-400" />
              Event Registration & Pass
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Includes digital attendee pass code, t-shirt size selection, and meal preferences.
            </p>

            {event.is_registered ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-900 dark:text-emerald-200">Registration Confirmed!</div>
                  <div>Your pass has been secured. View ticket pass in the <strong>My Passes</strong> tab.</div>
                </div>
              </div>
            ) : isFull ? (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-500/40 flex items-center gap-3 text-rose-800 dark:text-rose-300 text-xs font-semibold">
                <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
                <div>This event has reached maximum capacity ({event.total_seats} attendees). Check the Smart Planner for alternative events.</div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">Instant Attendee Registration</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Complete attendee profile, get digital pass code (ES-XXXX)</div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenRegistrationFlow) onOpenRegistrationFlow(event);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 text-white font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-violet-900/20 flex items-center justify-center gap-2 shrink-0"
                >
                  <span>Register for Event</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
