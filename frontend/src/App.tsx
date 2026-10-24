import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DiscoverPage } from './pages/DiscoverPage';
import { PlannerPage } from './pages/PlannerPage';
import { TeamMatchPage } from './pages/TeamMatchPage';
import { OrganizerPage } from './pages/OrganizerPage';
import { RadarPage } from './pages/RadarPage';
import { MyEventsPage } from './pages/MyEventsPage';
import { PassportPage } from './pages/PassportPage';
import { CommunityDemandPage } from './pages/CommunityDemandPage';
import { TrustModal } from './components/TrustModal';
import { EventDetailModal } from './components/EventDetailModal';
import { AuthModal } from './components/AuthModal';
import { RegistrationModal } from './components/RegistrationModal';
import { ReportModal } from './components/ReportModal';
import { ProfileModal } from './components/ProfileModal';
import { 
  fetchEvents, 
  fetchPlannerSchedule, 
  toggleBookmark, 
  addToPlanner, 
  removeFromPlanner, 
  resetDemoDatabase,
  apiGetMe,
  apiLogout
} from './api';
import { EventItem, PlannerScheduleResponse, UserProfile } from './types';
import { CheckCircle2, AlertCircle, X, Sparkles, LogIn, Compass } from 'lucide-react';

const DEFAULT_DEMO_USER: UserProfile = {
  id: 'u-1',
  name: 'Aarav Sharma',
  role: 'Full Stack & AI Engineer',
  experience_level: 'Senior',
  bio: 'Building agentic AI and distributed web applications. Hackathon enthusiast.',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
  skills: ['React', 'TypeScript', 'FastAPI', 'PyTorch', 'Docker', 'PostgreSQL'],
  interests: ['Generative AI', 'Hyperlocal Tech', 'Autonomous Systems', 'Open Source'],
  goals: ['Win Hackathons', 'Find Teammates', 'AI Upskilling'],
  locality: 'Koramangala',
  github: 'github.com/aaravsharma',
  email: 'aarav.sharma@demo.eventsphere.io',
  hackathons_won: 4,
  is_admin: 0,
};

