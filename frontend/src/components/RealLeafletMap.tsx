import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Navigation, 
  Maximize2, 
  Sparkles, 
  Calendar, 
  Clock, 
  Users, 
  ExternalLink,
  ShieldCheck,
  Layers,
  Compass
} from 'lucide-react';
import { EventItem, LocalityInfo } from '../types';
import { useTheme } from '../context/ThemeContext';

interface Props {
  events: EventItem[];
  localities: LocalityInfo[];
  selectedLocality: string;
  onSelectLocality: (loc: string) => void;
  onSelectEvent: (event: EventItem) => void;
  onOpenTrustModal: (event: EventItem) => void;
  highlightedEventId?: string | null;
}

// Bengaluru Tech Center coordinates
const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946];
const DEFAULT_ZOOM = 12;

export const RealLeafletMap: React.FC<Props> = ({
  events,
  localities,
  selectedLocality,
  onSelectLocality,
  onSelectEvent,
  onOpenTrustModal,
  highlightedEventId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const { resolvedTheme } = useTheme();

  const [activeLocality, setActiveLocality] = useState<string>(selectedLocality || 'all');
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);

  // Filter events with genuine non-zero coordinates
  const mappedEvents = events.filter(
    (e) => typeof e.latitude === 'number' && typeof e.longitude === 'number' && e.latitude !== 0 && e.longitude !== 0
  );
  const virtualEventsCount = events.length - mappedEvents.length;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false, // We will position custom or default zoom
      attributionControl: false,
    });

    // Add zoom control at top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Add proper attribution control at bottom right
    L.control
      .attribution({
        position: 'bottomright',
        prefix: false,
      })
      .addAttribution(
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
      )
      .addTo(map);

    mapInstanceRef.current = map;

    // Trigger multiple resize invalidations to ensure full rendering when mounting or toggling views
    map.invalidateSize();
    const timer1 = setTimeout(() => map.invalidateSize(), 150);
    const timer2 = setTimeout(() => map.invalidateSize(), 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer based on active Theme
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl =
      resolvedTheme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const subdomains = resolvedTheme === 'dark' ? 'abcd' : 'abc';

    const newTileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains,
      attribution:
        resolvedTheme === 'dark'
          ? '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>'
          : '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    });

    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;
    map.invalidateSize();
  }, [resolvedTheme]);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    const categoryColorMap: Record<string, { bg: string; border: string; glow: string }> = {
      hackathons: { bg: '#8b5cf6', border: '#7c3aed', glow: 'rgba(139, 92, 246, 0.4)' },
      workshops: { bg: '#14b8a6', border: '#0d9488', glow: 'rgba(20, 184, 166, 0.4)' },
      tech_meetups: { bg: '#38bdf8', border: '#0284c7', glow: 'rgba(56, 189, 248, 0.4)' },
      coding_contests: { bg: '#f59e0b', border: '#d97706', glow: 'rgba(245, 158, 11, 0.4)' },
      volunteering: { bg: '#10b981', border: '#059669', glow: 'rgba(16, 185, 129, 0.4)' },
    };

    const bounds: [number, number][] = [];

    mappedEvents.forEach((ev) => {
      const lat = ev.latitude!;
      const lng = ev.longitude!;
      bounds.push([lat, lng]);

      const colors = categoryColorMap[ev.category] || { bg: '#8b5cf6', border: '#7c3aed', glow: 'rgba(139, 92, 246, 0.4)' };
      const isSelected = highlightedEventId === ev.id;

      // Custom HTML Marker Pin
      const iconHtml = `
        <div class="custom-leaflet-marker ${isSelected ? 'is-active' : ''}" style="width: 38px; height: 38px;">
          <div style="
            position: absolute;
            width: 32px;
            height: 32px;
            background: ${colors.bg};
            border: 2.5px solid #ffffff;
            box-shadow: 0 4px 14px ${colors.glow};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 10px;
              height: 10px;
              background: #ffffff;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
          ${
            isSelected
              ? `<div style="
                  position: absolute;
                  width: 44px;
                  height: 44px;
                  border-radius: 50%;
                  border: 2px solid ${colors.bg};
                  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                "></div>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-pin-wrapper',
        html: iconHtml,
        iconSize: [38, 38],
        iconAnchor: [19, 36],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      // Popup Content Card
      const popupHtml = `
        <div style="width: 280px; padding: 12px; font-family: inherit;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <span style="
              font-size: 10px; 
              font-weight: 700; 
              text-transform: uppercase; 
              padding: 2px 8px; 
              border-radius: 9999px; 
              background: ${colors.bg}22; 
              color: ${colors.bg};
              border: 1px solid ${colors.border}44;
            ">
              ${ev.category.replace('_', ' ')}
            </span>
            <span style="font-size: 11px; font-weight: 700; color: #10b981;">
              ${ev.price_type === 'free' ? 'FREE' : `$${ev.price}`}
            </span>
          </div>

          <h4 style="font-size: 13px; font-weight: 800; line-height: 1.3; margin: 0 0 6px 0;">
            ${ev.title}
          </h4>

          <div style="font-size: 11px; opacity: 0.8; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
            <span>📍</span>
            <span><strong>${ev.locality || 'Bengaluru'}</strong> • ${ev.venue}</span>
          </div>

          <div style="font-size: 11px; opacity: 0.8; margin-bottom: 10px; display: flex; align-items: center; gap: 4px;">
            <span>📅</span>
            <span>${ev.date} (${ev.start_time})</span>
          </div>

          <div style="display: flex; gap: 6px;">
            <button 
              id="btn-view-${ev.id}" 
              style="
                flex: 1;
                padding: 6px 10px; 
                border-radius: 8px; 
                background: linear-gradient(135deg, #7c3aed, #14b8a6); 
                color: #ffffff; 
                border: none; 
                font-size: 11px; 
                font-weight: 700; 
                cursor: pointer;
              ">
              View Details & Pass
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        setActiveEvent(ev);
        const btn = document.getElementById(`btn-view-${ev.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectEvent(ev);
          };
        }
      });

      marker.on('click', () => {
        setActiveEvent(ev);
      });

      markersRef.current.set(ev.id, marker);
    });

    // Auto fit bounds if markers exist and no manual single locality selected
    if (bounds.length > 0 && selectedLocality === 'all' && !highlightedEventId) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [mappedEvents, resolvedTheme, highlightedEventId]);

  // Handle Locality Selection or Highlighted Event Pan
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (highlightedEventId) {
      const marker = markersRef.current.get(highlightedEventId);
      if (marker) {
        const latLng = marker.getLatLng();
        map.flyTo(latLng, 14, { duration: 0.8 });
        marker.openPopup();
        return;
      }
    }

    if (selectedLocality && selectedLocality !== 'all') {
      const localityObj = localities.find((l) => l.name.toLowerCase() === selectedLocality.toLowerCase());
      if (localityObj && localityObj.latitude && localityObj.longitude) {
        map.flyTo([localityObj.latitude, localityObj.longitude], 13, { duration: 0.8 });
      }
    }
  }, [selectedLocality, highlightedEventId, localities]);

  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    if (!map || mappedEvents.length === 0) return;
    const bounds = mappedEvents.map((e) => [e.latitude!, e.longitude!] as [number, number]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    onSelectLocality('all');
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-xl transition-all">
      {/* Top Map Control Bar */}
      <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-navy-800 bg-slate-50/80 dark:bg-navy-950/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-600/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Bengaluru Tech Corridor Map</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold border border-teal-500/30">
                Live OpenStreetMap
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Interactive GPS markers across actual roads, IT corridors & coworking hubs
            </p>
          </div>
        </div>

        {/* Stats & Reset Bounds Button */}
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-200/60 dark:bg-navy-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-300/50 dark:border-navy-700">
            📍 <strong>{mappedEvents.length}</strong> In-Person Mapped
          </span>
          {virtualEventsCount > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-300 font-medium border border-teal-500/30">
              🌐 {virtualEventsCount} Virtual
            </span>
          )}
          <button
            onClick={handleFitAll}
            title="Reset map to encompass all Bengaluru events"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500 transition-all shadow-sm active:scale-95"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fit All</span>
          </button>
        </div>
      </div>

      {/* Locality Quick Jump Chips */}
      <div className="px-3 sm:px-4 py-2 border-b border-slate-200/80 dark:border-navy-800/80 bg-slate-100/60 dark:bg-navy-950/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0 mr-1 flex items-center gap-1">
          <Navigation className="w-3 h-3 text-violet-500" />
          <span>Hubs:</span>
        </span>
        <button
          onClick={() => onSelectLocality('all')}
          className={`text-xs px-2.5 py-1 rounded-lg whitespace-nowrap font-medium transition-all ${
            selectedLocality === 'all'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All Bengaluru ({mappedEvents.length})
        </button>
        {localities.map((loc) => {
          const isSelected = selectedLocality.toLowerCase() === loc.name.toLowerCase();
          return (
            <button
              key={loc.name}
              onClick={() => onSelectLocality(loc.name)}
              className={`text-xs px-2.5 py-1 rounded-lg whitespace-nowrap font-medium transition-all ${
                isSelected
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {loc.name} ({loc.event_count})
            </button>
          );
        })}
      </div>

      {/* Map Canvas */}
      <div className="relative h-[480px] sm:h-[540px] w-full isolate">
        <div ref={mapContainerRef} className="w-full h-full relative z-0" style={{ minHeight: '480px' }} />

        {/* Floating Selected Event Card Banner at Bottom */}
        {activeEvent && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:max-w-md z-[500] animate-fade-in pointer-events-auto">
            <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-navy-900/95 backdrop-blur-xl border border-slate-200 dark:border-navy-700 shadow-2xl flex items-start gap-3">
              <img
                src={
                  activeEvent.banner_url ||
                  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'
                }
                alt={activeEvent.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0 ring-1 ring-slate-200 dark:ring-navy-700"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-300 uppercase">
                    {activeEvent.category.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {activeEvent.price_type === 'free' ? 'FREE' : `$${activeEvent.price}`}
                  </span>
                  {activeEvent.locality && (
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                      📍 {activeEvent.locality}
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {activeEvent.title}
                </h4>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {activeEvent.date} • {activeEvent.venue}
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <button
                    onClick={() => onSelectEvent(activeEvent)}
                    className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                  >
                    <span>Inspect Event & Tickets</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setActiveEvent(null)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
