import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  SlidersHorizontal, 
  MapPin, 
  Calendar, 
  X,
  AlertCircle,
  Map as MapIcon,
  LayoutGrid,
  Columns,
  Radar,
  CalendarDays,
  Users2,
  Vote,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Compass,
  Layers,
  Zap,
  TrainFront,
  ListFilter
} from 'lucide-react';
import { EventItem, LocalityInfo, CityInfo } from '../types';
import { EventCard } from '../components/EventCard';
import { CompactEventCard } from '../components/CompactEventCard';
import { RealLeafletMap } from '../components/RealLeafletMap';
import { fetchLocalities, fetchCities } from '../api';

const CATEGORIES = [
  { id: 'all', label: 'All Events', icon: '🌟' },
  { id: 'hackathons', label: 'Hackathons', icon: '⚡' },
  { id: 'workshops', label: 'Workshops', icon: '🛠️' },
  { id: 'tech_meetups', label: 'Tech Meetups', icon: '☕' },
  { id: 'coding_contests', label: 'Contests', icon: '🏆' },
  { id: 'volunteering', label: 'Volunteering', icon: '🌱' },
];

interface Props {
  events: EventItem[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  cityFilter: string;
  setCityFilter: (c: string) => void;
  localityFilter: string;
  setLocalityFilter: (loc: string) => void;
  radiusFilter: string;
  setRadiusFilter: (rad: string) => void;
  formatFilter: string;
  setFormatFilter: (fmt: string) => void;
  priceFilter: string;
  setPriceFilter: (p: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  onSelectEvent: (event: EventItem) => void;
  onToggleBookmark: (event: EventItem) => void;
  onTogglePlanner: (event: EventItem) => void;
  onOpenTrustModal: (event: EventItem) => void;
  onQuickRegister: (event: EventItem) => void;
  onReportEvent?: (event: EventItem) => void;
  onNavigateTab?: (tab: string) => void;
  onSearchThisArea?: (bounds: { min_lat: number; max_lat: number; min_lng: number; max_lng: number }) => void;
}

export const DiscoverPage: React.FC<Props> = ({
  events,
  loading,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  cityFilter,
  setCityFilter,
  localityFilter,
  setLocalityFilter,
  radiusFilter,
  setRadiusFilter,
  formatFilter,
  setFormatFilter,
  priceFilter,
  setPriceFilter,
  sortBy,
  setSortBy,
  onSelectEvent,
  onToggleBookmark,
  onTogglePlanner,
  onOpenTrustModal,
  onQuickRegister,
  onReportEvent,
  onNavigateTab,
  onSearchThisArea,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'grid' | 'map'>('split');
  const [mobileTab, setMobileTab] = useState<'list' | 'map'>('list');
  const [citiesList, setCitiesList] = useState<CityInfo[]>([]);
  const [localitiesList, setLocalitiesList] = useState<LocalityInfo[]>([]);
  const [highlightedMarkerId, setHighlightedMarkerId] = useState<string | null>(null);

  useEffect(() => {
    fetchCities()
      .then((data) => setCitiesList(data.cities))
      .catch((err) => console.error('Failed to load cities', err));
  }, []);

  useEffect(() => {
    fetchLocalities(cityFilter !== 'all' ? cityFilter : undefined)
      .then((data) => setLocalitiesList(data.localities))
      .catch((err) => console.error('Failed to load localities', err));
  }, [cityFilter]);

  // Count mapped vs virtual events
  const mappedCount = events.filter(
    (e) => typeof e.latitude === 'number' && typeof e.longitude === 'number' && e.latitude !== 0 && e.longitude !== 0
  ).length;

  return (
    <div className="space-y-4 pb-12 w-full animate-fade-in">
      
      {/* SCREEN 1: Hero Section from Image 1 */}
      <section className="relative rounded-3xl overflow-hidden border border-theme bg-surface shadow-card transition-all">
        {/* Subtle decorative glow in dark and light */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative p-6 sm:p-8 lg:p-10 space-y-5">
          {/* Top trust badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span>Smart Hyperlocal Event Intelligence</span>
          </div>

          {/* Hero Headline and Subtitle */}
          <div className="max-w-3xl space-y-2.5">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-main leading-[1.15]">
              Discover Tech Events with <span className="text-brand">Auditable Trust.</span>
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-secondary leading-relaxed max-w-2xl font-normal">
              Explore authentic hackathons, workshops, and developer meetups near you. Every listing is scored out of 100 with transparent signals and duplicate safeguards.
            </p>
          </div>

          {/* Location & Active Count strip */}
          <div className="flex items-center gap-4 text-xs text-secondary">
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Bengaluru Tech Corridor & Remote</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-brand" />
              <span>{events.length} Active Verified Listings</span>
            </span>
          </div>

          {/* Search Bar Input */}
          <div className="max-w-2xl pt-1">
            <div className="relative flex items-center bg-surface-secondary/80 rounded-2xl border border-theme focus-within:border-brand shadow-sm px-4 py-3">
              <Search className="w-4 h-4 text-secondary shrink-0 mr-3" />
              <input
                type="text"
                placeholder="Search by event title, tech stack (e.g. React, PyTorch), venue, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-main text-xs sm:text-sm placeholder:text-muted focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-muted hover:text-main cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          {/* Quick Category Chips from Image */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none pt-1">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 text-white shadow-md shadow-brand/25 ring-2 ring-brand/30'
                      : 'bg-surface-secondary/80 text-secondary hover:text-main hover:bg-surface border border-theme'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Live Platform Stats Row */}
          <div className="pt-3 border-t border-theme grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
            <div>
              <div className="text-base sm:text-xl font-extrabold text-main">{events.length}+</div>
              <div className="text-[11px] text-secondary font-medium">Curated Local Events</div>
            </div>
            <div>
              <div className="text-base sm:text-xl font-extrabold text-brand">100% Verified</div>
              <div className="text-[11px] text-secondary font-medium">7-Signal Host Trust</div>
            </div>
            <div>
              <div className="text-base sm:text-xl font-extrabold text-main">{localitiesList.length || 9} Active Hubs</div>
              <div className="text-[11px] text-secondary font-medium">Bengaluru Tech Hubs</div>
            </div>
            <div>
              <div className="text-base sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400">Zero Conflict</div>
              <div className="text-[11px] text-secondary font-medium">Calendar Intelligence</div>
            </div>
          </div>
        </div>
      </section>

      {/* TOP WORKSPACE NAVIGATION & VIEW SWITCHER STRIP */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-surface border border-theme shadow-sm">
        
        {/* Left: Corridor title & stats */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold shrink-0">
            <Compass className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-main">
                {cityFilter === 'all' ? 'All Cities' : cityFilter} Tech Explorer
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                Live Leaflet GPS
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-secondary">
              <span><strong>{events.length}</strong> events</span>
              <span>•</span>
              <span>📍 {mappedCount} mapped in corridors</span>
              {localityFilter !== 'all' && (
                <>
                  <span>•</span>
                  <span className="text-brand font-semibold">{localityFilter}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Sort + View Mode Switcher */}
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          
          {/* Sort selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-secondary border border-theme text-xs">
            <ListFilter className="w-3.5 h-3.5 text-muted" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-main font-semibold focus:outline-none cursor-pointer"
            >
              <option value="relevance">Top Relevance</option>
              <option value="date">Upcoming Date</option>
              <option value="trust">Highest Trust</option>
              <option value="seats">Available Seats</option>
              <option value="distance">Nearest Distance</option>
            </select>
          </div>

          {/* View Modes (Split / Grid / Map) */}
          <div className="flex items-center p-1 bg-surface-secondary rounded-xl border border-theme">
            <button
              onClick={() => setViewMode('split')}
              title="Split View (Feed + Map Explorer)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-secondary hover:text-main'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Split Explorer</span>
            </button>

            <button
              onClick={() => setViewMode('grid')}
              title="Grid Cards Only"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-secondary hover:text-main'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Card Grid</span>
            </button>

            <button
              onClick={() => setViewMode('map')}
              title="Full Screen Map"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-secondary hover:text-main'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Full Map</span>
            </button>
          </div>

        </div>

      </div>

      {/* MOBILE SEGMENTED CONTROL (List vs Map) */}
      <div className="flex lg:hidden items-center p-1 bg-surface rounded-2xl border border-theme shadow-sm">
        <button
          onClick={() => setMobileTab('list')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
            mobileTab === 'list'
              ? 'bg-brand text-white shadow-sm'
              : 'text-secondary hover:text-main'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Event Feed ({events.length})</span>
        </button>
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
            mobileTab === 'map'
              ? 'bg-brand text-white shadow-sm'
              : 'text-secondary hover:text-main'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Interactive Map ({mappedCount})</span>
        </button>
      </div>

      {/* VIEW MODE 1: SPLIT EXPLORER (Left Scrollable Feed + Right Large Leaflet Map) */}
      {viewMode === 'split' && (
        <div className="flex flex-col lg:flex-row items-stretch gap-4 w-full">
          
          {/* Left Event Feed Column */}
          <div
            className={`w-full lg:w-[390px] xl:w-[440px] shrink-0 space-y-3 ${
              mobileTab === 'map' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* Feed Sub-Header */}
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-bold text-main">
                Filtered Discoveries ({events.length})
              </span>
              {localityFilter !== 'all' && (
                <button
                  onClick={() => setLocalityFilter('all')}
                  className="text-[11px] font-semibold text-brand hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Clear Hub</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Scrollable Feed Cards */}
            <div className="h-[520px] lg:h-[calc(100vh-175px)] overflow-y-auto space-y-2.5 pr-1.5 scrollbar-thin">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className="h-28 rounded-2xl bg-surface border border-theme animate-pulse p-3 space-y-2"
                    >
                      <div className="h-4 w-3/4 rounded bg-surface-secondary" />
                      <div className="h-3 w-1/2 rounded bg-surface-secondary" />
                    </div>
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="p-8 text-center rounded-3xl bg-surface border border-theme space-y-3 shadow-card">
                  <AlertCircle className="w-8 h-8 text-muted mx-auto" />
                  <h3 className="text-sm font-bold text-main">No matching events in area</h3>
                  <p className="text-xs text-secondary">
                    Try clearing your search query or expanding your radius.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setLocalityFilter('all');
                      setRadiusFilter('all');
                      setFormatFilter('all');
                      setPriceFilter('all');
                    }}
                    className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold transition-all shadow-sm cursor-pointer hover:bg-brand-hover"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                events.map((ev) => (
                  <CompactEventCard
                    key={ev.id}
                    event={ev}
                    isSelected={highlightedMarkerId === ev.id}
                    onSelect={(selected) => {
                      setHighlightedMarkerId(selected.id);
                      onSelectEvent(selected);
                    }}
                    onToggleBookmark={onToggleBookmark}
                    onOpenTrustModal={onOpenTrustModal}
                    onQuickRegister={onQuickRegister}
                    onMouseEnter={() => setHighlightedMarkerId(ev.id)}
                    onMouseLeave={() => setHighlightedMarkerId(null)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right Map Workspace Column */}
          <div
            className={`flex-1 min-w-0 ${
              mobileTab === 'list' ? 'hidden lg:block' : 'block'
            }`}
          >
            <RealLeafletMap
              events={events}
              localities={localitiesList}
              selectedLocality={localityFilter}
              onSelectLocality={(loc) => setLocalityFilter(loc)}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
              selectedCity={cityFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              radiusFilter={radiusFilter}
              onRadiusChange={setRadiusFilter}
              priceFilter={priceFilter}
              onPriceChange={setPriceFilter}
              formatFilter={formatFilter}
              onFormatChange={setFormatFilter}
              onSelectEvent={onSelectEvent}
              onOpenTrustModal={onOpenTrustModal}
              onSearchThisArea={onSearchThisArea}
              highlightedEventId={highlightedMarkerId}
              onHoverEvent={(id) => setHighlightedMarkerId(id)}
              containerHeight="h-[520px] lg:h-[calc(100vh-175px)]"
            />
          </div>

        </div>
      )}

      {/* VIEW MODE 2: FULL MAP VIEW */}
      {viewMode === 'map' && (
        <div className="w-full">
          <RealLeafletMap
            events={events}
            localities={localitiesList}
            selectedLocality={localityFilter}
            onSelectLocality={(loc) => setLocalityFilter(loc)}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
            selectedCity={cityFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            radiusFilter={radiusFilter}
            onRadiusChange={setRadiusFilter}
            priceFilter={priceFilter}
            onPriceChange={setPriceFilter}
            formatFilter={formatFilter}
            onFormatChange={setFormatFilter}
            onSelectEvent={onSelectEvent}
            onOpenTrustModal={onOpenTrustModal}
            onSearchThisArea={onSearchThisArea}
            highlightedEventId={highlightedMarkerId}
            onHoverEvent={(id) => setHighlightedMarkerId(id)}
            containerHeight="h-[650px] lg:h-[calc(100vh-160px)]"
          />
        </div>
      )}

      {/* VIEW MODE 3: CARD GRID VIEW */}
      {viewMode === 'grid' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-96 rounded-3xl bg-surface border border-theme animate-pulse p-4 space-y-4 shadow-card"
                >
                  <div className="h-44 rounded-2xl bg-surface-secondary" />
                  <div className="h-4 w-3/4 rounded bg-surface-secondary" />
                  <div className="h-3 w-1/2 rounded bg-surface-secondary" />
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-surface border border-theme space-y-3 shadow-card">
              <AlertCircle className="w-10 h-10 text-muted mx-auto" />
              <h3 className="text-base font-bold text-main">No matching events found</h3>
              <p className="text-xs text-secondary max-w-sm mx-auto">
                Try adjusting your search query, clear locality filters, or explore all categories.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setFormatFilter('all');
                  setPriceFilter('all');
                  setLocalityFilter('all');
                  setRadiusFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold transition-all shadow-sm cursor-pointer hover:bg-brand-hover"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onSelect={(selected) => {
                    setHighlightedMarkerId(selected.id);
                    onSelectEvent(selected);
                  }}
                  onToggleBookmark={onToggleBookmark}
                  onTogglePlanner={onTogglePlanner}
                  onOpenTrustModal={onOpenTrustModal}
                  onQuickRegister={onQuickRegister}
                  onReportEvent={onReportEvent}
                  isHighlighted={highlightedMarkerId === ev.id}
                />
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
};
