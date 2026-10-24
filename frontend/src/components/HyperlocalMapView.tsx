import React, { useState } from 'react';
import { MapPin, Navigation, Compass, Calendar, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { EventItem, LocalityInfo } from '../types';
import { TrustScoreBadge } from './TrustScoreBadge';

interface Props {
  events: EventItem[];
  localities: LocalityInfo[];
  selectedLocality: string;
  onSelectLocality: (loc: string) => void;
  onSelectEvent: (event: EventItem) => void;
  onOpenTrustModal: (event: EventItem) => void;
}

// Normalized coordinate projections for Bengaluru Tech Corridor SVG map
const LOCALITY_CANVAS_MAP: Record<string, { x: number; y: number; desc: string }> = {
  'Yelahanka': { x: 260, y: 50, desc: 'North Bengaluru / Aerospace' },
  'Central Bangalore': { x: 240, y: 150, desc: 'Cubbon Park / Residency Rd' },
  'Indiranagar': { x: 310, y: 170, desc: 'Startup Hub / 100ft Road' },
  'Koramangala': { x: 280, y: 250, desc: 'Venture Corridor / 80ft Road' },
  'HSR Layout': { x: 320, y: 290, desc: 'Tech Founders Hub' },
  'Jayanagar': { x: 200, y: 270, desc: 'South Bengaluru Civic / STEM' },
  'Bellandur': { x: 370, y: 270, desc: 'ORR Tech Corridor' },
  'Whitefield': { x: 440, y: 200, desc: 'ITPB / Cloud Foundry Campus' },
  'Electronic City': { x: 340, y: 380, desc: 'Hardware & BioTech Parks' },
};

export const HyperlocalMapView: React.FC<Props> = ({
  events,
  localities,
  selectedLocality,
  onSelectLocality,
  onSelectEvent,
  onOpenTrustModal,
}) => {
  const [hoveredLocality, setHoveredLocality] = useState<string | null>(null);

  const activeCluster = hoveredLocality || (selectedLocality !== 'all' ? selectedLocality : null);
  const clusterEvents = activeCluster
    ? events.filter(e => e.locality?.toLowerCase() === activeCluster.toLowerCase())
    : events.slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Map Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Interactive SVG Radar Map Canvas */}
        <div className="lg:col-span-7 bg-navy-900/90 border border-navy-800 rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-teal-400 animate-spin-slow" />
              <h3 className="font-bold text-white text-base">Bengaluru Hyperlocal Tech Corridor</h3>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-navy-950 border border-teal-500/30 text-teal-300 font-medium">
              Interactive Map
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Click on tech clusters to inspect local venues, or hover to view transit coordinates and active hackathons.
          </p>

          {/* SVG Map Canvas */}
          <div className="relative w-full aspect-[4/3] bg-navy-950 rounded-2xl border border-navy-800/80 overflow-hidden flex items-center justify-center">
            {/* Grid background lines */}
            <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6d28d9" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Metro / Tech transit rings */}
            <svg viewBox="0 0 520 440" className="w-full h-full select-none">
              {/* Radial radar circles */}
              <circle cx="260" cy="220" r="80" fill="none" stroke="#1e295a" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="260" cy="220" r="150" fill="none" stroke="#1e295a" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="260" cy="220" r="210" fill="none" stroke="#1e295a" strokeWidth="1" strokeDasharray="4 4" />

              {/* Transit Highway Connectors */}
              <line x1="240" y1="150" x2="310" y2="170" stroke="#32448a" strokeWidth="1.5" />
              <line x1="310" y1="170" x2="280" y2="250" stroke="#32448a" strokeWidth="1.5" />
              <line x1="280" y1="250" x2="320" y2="290" stroke="#32448a" strokeWidth="1.5" />
              <line x1="320" y1="290" x2="370" y2="270" stroke="#32448a" strokeWidth="1.5" />
              <line x1="370" y1="270" x2="440" y2="200" stroke="#32448a" strokeWidth="1.5" />
              <line x1="320" y1="290" x2="340" y2="380" stroke="#32448a" strokeWidth="1.5" />
              <line x1="240" y1="150" x2="200" y2="270" stroke="#32448a" strokeWidth="1.5" />
              <line x1="240" y1="150" x2="260" y2="50" stroke="#32448a" strokeWidth="1.5" />

              {/* Cluster Nodes & Pins */}
              {Object.entries(LOCALITY_CANVAS_MAP).map(([locName, pos]) => {
                const count = events.filter(e => e.locality?.toLowerCase() === locName.toLowerCase()).length;
                const isSelected = selectedLocality.toLowerCase() === locName.toLowerCase();
                const isHovered = hoveredLocality === locName;

                return (
                  <g 
                    key={locName} 
                    className="cursor-pointer transition-transform duration-200"
                    onMouseEnter={() => setHoveredLocality(locName)}
                    onMouseLeave={() => setHoveredLocality(null)}
                    onClick={() => onSelectLocality(isSelected ? 'all' : locName)}
                  >
                    {/* Glowing pulse ring if selected */}
                    {(isSelected || isHovered) && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="24"
                        fill="none"
                        stroke="#2dd4bf"
                        strokeWidth="1.5"
                        className="animate-ping opacity-75 origin-center"
                      />
                    )}

                    {/* Outer Node circle */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={count > 0 ? "16" : "12"}
                      fill={isSelected ? "#7c3aed" : isHovered ? "#2dd4bf" : count > 0 ? "#1e295a" : "#0f172a"}
                      stroke={isSelected ? "#a78bfa" : count > 0 ? "#14b8a6" : "#334155"}
                      strokeWidth="2"
                    />

                    {/* Event count text inside pin */}
                    <text
                      x={pos.x}
                      y={pos.y + 4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      {count}
                    </text>

                    {/* Locality Label */}
                    <text
                      x={pos.x}
                      y={pos.y + (pos.y > 300 ? -22 : 24)}
                      textAnchor="middle"
                      fill={isSelected ? "#2dd4bf" : isHovered ? "#ffffff" : "#94a3b8"}
                      fontSize="11"
                      fontWeight="600"
                      className="pointer-events-none drop-shadow"
                    >
                      {locName}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Active Locality Tooltip overlay */}
            {activeCluster && (
              <div className="absolute bottom-3 left-3 bg-navy-900/90 backdrop-blur-md border border-navy-700 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 text-slate-200 shadow-xl">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                <span>
                  Cluster: <strong className="text-white">{activeCluster}</strong> • {events.filter(e => e.locality?.toLowerCase() === activeCluster.toLowerCase()).length} events
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Cluster Preview Side Pane */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span>{activeCluster ? `${activeCluster} Events` : 'All Active Clusters'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-navy-800 text-teal-300 border border-teal-500/30">
                  {clusterEvents.length}
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeCluster ? LOCALITY_CANVAS_MAP[activeCluster]?.desc || 'Bengaluru Technology Sector' : 'Click any cluster on the radar map to filter'}
              </p>
            </div>

            {selectedLocality !== 'all' && (
              <button
                onClick={() => onSelectLocality('all')}
                className="text-xs text-violet-400 hover:text-white font-medium"
              >
                Clear Cluster
              </button>
            )}
          </div>

          <div className="space-y-3">
            {clusterEvents.length === 0 ? (
              <div className="p-8 text-center bg-navy-900/60 rounded-2xl border border-navy-800 text-xs text-slate-400">
                No active events in this locality yet. Use Community Demand to request one!
              </div>
            ) : (
              clusterEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  className="p-4 rounded-2xl bg-navy-900/90 border border-navy-800 hover:border-violet-500/40 hover:bg-navy-850 cursor-pointer transition-all space-y-2.5 shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 px-2 py-0.5 rounded bg-teal-950 border border-teal-800">
                      {ev.locality || 'Bengaluru'}
                    </span>
                    <TrustScoreBadge trust={ev.trust} size="sm" onClick={() => onOpenTrustModal(ev)} />
                  </div>

                  <div>
                    <h5 className="font-bold text-white text-sm line-clamp-1 hover:text-violet-300">{ev.title}</h5>
                    <p className="text-slate-400 text-xs mt-1 flex items-center gap-2">
                      <span>{ev.date}</span>
                      <span>•</span>
                      <span>{ev.start_time} - {ev.end_time}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-navy-800/80 text-slate-400">
                    <span className="truncate max-w-[200px]">{ev.venue}</span>
                    <span className="text-teal-400 font-semibold flex items-center gap-1">
                      <span>Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
