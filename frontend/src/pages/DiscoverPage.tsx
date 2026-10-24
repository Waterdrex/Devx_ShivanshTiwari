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
  Radar,
  CalendarDays,
  Users2,
  Vote,
  ArrowRight,
  Filter
} from 'lucide-react';
import { EventItem, LocalityInfo } from '../types';
import { EventCard } from '../components/EventCard';
import { RealLeafletMap } from '../components/RealLeafletMap';
import { fetchLocalities } from '../api';

interface Props {
  events: EventItem[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  formatFilter: string;
  setFormatFilter: (fmt: string) => void;
  priceFilter: string;
  setPriceFilter: (p: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  localityFilter: string;
  setLocalityFilter: (loc: string) => void;
  onSelectEvent: (event: EventItem) => void;
  onToggleBookmark: (event: EventItem) => void;
  onTogglePlanner: (event: EventItem) => void;
  onOpenTrustModal: (event: EventItem) => void;
  onQuickRegister: (event: EventItem) => void;
  onReportEvent?: (event: EventItem) => void;
  onNavigateTab?: (tab: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Events', icon: '🌟' },
  { id: 'hackathons', label: 'Hackathons', icon: '⚡' },
  { id: 'workshops', label: 'Workshops', icon: '🛠️' },
  { id: 'tech_meetups', label: 'Tech Meetups', icon: '☕' },
  { id: 'coding_contests', label: 'Contests', icon: '🏆' },
  { id: 'volunteering', label: 'Volunteering', icon: '🌱' },
];

export const DiscoverPage: React.FC<Props> = ({
  events,
  loading,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  formatFilter,
  setFormatFilter,
  priceFilter,
  setPriceFilter,
  sortBy,
  setSortBy,
  localityFilter,
  setLocalityFilter,
  onSelectEvent,
  onToggleBookmark,
  onTogglePlanner,
  onOpenTrustModal,
  onQuickRegister,
  onReportEvent,
  onNavigateTab,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [localitiesList, setLocalitiesList] = useState<LocalityInfo[]>([]);
  const [highlightedMarkerId, setHighlightedMarkerId] = useState<string | null>(null);

  useEffect(() => {
    fetchLocalities()
      .then((data) => setLocalitiesList(data.localities))
      .catch((err) => console.error('Failed to load localities', err));
  }, []);

  return (
    <div className="space-y-6 pb-16">
      
      {/* SaaS Discovery Header & Quick Actions Bar */}
      <div className="rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm relative overflow-hidden transition-colors">
        <div className="relative max-w-4xl space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Hyperlocal Community Discovery</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-700 text-xs font-semibold">
              <span>Bengaluru Tech Corridor • 9 Active Hubs</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Discover Verified Tech Events & Hackathons
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            Explore authentic hackathons, technical workshops, and developer meetups with genuine OpenStreetMap GPS pins, verified KYC trust scoring, and conflict-free schedule intelligence.
          </p>

          {/* Feature Quick Launch Bar */}
          {onNavigateTab && (
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => onNavigateTab('radar')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-navy-700 hover:border-violet-500/40 font-semibold transition-all shadow-sm"
              >
                <Radar className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <span>Opportunity Radar</span>
              </button>

              <button
                onClick={() => onNavigateTab('planner')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-navy-700 hover:border-teal-500/40 font-semibold transition-all shadow-sm"
              >
                <CalendarDays className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Smart Planner</span>
              </button>

              <button
                onClick={() => onNavigateTab('teammatch')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-navy-700 hover:border-amber-500/40 font-semibold transition-all shadow-sm"
              >
                <Users2 className="w-3.5 h-3.5 text-amber-500" />
                <span>TeamMatch 2.0</span>
              </button>

              <button
                onClick={() => onNavigateTab('demands')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-navy-700 hover:border-rose-500/40 font-semibold transition-all shadow-sm"
              >
                <Vote className="w-3.5 h-3.5 text-rose-500" />
                <span>Community Wishlist</span>
              </button>
            </div>
          )}
        </div>

        {/* Search Bar Input & View Switcher */}
        <div className="relative mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event title, tech stack (e.g. React, PyTorch, Rust), venue, or locality..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white dark:bg-navy-950/90 border border-slate-200 dark:border-navy-700/80 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* List vs Real Map View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-navy-950 rounded-2xl border border-slate-200 dark:border-navy-700/80 shrink-0 shadow-inner">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gradient-to-r dark:from-violet-600 dark:to-teal-500 text-violet-700 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-gradient-to-r dark:from-violet-600 dark:to-teal-500 text-violet-700 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span>Real Map View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Category Controls */}
      <div className="space-y-4">
        {/* Category & Locality Pills */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                    active
                      ? 'bg-gradient-to-r from-violet-600 to-teal-500 text-white shadow-md shadow-violet-900/20'
                      : 'bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-850 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-navy-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Toggle Advanced Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              showFilters
                ? 'bg-violet-50 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-600'
                : 'bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            <span>Filters & Locality ({localityFilter !== 'all' ? localityFilter : 'All'})</span>
          </button>
        </div>

        {/* Expandable Filter Drawer */}
        {showFilters && (
          <div className="p-4 rounded-2xl bg-white dark:bg-navy-900/90 border border-slate-200 dark:border-navy-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs animate-fade-in shadow-sm">
            {/* Locality Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Bengaluru Locality
              </label>
              <select
                value={localityFilter}
                onChange={(e) => setLocalityFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-violet-500"
              >
                <option value="all">All Hubs (Bengaluru Wide)</option>
                {localitiesList.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name} ({loc.event_count} events)
                  </option>
                ))}
              </select>
            </div>

            {/* Format Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Format / Mode
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'offline', label: 'In-Person' },
                  { id: 'online', label: 'Virtual' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormatFilter(f.id)}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-center font-semibold ${
                      formatFilter === f.id
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-slate-50 dark:bg-navy-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-navy-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Pricing
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'free', label: 'Free' },
                  { id: 'paid', label: 'Paid' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPriceFilter(p.id)}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-center font-semibold ${
                      priceFilter === p.id
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-slate-50 dark:bg-navy-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-navy-800'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Sort Listings By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-violet-500"
              >
                <option value="relevance">Relevance & Trust</option>
                <option value="date">Date (Earliest First)</option>
                <option value="popularity">Popularity (Most Seats Taken)</option>
                <option value="trust">Highest Trust Score</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main View Area: Either Real Leaflet Map or Grid View */}
      {viewMode === 'map' ? (
        <RealLeafletMap
          events={events}
          localities={localitiesList}
          selectedLocality={localityFilter}
          onSelectLocality={(loc) => setLocalityFilter(loc)}
          onSelectEvent={onSelectEvent}
          onOpenTrustModal={onOpenTrustModal}
          highlightedEventId={highlightedMarkerId}
        />
      ) : (
        <>
          {loading ? (
            /* Skeleton Loading Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-80 rounded-3xl bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-800 animate-pulse p-4 space-y-4"
                >
                  <div className="h-40 rounded-2xl bg-slate-200 dark:bg-navy-800" />
                  <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-navy-800" />
                  <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-navy-800" />
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-navy-800 space-y-3 shadow-sm">
              <AlertCircle className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No matching events found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Try adjusting your search keywords, clear locality filters, or explore all formats.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setFormatFilter('all');
                  setPriceFilter('all');
                  setLocalityFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
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
