import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Calendar, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Sparkles, 
  QrCode, 
  Download, 
  X,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { RegistrationItem, UserProfile } from '../types';
import { fetchMyRegistrations, cancelRegistration } from '../api';

interface Props {
  currentUser: UserProfile | null;
  onExploreEvents: () => void;
  showToast: (msg: string, type: 'success' | 'warning' | 'info') => void;
}

export const MyEventsPage: React.FC<Props> = ({ currentUser, onExploreEvents, showToast }) => {
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [activeTicketModal, setActiveTicketModal] = useState<RegistrationItem | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelModalItem, setCancelModalItem] = useState<RegistrationItem | null>(null);
  const [cancelReason, setCancelReason] = useState('Schedule conflict or travel limitation');

  const loadRegistrations = async () => {
    setLoading(true);
    try {
      const data = await fetchMyRegistrations(currentUser?.id || 'u-1');
      setRegistrations(data.registrations);
    } catch (err) {
      console.error('Failed to load registrations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, [currentUser]);

  const handleConfirmCancel = async () => {
    if (!cancelModalItem) return;
    setCancellingId(cancelModalItem.id);
    try {
      const res = await cancelRegistration(cancelModalItem.id, cancelReason);
      showToast(res.message, 'info');
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === cancelModalItem.id
            ? { ...r, status: 'cancelled', cancellation_reason: cancelReason }
            : r
        )
      );
      setCancelModalItem(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel registration', 'warning');
    } finally {
      setCancellingId(null);
    }
  };

  const upcomingPasses = registrations.filter((r) => r.status === 'confirmed');
  const cancelledPasses = registrations.filter((r) => r.status === 'cancelled');
  const pastPasses = registrations.filter((r) => r.status === 'attended' || (r.status === 'confirmed' && new Date(r.date) < new Date('2026-10-01')));

  const displayedPasses = 
    activeTab === 'upcoming' 
      ? upcomingPasses 
      : activeTab === 'past' 
      ? pastPasses 
      : cancelledPasses;

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* SCREEN 8: My Passes Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-theme shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand border border-brand/20 text-xs font-bold">
            <Ticket className="w-3.5 h-3.5 text-brand" />
            <span>Digital Ticket Wallet & Verification</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-main tracking-tight">
            My Passes
          </h1>
          <p className="text-xs sm:text-sm text-secondary max-w-xl">
            View your verified entry passes, inspect venue GPS coordinates, and manage atomic cancellations to free up spots.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-5 py-2.5 rounded-2xl bg-surface-secondary border border-theme text-center">
            <span className="block text-[10px] uppercase font-bold text-muted">Active Passes</span>
            <span className="text-2xl font-black text-brand">{upcomingPasses.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Upcoming, Past, Cancelled */}
      <div className="flex items-center gap-2 border-b border-theme pb-1">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-brand text-white shadow-sm'
              : 'text-secondary hover:text-main hover:bg-surface-secondary'
          }`}
        >
          <span>Upcoming Passes</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-surface-secondary text-secondary'
          }`}>
            {upcomingPasses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'past'
              ? 'bg-brand text-white shadow-sm'
              : 'text-secondary hover:text-main hover:bg-surface-secondary'
          }`}
        >
          <span>Past Events</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === 'past' ? 'bg-white/20 text-white' : 'bg-surface-secondary text-secondary'
          }`}>
            {pastPasses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('cancelled')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'cancelled'
              ? 'bg-brand text-white shadow-sm'
              : 'text-secondary hover:text-main hover:bg-surface-secondary'
          }`}
        >
          <span>Cancelled</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === 'cancelled' ? 'bg-white/20 text-white' : 'bg-surface-secondary text-secondary'
          }`}>
            {cancelledPasses.length}
          </span>
        </button>
      </div>

      {/* Passes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map((n) => (
            <div key={n} className="h-56 rounded-3xl bg-surface border border-theme animate-pulse shadow-card" />
          ))}
        </div>
      ) : displayedPasses.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface border border-theme space-y-3 shadow-card">
          <Ticket className="w-10 h-10 text-muted mx-auto" />
          <h3 className="text-base font-bold text-main">No {activeTab} passes found</h3>
          <p className="text-xs text-secondary max-w-sm mx-auto">
            {activeTab === 'upcoming' 
              ? "You don't have any upcoming registered events. Explore the tech calendar in Bengaluru to claim your pass."
              : `You have no ${activeTab} passes on record.`
            }
          </p>
          {activeTab === 'upcoming' && (
            <button
              onClick={onExploreEvents}
              className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/20 cursor-pointer transition-all active:scale-95"
            >
              Discover Events
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedPasses.map((reg) => (
            /* Perforated Ticket Pass Card (Screen 8) */
            <div
              key={reg.id}
              className="relative rounded-3xl bg-surface border border-theme shadow-card hover:border-brand/40 transition-all overflow-hidden flex flex-col justify-between"
            >
              {/* Left and Right notches for ticket aesthetic */}
              <div className="absolute top-[48%] -left-3 -translate-y-1/2 w-6 h-6 rounded-full bg-page border border-theme z-10" />
              <div className="absolute top-[48%] -right-3 -translate-y-1/2 w-6 h-6 rounded-full bg-page border border-theme z-10" />

              {/* Pass Header */}
              <div className="p-5 sm:p-6 pb-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                    {reg.category.replace('_', ' ')}
                  </span>
                  <span className="font-mono text-xs font-black text-brand bg-surface-secondary px-3 py-1 rounded-xl border border-theme tracking-wider">
                    {reg.ticket_code}
                  </span>
                </div>

                <h3 className="font-extrabold text-main text-base sm:text-lg leading-snug">
                  {reg.title}
                </h3>

                <div className="space-y-1.5 text-xs text-secondary">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-brand shrink-0" />
                    <span className="font-bold text-main">{reg.date}</span>
                    <span className="text-muted">•</span>
                    <Clock className="w-3.5 h-3.5 text-brand shrink-0" />
                    <span>{reg.start_time} - {reg.end_time} IST</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{reg.locality ? `${reg.locality}, ` : ''}{reg.venue}</span>
                  </div>
                </div>
              </div>

              {/* Perforation dashed line */}
              <div className="border-t border-dashed border-theme" />

              {/* Pass Actions Footer */}
              <div className="p-4 sm:px-6 bg-surface-secondary/50 flex items-center justify-between gap-3">
                <button
                  onClick={() => setActiveTicketModal(reg)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-secondary text-main text-xs font-bold border border-theme shadow-sm transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-brand" />
                  <span>View Pass</span>
                </button>

                {reg.status === 'confirmed' ? (
                  <button
                    onClick={() => setCancelModalItem(reg)}
                    className="px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel Pass
                  </button>
                ) : (
                  <span className="text-xs font-bold uppercase tracking-wider text-muted px-2.5 py-1 rounded-lg bg-surface-secondary">
                    {reg.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Pass Modal */}
      {activeTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
          <div 
            className="bg-surface border border-theme rounded-3xl max-w-md w-full shadow-elevated p-6 sm:p-7 relative text-main transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveTicketModal(null)}
              className="absolute top-5 right-5 text-muted hover:text-main p-1 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-brand tracking-wider">
                Official Digital Event Pass
              </span>
              <h3 className="text-lg font-extrabold text-main leading-snug">
                {activeTicketModal.title}
              </h3>
            </div>

            {/* Stylized QR Card */}
            <div className="p-5 rounded-3xl bg-surface-secondary border border-theme text-center space-y-4">
              <div className="w-32 h-32 mx-auto p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-md">
                <QrCode className="w-24 h-24 text-slate-900" />
              </div>

              <div>
                <span className="text-[10px] uppercase text-muted font-bold tracking-wider">
                  Verified Pass Code
                </span>
                <div className="font-mono text-xl font-black text-brand tracking-widest mt-0.5">
                  {activeTicketModal.ticket_code}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left text-xs pt-3 border-t border-theme">
                <div>
                  <span className="text-[10px] text-muted">Date</span>
                  <div className="font-bold text-main">{activeTicketModal.date}</div>
                </div>
                <div>
                  <span className="text-[10px] text-muted">Time</span>
                  <div className="font-bold text-main">{activeTicketModal.start_time} - {activeTicketModal.end_time}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-muted">Venue</span>
                  <div className="font-semibold text-main truncate">{activeTicketModal.venue}, {activeTicketModal.city}</div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => window.print()}
                className="w-full py-3 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Print / Save Pass</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
          <div 
            className="bg-surface border border-theme rounded-3xl max-w-md w-full shadow-elevated p-6 relative text-main transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-main">Cancel Event Pass</h3>
                <p className="text-xs text-secondary truncate max-w-xs">{cancelModalItem.title}</p>
              </div>
            </div>

            <p className="text-xs text-secondary mb-4 leading-relaxed">
              Cancelling your ticket releases seat capacity back to the community for other waiting developers.
            </p>

            <div className="mb-4">
              <label className="block text-[11px] font-bold text-main mb-1.5">Reason for cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main text-xs focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="Schedule conflict or travel limitation">Schedule conflict or travel limitation</option>
                <option value="Registered by mistake">Registered by mistake</option>
                <option value="Joining another hackathon">Joining another hackathon</option>
                <option value="Other personal commitment">Other personal commitment</option>
              </select>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setCancelModalItem(null)}
                className="px-4 py-2 rounded-xl text-secondary hover:text-main text-xs font-semibold cursor-pointer"
              >
                Keep Pass
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancellingId !== null}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-900/20 cursor-pointer disabled:opacity-50"
              >
                {cancellingId !== null ? 'Releasing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
