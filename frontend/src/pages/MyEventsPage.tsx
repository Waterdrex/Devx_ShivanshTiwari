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
  X 
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

  const activeRegistrations = registrations.filter((r) => r.status === 'confirmed');
  const pastOrCancelled = registrations.filter((r) => r.status !== 'confirmed');

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm dark:shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20 text-xs font-bold">
            <Ticket className="w-3.5 h-3.5 text-violet-600 dark:text-teal-400" />
            <span>Attendee Passport & Passes</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Event Passes
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl">
            Access your verified entry passes, review event logistics, and manage ticket cancellations to release spots for other community members.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-center">
            <span className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Active Passes</span>
            <span className="text-xl font-extrabold text-teal-600 dark:text-teal-300">{activeRegistrations.length}</span>
          </div>
        </div>
      </div>

      {/* Active Passes Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>Active Event Passes</span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40">
            {activeRegistrations.length}
          </span>
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-44 rounded-3xl bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-800 animate-pulse" />
            ))}
          </div>
        ) : activeRegistrations.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-navy-800 space-y-3 shadow-sm">
            <Ticket className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No active event registrations</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              You haven't registered for any upcoming events yet. Discover top hackathons, workshops, and meetups in Bengaluru.
            </p>
            <button
              onClick={onExploreEvents}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 text-white font-bold text-xs hover:brightness-110 shadow-md shadow-violet-900/20"
            >
              Discover Events
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeRegistrations.map((reg) => (
              <div
                key={reg.id}
                className="p-5 rounded-3xl bg-white dark:bg-navy-900/90 border border-slate-200 dark:border-navy-800 hover:border-violet-500/40 transition-all flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                      {reg.category.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-300 bg-slate-50 dark:bg-navy-950 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-500/40">
                      {reg.ticket_code}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">{reg.title}</h3>

                  <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-violet-500" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{reg.date}</span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <Clock className="w-3.5 h-3.5 text-teal-500" />
                      <span>{reg.start_time} - {reg.end_time}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span className="truncate">{reg.locality ? `${reg.locality}, ` : ''}{reg.venue}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveTicketModal(reg)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-bold border border-slate-200 dark:border-navy-700 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5 text-teal-500" />
                    <span>View Digital Pass</span>
                  </button>

                  <button
                    onClick={() => setCancelModalItem(reg)}
                    className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors"
                  >
                    Cancel Registration
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past / Cancelled History */}
      {pastOrCancelled.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-navy-800">
          <h2 className="text-base font-bold text-slate-600 dark:text-slate-400">Past & Cancelled Activity</h2>
          <div className="space-y-2">
            {pastOrCancelled.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-850 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400"
              >
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{item.title}</span>
                  <div className="text-[11px] mt-0.5">{item.date} • Code: {item.ticket_code}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-navy-800 text-slate-600 dark:text-slate-400 font-semibold capitalize">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ticket Pass Modal */}
      {activeTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-navy-950/85 backdrop-blur-md animate-fade-in">
          <div 
            className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-3xl max-w-md w-full shadow-2xl p-6 relative text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveTicketModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 tracking-wider">Official Event Entry Pass</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{activeTicketModal.title}</h3>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-center space-y-3">
              <div className="w-24 h-24 mx-auto p-2 bg-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-sm">
                <QrCode className="w-20 h-20 text-slate-900" />
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold">Pass Code</span>
                <div className="font-mono text-lg font-extrabold text-violet-600 dark:text-violet-400 tracking-wider">
                  {activeTicketModal.ticket_code}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left text-xs pt-2 border-t border-slate-200 dark:border-navy-800 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-400">Date</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{activeTicketModal.date}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Time</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{activeTicketModal.start_time} - {activeTicketModal.end_time}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400">Venue</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{activeTicketModal.venue}, {activeTicketModal.city}</div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => window.print()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 text-white font-bold text-xs hover:brightness-110 active:scale-95 shadow-md shadow-violet-900/20"
              >
                Print / Save Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-navy-950/85 backdrop-blur-md animate-fade-in">
          <div 
            className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-3xl max-w-md w-full shadow-2xl p-6 relative text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Cancel Event Pass</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">{cancelModalItem.title}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Cancelling your ticket pass will release your seat capacity back to the community for other developers on the waiting list.
            </p>

            <div className="mb-4">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Reason for cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-violet-500 font-medium"
              >
                <option value="Schedule conflict or travel limitation">Schedule conflict or travel limitation</option>
                <option value="Registered by mistake">Registered by mistake</option>
                <option value="Joining another hackathon">Joining another hackathon</option>
                <option value="Other commitment">Other personal commitment</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCancelModalItem(null)}
                className="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-xs font-semibold"
              >
                Keep Pass
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancellingId !== null}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-900/20"
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
