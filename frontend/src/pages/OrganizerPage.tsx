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
  RefreshCw,
  Edit3,
  Radar,
  ArrowRight,
  TrendingUp,
  Tag,
  DollarSign
} from 'lucide-react';
import { OrganizerStats, EventItem, ModerationReport, CommunityGap } from '../types';
import { 
  fetchOrganizerStats, 
  createEvent, 
  updateEvent,
  deleteEvent, 
  fetchAdminReports, 
  resolveAdminReport,
  fetchCommunityGaps 
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
  const [gaps, setGaps] = useState<CommunityGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
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
  const [sourceUrl, setSourceUrl] = useState('');

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

  const loadGaps = async () => {
    try {
      const data = await fetchCommunityGaps();
      setGaps(data.gaps || []);
    } catch (err) {
      console.error('Error fetching community gaps', err);
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
    loadGaps();
  }, []);

  useEffect(() => {
    if (activeTab === 'moderation') {
      loadReports();
    }
  }, [activeTab, reportsFilter]);

  const handleOpenEdit = (ev: EventItem) => {
    setEditingEventId(ev.id);
    setTitle(ev.title);
    setDescription(ev.description);
    setCategory(ev.category);
    setEventType(ev.event_type);
    setFormat(ev.format);
    setPriceType(ev.price_type);
    setPrice(ev.price);
    setDate(ev.date);
    setStartTime(ev.start_time);
    setEndTime(ev.end_time);
    setVenue(ev.venue);
    setLocality(ev.locality || 'Koramangala');
    setCity(ev.city || 'Bengaluru');
    setLocation(ev.location || 'Bengaluru, Karnataka');
    setOrganizerName(ev.organizer_name);
    setOrganizerEmail(ev.organizer_email);
    setOrganizerVerified(ev.organizer_verified || 1);
    setTotalSeats(ev.total_seats);
    setSkillsStr(ev.skills ? ev.skills.join(', ') : '');
    setAgenda(ev.agenda || '');
    setSourceUrl(ev.source_url || '');
    setWizardStep(1);
    setShowCreateModal(true);
  };

  const handleHostForGap = (gap: CommunityGap) => {
    setEditingEventId(null);
    setTitle(gap.suggested_topic);
    setDescription(`Community-requested ${gap.suggested_format} organized to address verified developer interest in ${gap.locality}.`);
    setCategory(gap.category);
    setEventType(gap.suggested_format.toLowerCase().includes('hackathon') ? 'hackathon' : 'workshop');
    setFormat(gap.suggested_format.toLowerCase().includes('online') ? 'online' : 'offline');
    setPriceType('free');
    setPrice(0);
    setLocality(gap.locality);
    setCity('Bengaluru');
    setVenue(`Innovation Hub, ${gap.locality}`);
    setSkillsStr('AI, Python, TypeScript, Architecture');
    setSourceUrl('');
    setWizardStep(1);
    setShowCreateModal(true);
  };

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
      const payload: Partial<EventItem> = {
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
        source_url: sourceUrl || undefined,
        banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      };

      if (editingEventId) {
        await updateEvent(editingEventId, payload);
        setStatusMessage('Event listing updated successfully!');
      } else {
        await createEvent(payload);
        setStatusMessage('Listing successfully audited and published!');
      }

      setShowCreateModal(false);
      setEditingEventId(null);
      setWizardStep(1);
      loadStats();
      onEventCreated();
      setTitle('');
      setDescription('');
      setSourceUrl('');
    } catch (err: any) {
      alert(err.message || 'Action failed');
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
    <div className="space-y-8 pb-20 animate-fade-in">
      
      {/* SCREEN 9: Organizer Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-theme shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Community Host Operations & Trust Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-main tracking-tight">
            Organizer Hub
          </h1>
          <p className="text-xs sm:text-sm text-secondary max-w-xl">
            Publish vetted events, inspect attendee counts, resolve moderation flags, and address unmet local developer demand.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setEditingEventId(null);
              setWizardStep(1);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all shadow-md shadow-brand/20 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-muted hover:text-main">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs: Organizer Overview vs Moderation Queue */}
      <div className="flex items-center gap-2 border-b border-theme pb-1">
        <button
          onClick={() => setActiveTab('hub')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'hub'
              ? 'bg-brand text-white shadow-sm'
              : 'text-secondary hover:text-main hover:bg-surface-secondary'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard & Listings</span>
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'moderation'
              ? 'bg-brand text-white shadow-sm'
              : 'text-secondary hover:text-main hover:bg-surface-secondary'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Moderation Queue</span>
          {stats && stats.flagged_duplicates_count > 0 && (
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
              {stats.flagged_duplicates_count}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Hub Dashboard */}
      {activeTab === 'hub' && (
        <>
          {/* KPI Summary Cards (Screen 9) */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-surface border border-theme shadow-card space-y-1">
                <div className="flex items-center justify-between text-muted text-xs font-bold">
                  <span>Total Events</span>
                  <Calendar className="w-4 h-4 text-brand" />
                </div>
                <div className="text-3xl font-black text-main">{stats.total_events}</div>
                <p className="text-[11px] text-secondary font-medium">Published in catalogue</p>
              </div>

              <div className="p-5 rounded-3xl bg-surface border border-theme shadow-card space-y-1">
                <div className="flex items-center justify-between text-muted text-xs font-bold">
                  <span>Registrations</span>
                  <Users className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.total_registrations}</div>
                <p className="text-[11px] text-secondary font-medium">Verified attendee passes</p>
              </div>

              <div className="p-5 rounded-3xl bg-surface border border-theme shadow-card space-y-1">
                <div className="flex items-center justify-between text-muted text-xs font-bold">
                  <span>Avg Trust Score</span>
                  <ShieldCheck className="w-4 h-4 text-brand" />
                </div>
                <div className="text-3xl font-black text-brand">{stats.average_trust_score}%</div>
                <p className="text-[11px] text-secondary font-medium">7-Signal Host Integrity</p>
              </div>

              <div className="p-5 rounded-3xl bg-surface border border-theme shadow-card space-y-1">
                <div className="flex items-center justify-between text-muted text-xs font-bold">
                  <span>Flagged Review</span>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-3xl font-black text-amber-600 dark:text-amber-400">{stats.flagged_duplicates_count}</div>
                <p className="text-[11px] text-secondary font-medium">Auto-flagged duplicates</p>
              </div>
            </div>
          )}

          {/* SCREEN 11: Community Gap Radar (Unmet Demand Opportunities) */}
          {gaps.length > 0 && (
            <div className="p-6 sm:p-7 rounded-3xl bg-surface border border-theme shadow-card space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <Radar className="w-5 h-5 text-brand" />
                    <h2 className="text-base sm:text-lg font-extrabold text-main">
                      Community Gap Radar — Unmet Local Demand
                    </h2>
                  </div>
                  <p className="text-xs text-secondary mt-0.5">
                    Algorithmic gap discovery: high community wishlist requests with zero or few competing events. Click to host!
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand/10 text-brand border border-brand/20">
                  {gaps.length} Actionable Demands
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {gaps.slice(0, 3).map((gap) => (
                  <div
                    key={gap.id}
                    className="p-5 rounded-2xl bg-surface-secondary border border-theme hover:border-brand/40 transition-all flex flex-col justify-between space-y-4 shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-extrabold text-brand uppercase tracking-wider text-[11px]">
                          📍 {gap.locality}
                        </span>
                        <span className="font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px]">
                          {gap.gap_score}/100 Gap Score
                        </span>
                      </div>

                      <h4 className="font-extrabold text-sm sm:text-base text-main leading-snug">
                        {gap.suggested_topic}
                      </h4>

                      {/* Demand progress meter */}
                      <div className="space-y-1">
                        <div className="w-full h-1.5 rounded-full bg-theme overflow-hidden">
                          <div 
                            className="h-full bg-brand rounded-full"
                            style={{ width: `${gap.gap_score}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted font-medium">
                          <span>High Community Interest</span>
                          <span>Format: {gap.suggested_format}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleHostForGap(gap)}
                      className="w-full py-2.5 px-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brand/20 cursor-pointer active:scale-95"
                    >
                      <span>Host Event for this Demand</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Organizer Managed Event Table */}
          <div className="p-6 sm:p-7 rounded-3xl bg-surface border border-theme shadow-card space-y-4">
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
                      <tr key={ev.id} className="hover:bg-surface-secondary transition-colors">
                        <td className="py-3.5 pr-4">
                          <div className="font-bold text-main max-w-xs truncate">{ev.title}</div>
                          <div className="text-[11px] text-secondary flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-rose-500" />
                            <span className="truncate max-w-[200px]">{ev.venue}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-main">
                          <div className="font-semibold">{ev.date}</div>
                          <div className="text-[11px] text-muted">{ev.start_time} - {ev.end_time} IST</div>
                        </td>
                        <td className="py-3.5">
                          <span className="px-2.5 py-1 rounded-lg bg-surface-secondary text-brand font-semibold text-[11px] border border-theme">
                            {ev.locality || 'Bengaluru'}
                          </span>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className="font-black text-main">{ev.registered_seats}</span>
                          <span className="text-muted"> / {ev.total_seats}</span>
                        </td>
                        <td className="py-3.5 text-center">
                          <TrustScoreBadge trust={ev.trust} size="sm" onClick={() => onOpenTrustModal(ev)} />
                        </td>
                        <td className="py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEdit(ev)}
                            className="p-1.5 rounded-lg text-secondary hover:text-brand hover:bg-surface-secondary transition-colors mr-1 cursor-pointer"
                            title="Edit Event"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ev.id)}
                            className="p-1.5 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  reportsFilter === 'pending'
                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    : 'bg-surface border border-theme text-muted hover:text-main'
                }`}
              >
                Pending Review
              </button>
              <button
                onClick={() => setReportsFilter('resolved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  reportsFilter === 'resolved'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-surface border border-theme text-muted hover:text-main'
                }`}
              >
                Resolved
              </button>
              <button
                onClick={() => setReportsFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  reportsFilter === 'all'
                    ? 'bg-brand text-white'
                    : 'bg-surface border border-theme text-muted hover:text-main'
                }`}
              >
                All Reports
              </button>
            </div>
            <button
              onClick={loadReports}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-theme text-xs font-semibold text-secondary hover:text-main cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Queue</span>
            </button>
          </div>

          {reportsLoading ? (
            <div className="py-12 text-center text-xs text-muted">Loading moderation reports...</div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-surface border border-theme shadow-card space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-main">Moderation Queue Clear</h3>
              <p className="text-xs text-secondary">No pending reports matching the current filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-5 rounded-3xl bg-surface border border-theme shadow-card space-y-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-main text-sm">{report.event_title}</span>
                        <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand font-semibold text-[10px]">
                          {report.reason}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted mt-0.5">
                        Reporter: {report.reporter_name} • Host: {report.organizer_name}
                      </div>
                    </div>
                    <span className="font-bold uppercase text-[10px] px-2.5 py-0.5 rounded-full bg-surface-secondary text-secondary border border-theme">
                      {report.status}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-surface-secondary border border-theme text-secondary leading-relaxed">
                    {report.details}
                  </div>

                  {report.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-theme">
                      <button
                        onClick={() => handleResolveReport(report.id, 'dismiss')}
                        disabled={actionLoading === report.id}
                        className="px-3.5 py-1.5 rounded-xl bg-surface border border-theme text-secondary hover:text-main font-semibold cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleResolveReport(report.id, 'flag_event')}
                        disabled={actionLoading === report.id}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold cursor-pointer"
                      >
                        Flag with Warning
                      </button>
                      <button
                        onClick={() => handleResolveReport(report.id, 'unpublish_event')}
                        disabled={actionLoading === report.id}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold cursor-pointer"
                      >
                        Unpublish Listing
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SCREEN 10: 4-Step Create / Edit Event Wizard Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-surface border border-theme rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-elevated p-6 sm:p-8 relative text-main">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-theme">
              <h3 className="text-lg font-extrabold text-main flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand" />
                {editingEventId ? 'Edit Event Listing' : 'Publish Verified Event'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingEventId(null);
                  setWizardStep(1);
                }}
                className="p-1 rounded-lg text-muted hover:text-main cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress Indicator (Screen 10) */}
            <div className="my-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-muted">
                <span className={wizardStep >= 1 ? 'text-brand' : ''}>1. Basic Info</span>
                <span>→</span>
                <span className={wizardStep >= 2 ? 'text-brand' : ''}>2. Schedule & Venue</span>
                <span>→</span>
                <span className={wizardStep >= 3 ? 'text-brand' : ''}>3. Capacity & Price</span>
                <span>→</span>
                <span className={wizardStep === 4 ? 'text-brand' : ''}>4. Review & Publish</span>
              </div>
              <div className="w-full bg-surface-secondary rounded-full h-1.5 overflow-hidden border border-theme">
                <div 
                  className="h-full bg-brand transition-all duration-300"
                  style={{ width: `${(wizardStep / 4) * 100}%` }}
                />
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              
              {/* STEP 1: Basic Info */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-main mb-1">Event Title *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Bengaluru GenAI Summit 2026"
                      className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-main mb-1">Event Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main focus:outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="hackathons">Hackathons</option>
                      <option value="workshops">Workshops</option>
                      <option value="tech_meetups">Tech Meetups</option>
                      <option value="coding_contests">Contests</option>
                      <option value="volunteering">Volunteering</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-main mb-1">Description *</label>
                    <textarea
                      required
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detail the event objectives, challenges, prerequisites..."
                      className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-main mb-1">Relevant Skills (comma separated)</label>
                    <input
                      type="text"
                      value={skillsStr}
                      onChange={(e) => setSkillsStr(e.target.value)}
                      placeholder="React, PyTorch, Kubernetes"
                      className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="button"
                      disabled={!title || !description}
                      onClick={() => setWizardStep(2)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold transition-all shadow-md shadow-brand/20 cursor-pointer disabled:opacity-50"
                    >
                      <span>Next: Schedule & Venue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Schedule & Venue */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-main mb-1">Date *</label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-main mb-1">Start Time *</label>
                      <input
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-main mb-1">End Time *</label>
                      <input
                        type="time"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-main mb-1">Format</label>
                      <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main cursor-pointer"
                      >
                        <option value="offline">In-Person</option>
                        <option value="online">Virtual / Online</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-main mb-1">Locality Hub *</label>
                      <select
                        value={locality}
                        onChange={(e) => setLocality(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main cursor-pointer"
                      >
                        <option value="Koramangala">Koramangala</option>
                        <option value="Indiranagar">Indiranagar</option>
                        <option value="HSR Layout">HSR Layout</option>
                        <option value="Whitefield">Whitefield</option>
                        <option value="Electronic City">Electronic City</option>
                        <option value="Central Bangalore">Central Bangalore</option>
                        <option value="Bellandur">Bellandur</option>
                        <option value="Jayanagar">Jayanagar</option>
                        <option value="Yelahanka">Yelahanka</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-main mb-1">Venue Name / Coworking Hub *</label>
                    <input
                      type="text"
                      required
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="e.g. 91springboard, Koramangala 7th Block"
                      className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-main mb-1">Timeline / Agenda</label>
                    <textarea
                      rows={2}
                      value={agenda}
                      onChange={(e) => setAgenda(e.target.value)}
                      placeholder="e.g. 10:00 Welcome, 12:00 Hacking, 17:00 Judging"
                      className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main font-mono text-[11px]"
                    />
                  </div>

                  <div className="pt-3 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="px-4 py-2 rounded-xl text-secondary hover:text-main font-semibold cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      disabled={!venue || !date}
                      onClick={() => setWizardStep(3)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold transition-all shadow-md shadow-brand/20 cursor-pointer disabled:opacity-50"
                    >
                      <span>Next: Capacity & Pricing</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Capacity & Pricing */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-main mb-1">Total Seat Capacity *</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={totalSeats}
                        onChange={(e) => setTotalSeats(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-main mb-1">Pricing Model *</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPriceType('free');
                            setPrice(0);
                          }}
                          className={`flex-1 py-2 rounded-xl border font-bold text-xs cursor-pointer ${
                            priceType === 'free'
                              ? 'bg-brand text-white border-brand'
                              : 'bg-surface-secondary text-secondary border-theme'
                          }`}
                        >
                          Free Admission
                        </button>
                        <button
                          type="button"
                          onClick={() => setPriceType('paid')}
                          className={`flex-1 py-2 rounded-xl border font-bold text-xs cursor-pointer ${
                            priceType === 'paid'
                              ? 'bg-brand text-white border-brand'
                              : 'bg-surface-secondary text-secondary border-theme'
                          }`}
                        >
                          Paid Admission
                        </button>
                      </div>
                    </div>
                  </div>

                  {priceType === 'paid' && (
                    <div>
                      <label className="block text-[11px] font-bold text-main mb-1">Ticket Price (₹ INR) *</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-main mb-1">
                      Event Provenance / Primary Source URL (Increases Trust Score)
                    </label>
                    <input
                      type="url"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://luma.com/... or https://meetup.com/..."
                      className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main"
                    />
                  </div>

                  <div className="pt-3 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="px-4 py-2 rounded-xl text-secondary hover:text-main font-semibold cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardStep(4)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold transition-all shadow-md shadow-brand/20 cursor-pointer"
                    >
                      <span>Next: Review & Publish</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Review & Publish */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-surface-secondary border border-theme space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-brand">{category} • {format}</span>
                        <h4 className="font-extrabold text-main text-base">{title}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {priceType === 'free' ? 'FREE' : `₹${price}`}
                        </span>
                        <div className="text-[11px] text-muted">{totalSeats} seats</div>
                      </div>
                    </div>

                    <div className="text-xs text-secondary leading-relaxed line-clamp-2">
                      {description}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-theme">
                      <div>
                        <span className="text-muted">Date & Time:</span>
                        <div className="font-semibold text-main">{date} ({startTime} - {endTime})</div>
                      </div>
                      <div>
                        <span className="text-muted">Venue & Locality:</span>
                        <div className="font-semibold text-main truncate">{venue}, {locality}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <span>7-Signal Automated Trust Audit will score this listing instantly upon publication.</span>
                  </div>

                  <div className="pt-3 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setWizardStep(3)}
                      className="px-4 py-2 rounded-xl text-secondary hover:text-main font-semibold cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold transition-all shadow-md shadow-brand/20 cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      {submitting ? 'Auditing & Publishing...' : editingEventId ? 'Update Event Listing' : 'Publish Verified Event'}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
