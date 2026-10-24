import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  Trash2, 
  CheckCircle2, 
  X,
  Sparkles,
  ShieldAlert,
  Flag,
  EyeOff,
  Check,
  RefreshCw
} from 'lucide-react';
import { OrganizerStats, EventItem, ModerationReport } from '../types';
import { 
  fetchOrganizerStats, 
  createEvent, 
  deleteEvent, 
  fetchAdminReports, 
  resolveAdminReport 
} from '../api';
import { TrustScoreBadge } from '../components/TrustScoreBadge';

interface Props {
  onOpenTrustModal: (event: EventItem) => void;
  onEventCreated: () => void;
}

export const OrganizerPage: React.FC<Props> = ({
  onOpenTrustModal,
  onEventCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'hub' | 'moderation'>('hub');
  const [stats, setStats] = useState<OrganizerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Moderation Queue state
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsFilter, setReportsFilter] = useState<'pending' | 'resolved' | 'all'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('hackathons');
  const [eventType, setEventType] = useState('hackathon');
  const [format, setFormat] = useState<'online' | 'offline'>('offline');
  const [priceType, setPriceType] = useState<'free' | 'paid'>('free');
  const [price, setPrice] = useState(0);
  const [date, setDate] = useState('2026-11-25');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('18:00');
  const [venue, setVenue] = useState('Innov8 Coworking Campus, Koramangala');
  const [locality, setLocality] = useState('Koramangala');
  const [city, setCity] = useState('Bengaluru');
  const [location, setLocation] = useState('Bengaluru, Karnataka');
  const [organizerName, setOrganizerName] = useState('Bengaluru Tech Collective');
  const [organizerEmail, setOrganizerEmail] = useState('host@techblr.org');
  const [organizerVerified, setOrganizerVerified] = useState(1);
  const [totalSeats, setTotalSeats] = useState(100);
  const [skillsStr, setSkillsStr] = useState('React, TypeScript, FastAPI, AI');
  const [agenda, setAgenda] = useState('10:00 Opening Keynote, 13:00 Hacking Session, 17:00 Demos & Wrap-up');

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await fetchOrganizerStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching organizer data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    setReportsLoading(true);
    try {
      const data = await fetchAdminReports(reportsFilter);
      setReports(data.reports);
    } catch (err) {
      console.error('Error fetching moderation reports', err);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'moderation') {
      loadReports();
    }
  }, [activeTab, reportsFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event listing?')) return;
    try {
      await deleteEvent(id);
      setStatusMessage('Listing deleted successfully.');
      loadStats();
      onEventCreated();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const skillsArray = skillsStr.split(',').map((s) => s.trim()).filter(Boolean);
      await createEvent({
        title,
        description,
        category,
        event_type: eventType,
        format,
        price_type: priceType,
        price,
        date,
        start_time: startTime,
        end_time: endTime,
        venue,
        locality,
        city,
        location,
        organizer_name: organizerName,
        organizer_email: organizerEmail,
        organizer_verified: organizerVerified,
        total_seats: totalSeats,
        skills: skillsArray,
        agenda,
        banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      });
      setStatusMessage('Listing successfully audited and published!');
      setShowCreateModal(false);
      loadStats();
      onEventCreated();
      // Reset form
      setTitle('');
      setDescription('');
    } catch (err: any) {
      alert(err.message || 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveReport = async (reportId: string, action: 'dismiss' | 'flag_event' | 'unpublish_event') => {
    setActionLoading(reportId);
    try {
      await resolveAdminReport(reportId, action);
      loadReports();
      loadStats();
      onEventCreated();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve report');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-theme shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-600 dark:text-violet-300 text-xs font-semibold">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Community Host Operations & Trust Governance</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-main tracking-tight">
            Organizer & Admin Control Center
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-xl">
            Publish listings with automated KYC and duplicate-audit intelligence. Review reported scam or clone listings in the Admin Moderation Queue.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-teal-500 text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-violet-900/30 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish New Event</span>
        </button>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-theme pb-2">
        <button
          onClick={() => setActiveTab('hub')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'hub'
              ? 'bg-violet-600/20 text-violet-700 dark:text-white border border-violet-500/40 shadow-sm'
              : 'text-muted hover:text-main hover:bg-theme-secondary'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-violet-500 dark:text-violet-400" />
          <span>Host Operations</span>
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'moderation'
              ? 'bg-rose-500/20 text-rose-700 dark:text-white border border-rose-500/40 shadow-sm'
              : 'text-muted hover:text-main hover:bg-theme-secondary'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          <span>Admin Moderation Queue</span>
          {reports.filter(r => r.status === 'pending').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {reports.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* Success Notification */}
      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: Host Hub */}
      {activeTab === 'hub' && (
        <>
          {/* KPI Metrics Dashboard */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-surface border border-theme space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-muted text-xs">
                  <span>Total Active Events</span>
                  <Calendar className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                </div>
                <div className="text-3xl font-extrabold text-main">{stats.total_events}</div>
                <p className="text-[11px] text-muted">Published across platform</p>
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-theme space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-muted text-xs">
                  <span>Registrations</span>
                  <Users className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                </div>
                <div className="text-3xl font-extrabold text-main">{stats.total_registrations}</div>
                <p className="text-[11px] text-muted">Total community attendees</p>
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-theme space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-muted text-xs">
                  <span>Average Trust Score</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.average_trust_score}</div>
                <p className="text-[11px] text-muted">Platform-wide trust index</p>
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-theme space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-muted text-xs">
                  <span>Suspected Duplicates</span>
                  <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                </div>
                <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{stats.flagged_duplicates_count}</div>
                <p className="text-[11px] text-muted">Auto-flagged for review</p>
              </div>
            </div>
          )}

          {/* Organizer Event Table */}
          <div className="p-6 rounded-3xl bg-surface border border-theme space-y-4 shadow-sm">
            <h2 className="text-lg font-bold text-main flex items-center justify-between">
              <span>Managed Event Listings</span>
              <span className="text-xs font-normal text-muted">Real-time database sync</span>
            </h2>

            {loading ? (
              <div className="py-12 text-center text-xs text-muted">Loading listings...</div>
            ) : !stats || stats.events.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted">No events found. Publish your first event above!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-theme text-[11px] uppercase tracking-wider text-muted">
                    <tr>
                      <th className="pb-3 font-semibold">Event Title & Venue</th>
                      <th className="pb-3 font-semibold">Date & Time</th>
                      <th className="pb-3 font-semibold">Locality</th>
                      <th className="pb-3 font-semibold text-center">Registrations</th>
                      <th className="pb-3 font-semibold text-center">Trust Score</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {stats.events.map((ev) => (
                      <tr key={ev.id} className="hover:bg-theme-secondary transition-colors">
                        <td className="py-3.5 pr-4">
                          <div className="font-bold text-main max-w-xs truncate">{ev.title}</div>
                          <div className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                            <span className="truncate max-w-[200px]">{ev.venue}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-main">
                          <div>{ev.date}</div>
                          <div className="text-[11px] text-muted">{ev.start_time} - {ev.end_time}</div>
                        </td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded bg-theme-secondary text-teal-700 dark:text-teal-300 border border-teal-500/30 text-[10px] font-medium">
                            {ev.locality || 'Bengaluru'}
                          </span>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className="font-bold text-main">{ev.registered_seats}</span>
                          <span className="text-muted"> / {ev.total_seats}</span>
                        </td>
                        <td className="py-3.5 text-center">
                          <TrustScoreBadge trust={ev.trust} size="sm" onClick={() => onOpenTrustModal(ev)} />
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => handleDelete(ev.id)}
                            className="p-1.5 rounded-lg text-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 2: Admin Moderation Queue */}
      {activeTab === 'moderation' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReportsFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  reportsFilter === 'pending'
                    ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40'
                    : 'bg-surface border border-theme text-muted hover:text-main'
                }`}
              >
                Pending Review
              </button>
              <button
                onClick={() => setReportsFilter('resolved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  reportsFilter === 'resolved'
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                    : 'bg-surface border border-theme text-muted hover:text-main'
                }`}
              >
                Actioned / Resolved
              </button>
              <button
                onClick={() => setReportsFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  reportsFilter === 'all'
                    ? 'bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/40'
                    : 'bg-surface border border-theme text-muted hover:text-main'
                }`}
              >
                All Reports
              </button>
            </div>

            <button
              onClick={loadReports}
              disabled={reportsLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-theme text-xs text-muted hover:text-main transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reportsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>

          {reportsLoading ? (
            <div className="py-12 text-center text-xs text-muted">Loading moderation queue...</div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-surface border border-theme space-y-3 shadow-sm">
              <ShieldCheck className="w-10 h-10 text-emerald-500 dark:text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-main">No reports in this view</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                All platform listings meet trust standards. Community members can report clone or scam listings directly from event cards.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-5 rounded-2xl bg-surface border border-theme space-y-3 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-main">{report.event_title}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                          report.reason === 'duplicate'
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-500/30'
                            : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-500/30'
                        }`}>
                          {report.reason}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          report.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted mt-1">
                        Reported by <strong className="text-main">{report.reporter_name}</strong> • Organizer: <span className="text-main">{report.organizer_name}</span> • {new Date(report.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-theme-secondary border border-theme text-xs text-main leading-relaxed">
                    <strong className="text-muted">Concern Description:</strong> {report.details}
                  </div>

                  {report.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-theme justify-end flex-wrap">
                      <button
                        onClick={() => handleResolveReport(report.id, 'dismiss')}
                        disabled={actionLoading === report.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-theme-secondary hover:bg-slate-200 dark:hover:bg-navy-800 text-main text-xs font-semibold border border-theme"
                      >
                        <Check className="w-3.5 h-3.5 text-muted" />
                        <span>Dismiss (Listing Authentic)</span>
                      </button>

                      <button
                        onClick={() => handleResolveReport(report.id, 'flag_event')}
                        disabled={actionLoading === report.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-300 dark:border-amber-700/60"
                      >
                        <Flag className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        <span>Flag with Warning Banner</span>
                      </button>

                      <button
                        onClick={() => handleResolveReport(report.id, 'unpublish_event')}
                        disabled={actionLoading === report.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-300 dark:border-rose-700/60"
                      >
                        <EyeOff className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                        <span>Unpublish Listing</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-navy-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-surface border border-theme rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 relative text-main">
            <div className="flex items-center justify-between pb-4 border-b border-theme">
              <h3 className="text-lg font-bold text-main flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-500 dark:text-teal-400" />
                Publish Verified Tech Event
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-muted hover:text-main"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Bengaluru GenAI Summit 2026"
                  className="w-full px-3 py-2 rounded-xl bg-theme-secondary border border-theme text-main focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the event agenda, challenges, target audience..."
                  className="w-full px-3 py-2 rounded-xl bg-theme-secondary border border-theme text-main focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-theme-secondary border border-theme text-main focus:outline-none focus:border-violet-500"
                  >
                    <option value="hackathons">Hackathons</option>
                    <option value="workshops">Workshops</option>
                    <option value="tech_meetups">Tech Meetups</option>
                    <option value="coding_contests">Contests</option>
                    <option value="volunteering">Volunteering</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-theme-secondary border border-theme text-main focus:outline-none focus:border-violet-500"
                  >
                    <option value="offline">In-Person</option>
                    <option value="online">Virtual / Online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Locality Hub</label>
                  <select
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-theme-secondary border border-theme text-main focus:outline-none focus:border-violet-500"
                  >
                    <option value="Koramangala">Koramangala</option>
                    <option value="Indiranagar">Indiranagar</option>
                    <option value="HSR Layout">HSR Layout</option>
                    <option value="Whitefield">Whitefield</option>
                    <option value="Electronic City">Electronic City</option>
                    <option value="Central Bangalore">Central Bangalore</option>
                    <option value="Jayanagar">Jayanagar</option>
                    <option value="Bellandur">Bellandur</option>
                    <option value="Yelahanka">Yelahanka</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-theme-secondary border border-theme text-main"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-theme-secondary border border-theme text-main"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-theme-secondary border border-theme text-main"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Venue Name *</label>
                  <input
                    type="text"
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. 91springboard, Koramangala"
                    className="w-full px-3 py-2 rounded-xl bg-theme-secondary border border-theme text-main"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Total Capacity</label>
                  <input
                    type="number"
                    min={1}
                    value={totalSeats}
                    onChange={(e) => setTotalSeats(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-theme-secondary border border-theme text-main"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Relevant Skills (comma separated)</label>
                <input
                  type="text"
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="React, PyTorch, Kubernetes"
                  className="w-full px-3 py-2 rounded-xl bg-theme-secondary border border-theme text-main"
                />
              </div>

              <div className="pt-3 border-t border-theme flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-muted hover:text-main"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 text-white font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-violet-900/30 disabled:opacity-50"
                >
                  {submitting ? 'Auditing & Publishing...' : 'Audit & Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};