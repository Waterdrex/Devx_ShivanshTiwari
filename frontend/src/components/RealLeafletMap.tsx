import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { 
  Search, 
  MapPin, 
  Navigation, 
  Maximize2, 
  Plus, 
  Minus, 
  Crosshair, 
  Layers, 
  Zap, 
  TrainFront, 
  Calendar, 
  Clock, 
  ExternalLink, 
  X, 
  Filter, 
  ChevronDown, 
  Check, 
  Download, 
  Share2,
  Sparkles,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { EventItem, LocalityInfo, CommunityGap } from '../types';
import { useTheme } from '../context/ThemeContext';
import { fetchCommunityGaps } from '../api';
import { getGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar';
import { BENGALURU_METRO_LINES } from '../utils/transitData';

interface Props {
  events: EventItem[];
  localities: LocalityInfo[];
  selectedLocality: string;
  onSelectLocality: (loc: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  radiusFilter?: string;
  onRadiusChange?: (rad: string) => void;
  priceFilter?: string;
  onPriceChange?: (p: string) => void;
  formatFilter?: string;
  onFormatChange?: (f: string) => void;
  onSelectEvent: (event: EventItem) => void;
  onOpenTrustModal: (event: EventItem) => void;
  onSearchThisArea?: (bounds: { min_lat: number; max_lat: number; min_lng: number; max_lng: number }) => void;
  highlightedEventId?: string | null;
  onHoverEvent?: (id: string | null) => void;
  containerHeight?: string;
}

const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946]; // Central Bengaluru
const DEFAULT_ZOOM = 12;

const CATEGORY_COLORS: Record<string, { bg: string; border: string; glow: string; text: string; icon: string }> = {
  hackathons: { bg: '#8B5CF6', border: '#7C3AED', glow: 'rgba(139, 92, 246, 0.45)', text: 'Hackathons', icon: '⚡' },
  workshops: { bg: '#14B8A6', border: '#0D9488', glow: 'rgba(20, 184, 166, 0.45)', text: 'Workshops', icon: '🛠️' },
  tech_meetups: { bg: '#38BDF8', border: '#0284C7', glow: 'rgba(56, 189, 248, 0.45)', text: 'Tech Meetups', icon: '☕' },
  coding_contests: { bg: '#F59E0B', border: '#D97706', glow: 'rgba(245, 158, 11, 0.45)', text: 'Contests', icon: '🏆' },
  volunteering: { bg: '#10B981', border: '#059669', glow: 'rgba(16, 185, 129, 0.45)', text: 'Volunteering', icon: '🌱' },
};

const CATEGORIES_LIST = [
  { id: 'all', label: 'All', icon: '🌟' },
  { id: 'hackathons', label: 'Hackathons', icon: '⚡' },
  { id: 'workshops', label: 'Workshops', icon: '🛠️' },
  { id: 'tech_meetups', label: 'Meetups', icon: '☕' },
  { id: 'coding_contests', label: 'Contests', icon: '🏆' },
  { id: 'volunteering', label: 'Volunteering', icon: '🌱' },
];

export const RealLeafletMap: React.FC<Props> = ({
  events,
  localities,
  selectedLocality,
  onSelectLocality,
  selectedCategory,
  onSelectCategory,
  searchQuery = '',
  onSearchChange,
  radiusFilter = 'all',
  onRadiusChange,
  priceFilter = 'all',
  onPriceChange,
  formatFilter = 'all',
  onFormatChange,
  onSelectEvent,
  onOpenTrustModal,
  onSearchThisArea,
  highlightedEventId,
  onHoverEvent,
  containerHeight = 'h-[620px] lg:h-[calc(100vh-140px)]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pulseLayerRef = useRef<L.LayerGroup | null>(null);
  const transitLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const { resolvedTheme } = useTheme();

  // Floating controls state
  const [mapStyle, setMapStyle] = useState<'standard' | 'pulse' | 'transit'>('standard');
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [showMoreFilters, setShowMoreFilters] = useState<boolean>(false);
  const [showAreaSearchBtn, setShowAreaSearchBtn] = useState<boolean>(false);
  const [communityGaps, setCommunityGaps] = useState<CommunityGap[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState<boolean>(false);
  const [showCalendarMenu, setShowCalendarMenu] = useState<boolean>(false);

  // Filter events with real coordinates
  const mappedEvents = events.filter(
    (e) => typeof e.latitude === 'number' && typeof e.longitude === 'number' && e.latitude !== 0 && e.longitude !== 0
  );

  // 1. Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });

    // Custom layer groups
    markersLayerRef.current = L.layerGroup().addTo(map);
    pulseLayerRef.current = L.layerGroup().addTo(map);
    transitLayerRef.current = L.layerGroup().addTo(map);

    // Attribution
    L.control
      .attribution({ position: 'bottomright', prefix: false })
      .addAttribution(
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
      )
      .addTo(map);

    // Listen to drag/pan events to show "Search this area" button
    map.on('moveend', () => {
      setShowAreaSearchBtn(true);
    });

    mapInstanceRef.current = map;

    // Invalidate size to ensure crisp tiles on mount
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Tile layer for Free, Keyless Map Rendering (No Watermarks, No API Key Required)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    // Standard OpenStreetMap tiles: 100% free, keyless, and styled dynamically via CSS for dark mode
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const newTileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    });

    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;
    map.invalidateSize();
  }, [resolvedTheme]);

  // 3. Render Event Markers and Spatial Clustering
  const renderMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const zoom = map.getZoom();
    const bounds: [number, number][] = [];

    // When zoomed far out (zoom <= 11), cluster events by locality or proximity
    if (zoom <= 11 && mappedEvents.length > 5) {
      // Proximity clustering by locality
      const clusters: Record<string, { lat: number; lng: number; count: number; category: string; events: EventItem[] }> = {};
      mappedEvents.forEach((ev) => {
        const key = ev.locality || 'Bengaluru';
        if (!clusters[key]) {
          clusters[key] = {
            lat: ev.latitude!,
            lng: ev.longitude!,
            count: 0,
            category: ev.category,
            events: [],
          };
        }
        clusters[key].count += 1;
        clusters[key].events.push(ev);
        bounds.push([ev.latitude!, ev.longitude!]);
      });

      Object.entries(clusters).forEach(([locName, cluster]) => {
        const color = CATEGORY_COLORS[cluster.category]?.bg || '#8B5CF6';
        const clusterHtml = `
          <div class="custom-cluster-marker" style="
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, ${color}, #4f46e5);
            border: 3px solid #ffffff;
            box-shadow: 0 6px 20px rgba(0,0,0,0.35);
          ">
            <span>${cluster.count}</span>
          </div>
        `;

        const icon = L.divIcon({
          className: 'cluster-icon',
          html: clusterHtml,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        const marker = L.marker([cluster.lat, cluster.lng], { icon });
        marker.on('click', () => {
          map.flyTo([cluster.lat, cluster.lng], 13, { duration: 0.8 });
          if (cluster.events.length > 0) {
            setActiveEvent(cluster.events[0]);
          }
        });
        marker.bindTooltip(`<strong>${locName}</strong>: ${cluster.count} Events`, { direction: 'top' });
        markersLayer.addLayer(marker);
      });
      return;
    }

    // Individual category pins when zoom > 11
    mappedEvents.forEach((ev) => {
      const lat = ev.latitude!;
      const lng = ev.longitude!;
      bounds.push([lat, lng]);

      const colors = CATEGORY_COLORS[ev.category] || {
        bg: '#8B5CF6',
        border: '#7C3AED',
        glow: 'rgba(139, 92, 246, 0.45)',
        text: 'Event',
        icon: '🌟',
      };

      const isSelected = highlightedEventId === ev.id || activeEvent?.id === ev.id;

      const markerHtml = `
        <div class="custom-leaflet-marker ${isSelected ? 'is-active' : ''}" style="width: 36px; height: 36px;">
          <div style="
            position: absolute;
            width: 30px;
            height: 30px;
            background: ${colors.bg};
            border: 2.5px solid #ffffff;
            box-shadow: 0 4px 14px ${colors.glow};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="
              transform: rotate(45deg);
              font-size: 11px;
              line-height: 1;
            ">${colors.icon}</span>
          </div>
          ${
            isSelected
              ? `<div style="
                  position: absolute;
                  width: 44px;
                  height: 44px;
                  border-radius: 50%;
                  border: 2.5px solid ${colors.bg};
                  animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;
                "></div>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-pin-wrapper',
        html: markerHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 34],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        setActiveEvent(ev);
        onHoverEvent?.(ev.id);
        map.panTo([lat, lng]);
      });

      marker.on('mouseover', () => {
        onHoverEvent?.(ev.id);
      });

      marker.bindTooltip(
        `<div style="font-family: inherit; font-size: 11px; padding: 2px 4px;">
          <strong style="color: ${colors.bg}">${ev.category.replace('_', ' ').toUpperCase()}</strong><br/>
          <strong>${ev.title}</strong><br/>
          <span>${ev.price_type === 'free' ? 'FREE' : '₹' + ev.price} • ${ev.locality || 'Bengaluru'}</span>
        </div>`,
        { direction: 'top', offset: [0, -30] }
      );

      markersLayer.addLayer(marker);
    });
  }, [mappedEvents, highlightedEventId, activeEvent, onHoverEvent]);

  // Re-render markers on changes
  useEffect(() => {
    renderMarkers();
    const map = mapInstanceRef.current;
    if (map) {
      map.on('zoomend', renderMarkers);
      return () => {
        map.off('zoomend', renderMarkers);
      };
    }
  }, [renderMarkers]);

  // 4. Handle External Highlight Event ID changes (e.g. from hovering list card)
  useEffect(() => {
    if (!highlightedEventId) return;
    const ev = mappedEvents.find((e) => e.id === highlightedEventId);
    if (ev && ev.latitude && ev.longitude) {
      setActiveEvent(ev);
      const map = mapInstanceRef.current;
      if (map) {
        map.panTo([ev.latitude, ev.longitude], { animate: true });
      }
    }
  }, [highlightedEventId]);

  // 5. Handle Locality Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedLocality && selectedLocality !== 'all') {
      const loc = localities.find((l) => l.name.toLowerCase() === selectedLocality.toLowerCase());
      if (loc && loc.latitude && loc.longitude) {
        map.flyTo([loc.latitude, loc.longitude], 13.5, { duration: 0.8 });
        setShowAreaSearchBtn(false);
      }
    }
  }, [selectedLocality, localities]);

  // 6. Community Pulse Layer
  useEffect(() => {
    const pulseLayer = pulseLayerRef.current;
    if (!pulseLayer) return;
    pulseLayer.clearLayers();

    if (mapStyle !== 'pulse') return;

    // Fetch and render community gaps
    fetchCommunityGaps()
      .then((data) => {
        setCommunityGaps(data.gaps || []);
        data.gaps.forEach((gap) => {
          // Match locality coords
          const loc = localities.find((l) => l.name.toLowerCase() === gap.locality.toLowerCase());
          if (loc && loc.latitude && loc.longitude) {
            const radius = Math.min(2200, Math.max(900, gap.gap_score * 25));

            // Inner glowing circle
            const circle = L.circle([loc.latitude, loc.longitude], {
              radius,
              color: '#F43F5E',
              weight: 2,
              opacity: 0.8,
              fillColor: '#F43F5E',
              fillOpacity: 0.18,
            });

            const popupContent = `
              <div style="padding: 10px; font-family: inherit; font-size: 11px;">
                <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                  <span style="background: #F43F5E22; color: #F43F5E; font-weight: 700; padding: 2px 6px; border-radius: 9999px;">
                    🔥 DEMAND GAP: ${gap.gap_score}/100
                  </span>
                </div>
                <h4 style="font-weight: 800; font-size: 12px; margin: 4px 0;">${gap.locality} Ecosystem Need</h4>
                <p style="margin: 2px 0 6px 0; opacity: 0.85;">Suggested Topic: <strong>${gap.suggested_topic}</strong></p>
                <div style="font-size: 10px; opacity: 0.7;">Category: ${gap.category} • Format: ${gap.suggested_format}</div>
              </div>
            `;
            circle.bindPopup(popupContent);
            pulseLayer.addLayer(circle);
          }
        });
      })
      .catch((err) => console.error('Failed to load community gaps for pulse layer', err));
  }, [mapStyle, localities]);

  // 7. Transit View (Namma Metro Lines & Stations)
  useEffect(() => {
    const transitLayer = transitLayerRef.current;
    if (!transitLayer) return;
    transitLayer.clearLayers();

    if (mapStyle !== 'transit') return;

    BENGALURU_METRO_LINES.forEach((line) => {
      // Draw polyline track
      const polyline = L.polyline(line.coordinates, {
        color: line.color,
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '8, 6',
      });
      polyline.bindTooltip(`<strong>${line.name}</strong>`, { sticky: true });
      transitLayer.addLayer(polyline);

      // Draw station nodes
      line.stations.forEach((st) => {
        const isInterchange = st.isInterchange;
        const stationHtml = `
          <div style="
            width: ${isInterchange ? '16px' : '12px'};
            height: ${isInterchange ? '16px' : '12px'};
            background: #ffffff;
            border: 3px solid ${line.color};
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          "></div>
        `;
        const icon = L.divIcon({
          className: 'station-icon',
          html: stationHtml,
          iconSize: [isInterchange ? 16 : 12, isInterchange ? 16 : 12],
          iconAnchor: [isInterchange ? 8 : 6, isInterchange ? 8 : 6],
        });

        const stMarker = L.marker(st.coords, { icon });
        stMarker.bindTooltip(`🚇 <strong>${st.name}</strong>${isInterchange ? ' (Interchange Hub)' : ''}`, {
          direction: 'top',
        });
        transitLayer.addLayer(stMarker);
      });
    });
  }, [mapStyle]);

  // 8. Locate Me Handler
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);

        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo([latitude, longitude], 14, { duration: 1 });

          // Add / update user marker
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([latitude, longitude]);
          } else {
            const userIconHtml = `
              <div style="
                width: 20px;
                height: 20px;
                background: #3B82F6;
                border: 3px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 0 16px rgba(59, 130, 246, 0.8);
                animation: pulse 2s infinite;
              "></div>
            `;
            const icon = L.divIcon({
              className: 'user-pos-icon',
              html: userIconHtml,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });
            userMarkerRef.current = L.marker([latitude, longitude], { icon }).addTo(map);
            userMarkerRef.current.bindTooltip('📍 Your Current Location', { permanent: false, direction: 'top' });
          }
        }
      },
      (err) => {
        setLocating(false);
        console.warn('Geolocation failed or denied', err);
        // Fallback gracefully to central Bengaluru
        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo(DEFAULT_CENTER, 13, { duration: 0.8 });
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // 9. Reset Map View ("Fit All")
  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    if (!map || mappedEvents.length === 0) return;
    const bounds = mappedEvents.map((e) => [e.latitude!, e.longitude!] as [number, number]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    onSelectLocality('all');
    setShowAreaSearchBtn(false);
  };

  // 10. "Search This Area" Trigger
  const handleSearchAreaClick = () => {
    const map = mapInstanceRef.current;
    if (!map || !onSearchThisArea) return;
    const b = map.getBounds();
    onSearchThisArea({
      min_lat: b.getSouth(),
      max_lat: b.getNorth(),
      min_lng: b.getWest(),
      max_lng: b.getEast(),
    });
    setShowAreaSearchBtn(false);
  };

  return (
    <div className={`relative w-full ${containerHeight} rounded-3xl overflow-hidden border border-theme bg-surface shadow-card transition-all isolate select-none`}>
      
      {/* 1. TOP FLOATING SEARCH & FILTER BAR */}
      <div className="absolute top-4 left-4 right-4 sm:left-6 sm:right-6 z-[600] pointer-events-none">
        <div className="max-w-3xl mx-auto space-y-2 pointer-events-auto">
          
          {/* Main Search Pill Bar */}
          <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-surface/90 dark:bg-surface/90 backdrop-blur-xl border border-theme shadow-elevated">
            
            {/* Search Input */}
            <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-surface-secondary/70 rounded-xl border border-theme focus-within:border-brand transition-all">
              <Search className="w-4 h-4 text-secondary shrink-0" />
              <input
                type="text"
                placeholder="Search events, venues, skills..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full bg-transparent text-main text-xs sm:text-sm placeholder:text-muted focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange?.('')}
                  className="p-1 text-muted hover:text-main cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Hyperlocal Locality Dropdown */}
            <div className="relative shrink-0 hidden sm:block">
              <select
                value={selectedLocality}
                onChange={(e) => onSelectLocality(e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface-secondary/70 border border-theme text-main text-xs font-semibold focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="all">📍 All Bengaluru ({mappedEvents.length})</option>
                {localities.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name} ({loc.event_count})
                  </option>
                ))}
              </select>
            </div>

            {/* Distance Radius Selector */}
            {onRadiusChange && (
              <div className="relative shrink-0 hidden md:block">
                <select
                  value={radiusFilter}
                  onChange={(e) => onRadiusChange(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-surface-secondary/70 border border-theme text-main text-xs font-semibold focus:outline-none focus:border-brand cursor-pointer"
                >
                  <option value="all">Radius: Any</option>
                  <option value="2">Within 2 km</option>
                  <option value="5">Within 5 km</option>
                  <option value="10">Within 10 km</option>
                  <option value="20">Within 20 km</option>
                </select>
              </div>
            )}

            {/* More Filters Toggle */}
            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              title="More filters"
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                showMoreFilters || priceFilter !== 'all' || formatFilter !== 'all'
                  ? 'bg-brand text-white border-brand shadow-sm'
                  : 'bg-surface-secondary/70 text-secondary hover:text-main border-theme'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Floating Category Filter Chips Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none px-1">
            {CATEGORIES_LIST.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap backdrop-blur-md transition-all shadow-sm cursor-pointer ${
                    isActive
                      ? 'bg-brand text-white shadow-brand/20 ring-2 ring-brand/40'
                      : 'bg-surface/85 dark:bg-surface/85 text-secondary hover:text-main border border-theme hover:border-brand/40'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* More Filters Popover Drawer */}
          {showMoreFilters && (
            <div className="p-3.5 rounded-2xl bg-surface/95 backdrop-blur-xl border border-theme shadow-elevated grid grid-cols-2 gap-3 text-xs animate-fade-in pointer-events-auto">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                  Format
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {['all', 'offline', 'online'].map((f) => (
                    <button
                      key={f}
                      onClick={() => onFormatChange?.(f)}
                      className={`py-1 rounded-lg text-center font-medium capitalize border cursor-pointer ${
                        formatFilter === f
                          ? 'bg-brand text-white border-brand'
                          : 'bg-surface-secondary text-secondary border-theme'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                  Ticket Price
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {['all', 'free', 'paid'].map((p) => (
                    <button
                      key={p}
                      onClick={() => onPriceChange?.(p)}
                      className={`py-1 rounded-lg text-center font-medium capitalize border cursor-pointer ${
                        priceFilter === p
                          ? 'bg-brand text-white border-brand'
                          : 'bg-surface-secondary text-secondary border-theme'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Search This Area Floating Pill */}
          {showAreaSearchBtn && onSearchThisArea && (
            <div className="flex justify-center animate-fade-in pt-1">
              <button
                onClick={handleSearchAreaClick}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand text-white text-xs font-bold shadow-elevated hover:bg-brand-hover active:scale-95 transition-all cursor-pointer ring-2 ring-white/20"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Search This Area</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* 2. TOP RIGHT: FLOATING MAP-STYLE SELECTOR */}
      <div className="absolute top-4 right-4 z-[500] hidden sm:flex items-center p-1 rounded-2xl bg-surface/90 backdrop-blur-xl border border-theme shadow-elevated">
        <button
          onClick={() => setMapStyle('standard')}
          title="Standard Event Map"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mapStyle === 'standard'
              ? 'bg-brand text-white shadow-sm'
              : 'text-secondary hover:text-main'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Standard</span>
        </button>

        <button
          onClick={() => setMapStyle('pulse')}
          title="Community Demand & Wishlist Heatmap"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mapStyle === 'pulse'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-secondary hover:text-main'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Community Pulse</span>
        </button>

        <button
          onClick={() => setMapStyle('transit')}
          title="Bengaluru Namma Metro Lines"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mapStyle === 'transit'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-secondary hover:text-main'
          }`}
        >
          <TrainFront className="w-3.5 h-3.5" />
          <span>Transit View</span>
        </button>
      </div>

      {/* 3. BOTTOM LEFT: CATEGORY COLOR LEGEND */}
      <div className="absolute bottom-5 left-5 z-[500] hidden md:block">
        <div className="p-3 rounded-2xl bg-surface/90 backdrop-blur-xl border border-theme shadow-elevated space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand" />
            <span>Map Category Pins</span>
          </div>
          <div className="flex flex-col gap-1 text-[11px]">
            {Object.entries(CATEGORY_COLORS).map(([key, c]) => (
              <button
                key={key}
                onClick={() => onSelectCategory(key === selectedCategory ? 'all' : key)}
                className={`flex items-center gap-2 px-2 py-0.5 rounded-lg text-left transition-all cursor-pointer ${
                  selectedCategory === key ? 'bg-brand/10 font-bold text-main' : 'text-secondary hover:text-main'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: c.bg, boxShadow: `0 0 6px ${c.glow}` }}
                />
                <span>{c.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. BOTTOM RIGHT: MAP UTILITY BUTTONS (Zoom, Locate, Fit All) */}
      <div className="absolute bottom-5 right-5 z-[500] flex flex-col gap-2">
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          title="Zoom In"
          className="w-9 h-9 rounded-xl bg-surface/90 backdrop-blur-xl border border-theme text-main flex items-center justify-center hover:bg-brand hover:text-white transition-all shadow-elevated cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          title="Zoom Out"
          className="w-9 h-9 rounded-xl bg-surface/90 backdrop-blur-xl border border-theme text-main flex items-center justify-center hover:bg-brand hover:text-white transition-all shadow-elevated cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          onClick={handleLocateMe}
          title="Locate Me (Current GPS)"
          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all shadow-elevated cursor-pointer ${
            locating
              ? 'bg-brand text-white border-brand animate-spin'
              : userLocation
              ? 'bg-blue-600 text-white border-blue-500'
              : 'bg-surface/90 backdrop-blur-xl border border-theme text-main hover:bg-brand hover:text-white'
          }`}
        >
          <Crosshair className="w-4 h-4" />
        </button>

        <button
          onClick={handleFitAll}
          title="Reset View (Fit All Events)"
          className="w-9 h-9 rounded-xl bg-surface/90 backdrop-blur-xl border border-theme text-main flex items-center justify-center hover:bg-brand hover:text-white transition-all shadow-elevated cursor-pointer"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* 5. FLOATING SELECTED EVENT PREVIEW CARD */}
      {activeEvent && (
        <div className="absolute bottom-5 left-4 right-4 sm:left-auto sm:right-16 sm:max-w-md z-[550] animate-fade-in pointer-events-auto">
          <div className="p-4 rounded-3xl bg-surface/95 dark:bg-surface/95 backdrop-blur-2xl border border-theme shadow-elevated space-y-3">
            
            {/* Top row: thumbnail, badges, dismiss */}
            <div className="flex items-start gap-3">
              <img
                src={
                  activeEvent.banner_url ||
                  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80'
                }
                alt={activeEvent.title}
                className="w-20 h-20 rounded-2xl object-cover shrink-0 ring-1 ring-theme"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[activeEvent.category]?.bg || '#8B5CF6'}22`,
                      color: CATEGORY_COLORS[activeEvent.category]?.bg || '#8B5CF6',
                      border: `1px solid ${CATEGORY_COLORS[activeEvent.category]?.border || '#8B5CF6'}44`,
                    }}
                  >
                    {activeEvent.category.replace('_', ' ')}
                  </span>
                  
                  <button
                    onClick={() => setActiveEvent(null)}
                    className="p-1 rounded-lg text-muted hover:text-main hover:bg-surface-secondary cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h4 className="text-sm font-extrabold text-main leading-tight line-clamp-2">
                  {activeEvent.title}
                </h4>

                <div className="flex items-center gap-2 mt-1 text-[11px] text-secondary">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {activeEvent.price_type === 'free' ? 'FREE ENTRY' : `₹${activeEvent.price}`}
                  </span>
                  <span>•</span>
                  <span>📍 {activeEvent.locality || 'Bengaluru'}</span>
                </div>
              </div>
            </div>

            {/* Date, Venue, Trust strip */}
            <div className="p-2.5 rounded-xl bg-surface-secondary/70 border border-theme text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-main font-semibold">
                <Calendar className="w-3.5 h-3.5 text-brand" />
                <span>{activeEvent.date}</span>
                <span className="text-muted">({activeEvent.start_time})</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-secondary">
                <span className="truncate">🏢 {activeEvent.venue}</span>
                {activeEvent.trust && (
                  <button
                    onClick={() => onOpenTrustModal(activeEvent)}
                    className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{activeEvent.trust.score}% Trust</span>
                  </button>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1">
              
              {/* Add to Calendar button & dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowCalendarMenu(!showCalendarMenu)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-surface-secondary text-main border border-theme hover:border-brand transition-all cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-brand" />
                  <span>Calendar</span>
                  <ChevronDown className="w-3 h-3 text-muted" />
                </button>

                {showCalendarMenu && (
                  <div className="absolute bottom-full mb-1 left-0 w-44 rounded-xl bg-surface border border-theme shadow-elevated p-1.5 space-y-1 text-xs animate-fade-in z-50">
                    <a
                      href={getGoogleCalendarUrl(activeEvent)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowCalendarMenu(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-main hover:bg-surface-secondary font-medium"
                    >
                      <span>Google Calendar</span>
                    </a>
                    <button
                      onClick={() => {
                        downloadIcsFile(activeEvent);
                        setShowCalendarMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-main hover:bg-surface-secondary font-medium text-left cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-brand" />
                      <span>Download .ics</span>
                    </button>
                  </div>
                )}
              </div>

              {/* View Details & Pass Button */}
              <button
                onClick={() => onSelectEvent(activeEvent)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-brand to-teal-500 text-white shadow-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer"
              >
                <span>View Details & Pass</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

            </div>

          </div>
        </div>
      )}

      {/* 6. LEAFLET MAP CANVAS */}
      <div ref={mapContainerRef} className="w-full h-full relative z-0" />

    </div>
  );
};