export function App() {
  const [activeTab, setActiveTab] = useState<
    'discover' | 'radar' | 'planner' | 'teammatch' | 'demands' | 'passport' | 'my-events' | 'organizer'
  >('discover');
  
  // User Session State: null when signed out
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Data state
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [plannerData, setPlannerData] = useState<PlannerScheduleResponse | null>(null);
  const [loadingPlanner, setLoadingPlanner] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cityFilter, setCityFilter] = useState('Bengaluru');
  const [localityFilter, setLocalityFilter] = useState('all');
  const [radiusFilter, setRadiusFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');

  // Modals state
  const [trustModalEvent, setTrustModalEvent] = useState<EventItem | null>(null);
  const [detailModalEvent, setDetailModalEvent] = useState<EventItem | null>(null);
  const [registrationEvent, setRegistrationEvent] = useState<EventItem | null>(null);
  const [reportEventItem, setReportEventItem] = useState<EventItem | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Restore authenticated session if token exists
  useEffect(() => {
    apiGetMe()
      .then((user) => {
        if (user) {
          setCurrentUser(user);
          setIsDemoMode(false);
        }
      })
      .catch(() => {
        // If not authenticated, check if user had enabled demo mode previously
        const demoStored = localStorage.getItem('eventsphere_demo_mode');
        if (demoStored === 'true') {
          setCurrentUser(DEFAULT_DEMO_USER);
          setIsDemoMode(true);
        } else {
          setCurrentUser(null);
          setIsDemoMode(false);
        }
      });
  }, []);

  const handleToggleDemoMode = () => {
    if (isDemoMode) {
      // Turn demo mode OFF
      setIsDemoMode(false);
      localStorage.removeItem('eventsphere_demo_mode');
      if (currentUser?.id === DEFAULT_DEMO_USER.id) {
        setCurrentUser(null);
      }
      showToast('Demo Mode deactivated. You are in guest mode.', 'info');
    } else {
      // Turn demo mode ON
      setIsDemoMode(true);
      localStorage.setItem('eventsphere_demo_mode', 'true');
      setCurrentUser(DEFAULT_DEMO_USER);
      showToast('Demo Mode active: Loaded Aarav Sharma (Lead AI Judge profile).', 'success');
    }
  };

  // Load events
  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const rad = radiusFilter !== 'all' ? parseFloat(radiusFilter) : undefined;
      const data = await fetchEvents({
        search: searchQuery,
        category: selectedCategory,
        city: cityFilter !== 'all' ? cityFilter : undefined,
        locality: localityFilter !== 'all' ? localityFilter : undefined,
        format: formatFilter,
        price_type: priceFilter,
        sort_by: sortBy,
        radius_km: rad,
        user_id: currentUser?.id || undefined,
      });
      setEvents(data.events);
    } catch (err) {
      console.error('Failed to load events', err);
      showToast('Could not connect to EventSphere backend. Retrying...', 'warning');
    } finally {
      setLoadingEvents(false);
    }
  };

  // Load schedule
  const loadPlanner = async () => {
    if (!currentUser) {
      setPlannerData({
        count: 0,
        schedule: [],
        has_conflicts: false,
        conflicts: [],
        travel_conflicts: [],
        recommended_alternatives: []
      });
      return;
    }
    setLoadingPlanner(true);
    try {
      const data = await fetchPlannerSchedule(currentUser.id);
      setPlannerData(data);
    } catch (err) {
      console.error('Failed to load planner', err);
    } finally {
      setLoadingPlanner(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [searchQuery, selectedCategory, cityFilter, localityFilter, radiusFilter, formatFilter, priceFilter, sortBy, currentUser]);

  useEffect(() => {
    loadPlanner();
  }, [currentUser]);

  // Bounding box map search
  const handleSearchThisArea = async (bounds: { min_lat: number; max_lat: number; min_lng: number; max_lng: number }) => {
    setLoadingEvents(true);
    try {
      const data = await fetchEvents({
        search: searchQuery,
        category: selectedCategory,
        city: cityFilter !== 'all' ? cityFilter : undefined,
        format: formatFilter,
        price_type: priceFilter,
        sort_by: sortBy,
        bounds,
        user_id: currentUser?.id || undefined,
      });
      setEvents(data.events);
      showToast(`Found ${data.events.length} events in this visible area`, 'info');
    } catch (err) {
      console.error('Failed to search area', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Handlers
  const handleToggleBookmark = async (ev: EventItem) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      showToast('Please sign in to bookmark events.', 'info');
      return;
    }
    try {
      const res = await toggleBookmark(ev.id, currentUser.id);
      setEvents((prev) =>
        prev.map((item) =>
          item.id === ev.id ? { ...item, is_bookmarked: res.is_bookmarked } : item
        )
      );
      if (detailModalEvent?.id === ev.id) {
        setDetailModalEvent((prev) => (prev ? { ...prev, is_bookmarked: res.is_bookmarked } : null));
      }
      showToast(res.message, 'success');
    } catch (err: any) {
      showToast(err.message, 'warning');
    }
  };

  const handleTogglePlanner = async (ev: EventItem) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      showToast('Please sign in to add events to your Smart Planner.', 'info');
      return;
    }
    try {
      if (ev.is_in_planner) {
        await handleRemoveFromPlanner(ev.id);
      } else {
        await handleAddToPlanner(ev.id);
      }
    } catch (err: any) {
      showToast(err.message, 'warning');
    }
  };

  const handleAddToPlanner = async (eventId: string) => {
    try {
      const res = await addToPlanner(eventId, currentUser?.id || 'u-1');
      setPlannerData({
        count: res.schedule.length,
        schedule: res.schedule,
        has_conflicts: res.has_conflicts,
        conflicts: res.conflicts,
        travel_conflicts: res.travel_conflicts,
        recommended_alternatives: res.recommended_alternatives || [],
      });
      setEvents((prev) =>
        prev.map((item) =>
          item.id === eventId ? { ...item, is_in_planner: true } : item
        )
      );
      if (detailModalEvent?.id === eventId) {
        setDetailModalEvent((prev) => (prev ? { ...prev, is_in_planner: true } : null));
      }

      if (res.has_conflicts) {
        showToast('Added to planner, but an overlap conflict was detected! Check the Smart Planner tab.', 'warning');
      } else {
        showToast(res.message, 'success');
      }
    } catch (err: any) {
      showToast(err.message, 'warning');
    }
  };

  const handleRemoveFromPlanner = async (eventId: string) => {
    try {
      const res = await removeFromPlanner(eventId, currentUser?.id || 'u-1');
      setPlannerData({
        count: res.schedule.length,
        schedule: res.schedule,
        has_conflicts: res.has_conflicts,
        conflicts: res.conflicts,
        travel_conflicts: res.travel_conflicts,
        recommended_alternatives: res.recommended_alternatives || [],
      });
      setEvents((prev) =>
        prev.map((item) =>
          item.id === eventId ? { ...item, is_in_planner: false } : item
        )
      );
      if (detailModalEvent?.id === eventId) {
        setDetailModalEvent((prev) => (prev ? { ...prev, is_in_planner: false } : null));
      }
      showToast(res.message, 'info');
    } catch (err: any) {
      showToast(err.message, 'warning');
    }
  };

  const handleOpenRegistration = (ev: EventItem) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      showToast('Please sign in or create an account to register for events.', 'info');
      return;
    }
    setRegistrationEvent(ev);
  };

  const handleRegistrationComplete = (ticketInfo: any) => {
    if (registrationEvent) {
      setEvents((prev) =>
        prev.map((item) =>
          item.id === registrationEvent.id
            ? { ...item, is_registered: true, registered_seats: item.registered_seats + 1 }
            : item
        )
      );
    }
    showToast(`Pass confirmed: ${ticketInfo?.ticket_code || 'ES-CONFIRMED'}. Saved to My Passes!`, 'success');
  };

  const handleResetDemo = async () => {
    setResettingDemo(true);
    try {
      const res = await resetDemoDatabase();
      showToast(res.message, 'success');
      await loadEvents();
      await loadPlanner();
    } catch (err: any) {
      showToast(err.message, 'warning');
    } finally {
      setResettingDemo(false);
    }
  };

  const handleLogout = async () => {
    await apiLogout();
    setIsDemoMode(false);
    localStorage.removeItem('eventsphere_demo_mode');
    setCurrentUser(null);
    showToast('Signed out successfully. You are now browsing as a guest.', 'info');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-violet-600 selection:text-white transition-colors duration-200">
      
      {/* Toast Alert Popup */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full animate-bounce-short">
          <div className={`p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-start gap-3 ${
            toast.type === 'success'
              ? 'bg-emerald-50/95 dark:bg-emerald-950/95 border-emerald-300 dark:border-emerald-500/60 text-emerald-900 dark:text-emerald-200'
              : toast.type === 'warning'
              ? 'bg-amber-50/95 dark:bg-amber-950/95 border-amber-300 dark:border-amber-500/60 text-amber-900 dark:text-amber-200'
              : 'bg-white/95 dark:bg-navy-900/95 border-slate-200 dark:border-navy-700 text-slate-900 dark:text-slate-200'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : toast.type === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {toast.message}
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Global Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTab(t as any)}
        hasConflicts={plannerData?.has_conflicts}
        onResetDemo={handleResetDemo}
        resetting={resettingDemo}
        currentUser={currentUser}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 ${activeTab === 'discover' ? 'max-w-[1720px]' : 'max-w-7xl'}`}>
        {activeTab === 'discover' && (
          <DiscoverPage
            events={events}
            loading={loadingEvents}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            cityFilter={cityFilter}
            setCityFilter={setCityFilter}
            localityFilter={localityFilter}
            setLocalityFilter={setLocalityFilter}
            radiusFilter={radiusFilter}
            setRadiusFilter={setRadiusFilter}
            formatFilter={formatFilter}
            setFormatFilter={setFormatFilter}
            priceFilter={priceFilter}
            setPriceFilter={setPriceFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onSelectEvent={(ev) => setDetailModalEvent(ev)}
            onToggleBookmark={handleToggleBookmark}
            onTogglePlanner={handleTogglePlanner}
            onOpenTrustModal={(ev) => setTrustModalEvent(ev)}
            onQuickRegister={handleOpenRegistration}
            onReportEvent={(ev) => setReportEventItem(ev)}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            onSearchThisArea={handleSearchThisArea}
          />
        )}

        {activeTab === 'radar' && (
          <RadarPage
            currentUser={currentUser}
            onSelectEvent={(ev) => setDetailModalEvent(ev)}
            onOpenTrustModal={(ev) => setTrustModalEvent(ev)}
            onOpenRegistrationModal={(ev) => handleOpenRegistration(ev)}
          />
        )}

        {activeTab === 'planner' && (
          <PlannerPage
            plannerData={plannerData}
            loading={loadingPlanner}
            onRemoveFromPlanner={handleRemoveFromPlanner}
            onAddToPlanner={handleAddToPlanner}
            onSelectEvent={(ev) => setDetailModalEvent(ev)}
            onOpenTrustModal={(ev) => setTrustModalEvent(ev)}
          />
        )}

        {activeTab === 'teammatch' && (
          <TeamMatchPage
            currentUser={currentUser}
            showToast={showToast}
          />
        )}

        {activeTab === 'demands' && (
          <CommunityDemandPage
            currentUser={currentUser}
            showToast={showToast}
          />
        )}

        {activeTab === 'passport' && (
          <PassportPage
            currentUser={currentUser}
          />
        )}

        {activeTab === 'my-events' && (
          <MyEventsPage
            currentUser={currentUser}
            onExploreEvents={() => setActiveTab('discover')}
            showToast={showToast}
          />
        )}

        {activeTab === 'organizer' && (
          <OrganizerPage
            onOpenTrustModal={(ev) => setTrustModalEvent(ev)}
            onEventCreated={() => {
              loadEvents();
              loadPlanner();
            }}
          />
        )}
      </main>

      {/* Trust Intelligence Modal */}
      <TrustModal
        isOpen={!!trustModalEvent}
        onClose={() => setTrustModalEvent(null)}
        trust={trustModalEvent?.trust}
        eventTitle={trustModalEvent?.title || ''}
        organizerName={trustModalEvent?.organizer_name || ''}
      />

      {/* Event Details Modal */}
      <EventDetailModal
        isOpen={!!detailModalEvent}
        onClose={() => setDetailModalEvent(null)}
        event={detailModalEvent}
        onToggleBookmark={handleToggleBookmark}
        onTogglePlanner={handleTogglePlanner}
        onRegister={async () => {
          handleRegistrationComplete({ ticket_code: 'ES-CONFIRMED' });
        }}
        onOpenTrustModal={(ev) => setTrustModalEvent(ev)}
        onReportEvent={(ev) => setReportEventItem(ev)}
        onOpenRegistrationFlow={(ev) => handleOpenRegistration(ev)}
      />

      {/* Registration 3-Step Modal */}
      <RegistrationModal
        event={registrationEvent}
        isOpen={!!registrationEvent}
        currentUser={currentUser}
        onClose={() => setRegistrationEvent(null)}
        onRegistrationSuccess={handleRegistrationComplete}
        onNavigateToMyEvents={() => {
          setActiveTab('my-events');
          setRegistrationEvent(null);
        }}
      />

      {/* Report Modal */}
      {reportEventItem && (
        <ReportModal
          eventId={reportEventItem.id}
          eventTitle={reportEventItem.title}
          isOpen={!!reportEventItem}
          onClose={() => setReportEventItem(null)}
          onReportSuccess={(msg) => {
            showToast(msg, 'success');
            setReportEventItem(null);
          }}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setIsDemoMode(false);
          localStorage.removeItem('eventsphere_demo_mode');
          showToast(`Welcome back, ${user.name}! 🎉`, 'success');
        }}
      />

      {/* Profile & Settings Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        currentUser={currentUser}
        showToast={showToast}
        onProfileUpdated={(updated) => {
          setCurrentUser(updated);
          showToast('Profile & preferences saved successfully.', 'success');
        }}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-navy-800/80 bg-white dark:bg-navy-950 py-6 text-center text-xs text-slate-500 dark:text-slate-500 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 dark:text-white">
              Event<span className="text-violet-600 dark:text-violet-400">Sphere</span>
            </span>
            <span>— Hyperlocal Event Discovery & Community Engagement</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-teal-500 inline-block"></span>
            <span>Bengaluru Tech Corridor • OpenStreetMap Edition</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
