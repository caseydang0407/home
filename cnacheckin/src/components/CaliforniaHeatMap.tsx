import React, { useMemo, useState } from 'react';
import { CnaLocation } from '../types/cna';
import { CaliforniaLocationStat } from '../utils/analytics';

interface CaliforniaHeatMapProps {
  stats: CaliforniaLocationStat[];
  selectedLocationFilter: 'ALL' | CnaLocation;
  onSelectLocation: (loc: 'ALL' | CnaLocation) => void;
}

interface MapPinMeta {
  location: CnaLocation;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  anchor: 'start' | 'end';
  regionLabel: string;
}

const CA_CHAPTER_COORDS: MapPinMeta[] = [
  {
    location: 'Sacramento',
    x: 130,
    y: 179,
    labelX: 152,
    labelY: 175,
    anchor: 'start',
    regionLabel: 'Capital & Northern Valley',
  },
  {
    location: 'San Francisco',
    x: 98,
    y: 215,
    labelX: 82,
    labelY: 222,
    anchor: 'end',
    regionLabel: 'San Francisco Bay Area',
  },
  {
    location: 'Los Angeles',
    x: 240,
    y: 378,
    labelX: 196,
    labelY: 346,
    anchor: 'end',
    regionLabel: 'Greater Los Angeles Basin',
  },
  {
    location: 'Irvine',
    x: 254,
    y: 395,
    labelX: 274,
    labelY: 394,
    anchor: 'start',
    regionLabel: 'Orange County',
  },
  {
    location: 'San Diego',
    x: 277,
    y: 437,
    labelX: 297,
    labelY: 438,
    anchor: 'start',
    regionLabel: 'San Diego & South Coast',
  },
];

// Accurate geographic silhouette of California projected onto 420x480
const CALIFORNIA_OUTLINE_PATH =
  'M 38 29 L 180 29 L 180 161 L 363 337 L 380 372 L 363 437 L 278 445 L 269 417 L 251 397 L 238 392 L 221 379 L 185 363 L 164 361 L 157 330 L 115 265 L 95 214 L 76 191 L 51 141 L 31 97 L 39 81 L 38 40 Z';

export const CaliforniaHeatMap: React.FC<CaliforniaHeatMapProps> = ({
  stats,
  selectedLocationFilter,
  onSelectLocation,
}) => {
  const [focusedLocation, setFocusedLocation] = useState<CnaLocation>('Sacramento');

  const statByLocation = useMemo(() => {
    const map = new Map<CnaLocation, CaliforniaLocationStat>();
    for (const s of stats) {
      map.set(s.location, s);
    }
    return map;
  }, [stats]);

  const activeLocation: CnaLocation =
    selectedLocationFilter !== 'ALL' ? selectedLocationFilter : focusedLocation;

  const activeStat = statByLocation.get(activeLocation) ?? stats[0];
  const topChapter = useMemo(() => {
    return [...stats].sort((a, b) => b.totalCount - a.totalCount)[0];
  }, [stats]);

  return (
    <section
      aria-label="California chapter locations heat map"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
            California Chapter Heat Map
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Geographic participation intensity across all five CNA California chapters · Select a chapter to inspect or filter roster
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-slate-700 dark:text-slate-300 tabular-nums">
          {topChapter && (
            <span>
              Highest Turnout: <strong className="text-slate-950 dark:text-white">{topChapter.location}</strong> ({topChapter.totalCount})
            </span>
          )}
          {selectedLocationFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => onSelectLocation('ALL')}
              className="font-sans font-semibold text-red-700 dark:text-red-400 underline underline-offset-2 cursor-pointer"
            >
              Show All 5
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* California SVG Map */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <svg
            viewBox="0 0 420 475"
            className="w-full max-w-[360px] h-auto select-none"
            role="img"
            aria-label="California geographic heat map of CNA chapter check-ins"
          >
            <defs>
              <radialGradient id="heat-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#dc2626" stopOpacity="0.72" />
                <stop offset="45%" stopColor="#ef4444" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* California State Silhouette */}
            <path
              d={CALIFORNIA_OUTLINE_PATH}
              className="fill-slate-200/80 stroke-slate-400 dark:fill-slate-800/80 dark:stroke-slate-600"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* Subtle latitude reference lines */}
            <line x1="35" y1="160" x2="220" y2="160" className="stroke-slate-300/60 dark:stroke-slate-700/50" strokeDasharray="3 4" strokeWidth="1" />
            <line x1="75" y1="280" x2="310" y2="280" className="stroke-slate-300/60 dark:stroke-slate-700/50" strokeDasharray="3 4" strokeWidth="1" />
            <line x1="170" y1="365" x2="375" y2="365" className="stroke-slate-300/60 dark:stroke-slate-700/50" strokeDasharray="3 4" strokeWidth="1" />

            {/* Thermal heat halos + pins */}
            {CA_CHAPTER_COORDS.map((pin) => {
              const stat = statByLocation.get(pin.location);
              const intensity = stat?.intensity ?? 0;
              const count = stat?.totalCount ?? 0;
              const haloRadius = 18 + intensity * 38;
              const coreRadius = 6 + intensity * 5;
              const isSelected = activeLocation === pin.location;

              return (
                <g key={pin.location}>
                  {count > 0 && (
                    <circle
                      cx={pin.x}
                      cy={pin.y}
                      r={haloRadius}
                      fill="url(#heat-glow)"
                      className="pointer-events-none"
                    />
                  )}

                  {/* Leader line */}
                  <line
                    x1={pin.x}
                    y1={pin.y}
                    x2={pin.labelX + (pin.anchor === 'start' ? -4 : 4)}
                    y2={pin.labelY}
                    className="stroke-slate-400 dark:stroke-slate-500"
                    strokeWidth="1"
                  />

                  {/* Interactive chapter node */}
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label={`${pin.location}: ${count} total check-ins, ${stat?.todayCount ?? 0} today`}
                    onClick={() => {
                      setFocusedLocation(pin.location);
                      onSelectLocation(
                        selectedLocationFilter === pin.location ? 'ALL' : pin.location
                      );
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setFocusedLocation(pin.location);
                        onSelectLocation(
                          selectedLocationFilter === pin.location ? 'ALL' : pin.location
                        );
                      }
                    }}
                    onMouseEnter={() => setFocusedLocation(pin.location)}
                    className="cursor-pointer focus:outline-none"
                  >
                    <circle
                      cx={pin.x}
                      cy={pin.y}
                      r={coreRadius + 6}
                      fill="transparent"
                    />
                    <circle
                      cx={pin.x}
                      cy={pin.y}
                      r={coreRadius}
                      className={
                        isSelected
                          ? 'fill-red-700 stroke-white dark:fill-red-500 dark:stroke-slate-950'
                          : 'fill-red-600 stroke-white dark:fill-red-500 dark:stroke-slate-900'
                      }
                      strokeWidth={isSelected ? '3' : '2'}
                    />
                    <text
                      x={pin.labelX}
                      y={pin.labelY - 2}
                      textAnchor={pin.anchor}
                      style={{ paintOrder: 'stroke' }}
                      strokeWidth="3"
                      className={`text-[11px] font-bold stroke-slate-50 dark:stroke-slate-950 ${
                        isSelected
                          ? 'fill-red-700 dark:fill-red-400'
                          : 'fill-slate-900 dark:fill-slate-100'
                      }`}
                    >
                      {pin.location}
                    </text>
                    <text
                      x={pin.labelX}
                      y={pin.labelY + 11}
                      textAnchor={pin.anchor}
                      style={{ paintOrder: 'stroke' }}
                      strokeWidth="3"
                      className="text-[10px] font-mono fill-slate-600 dark:fill-slate-400 stroke-slate-50 dark:stroke-slate-950"
                    >
                      {count} check-ins
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Lower turnout</span>
            <span className="w-16 h-2 rounded-full bg-gradient-to-r from-red-200 via-red-500 to-red-700 inline-block" aria-hidden="true" />
            <span>Peak concentration</span>
          </div>
        </div>

        {/* Regional Chapter Breakdown List & Selected Chapter Detail */}
        <div className="lg:col-span-6 space-y-4">
          {activeStat && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-red-700 dark:text-red-400">
                    {CA_CHAPTER_COORDS.find((c) => c.location === activeStat.location)?.regionLabel}
                  </p>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                    {activeStat.location} Chapter
                  </h3>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {activeStat.totalCount}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {activeStat.todayCount} today
                  </div>
                </div>
              </div>

              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Role Mix</dt>
                  <dd className="font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                    UR {activeStat.roleCounts['Unit Rep']} · Union {activeStat.roleCounts['Union Rep']} · PPC {activeStat.roleCounts['PPC']}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Peak Window</dt>
                  <dd className="font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                    {activeStat.peakWindow}
                  </dd>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <dt className="text-slate-500 dark:text-slate-400">Top Unit</dt>
                  <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                    {activeStat.topDepartment}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* All 5 California Locations Intensity Bars */}
          <div className="space-y-2">
            {stats.map((item) => {
              const isSelected = selectedLocationFilter === item.location;
              const isFocused = activeLocation === item.location;
              return (
                <button
                  key={item.location}
                  type="button"
                  onClick={() => {
                    setFocusedLocation(item.location);
                    onSelectLocation(isSelected ? 'ALL' : item.location);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-red-700 bg-red-50/70 dark:border-red-500 dark:bg-red-950/30'
                      : isFocused
                      ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {item.location}
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                      {item.totalCount} total · {item.todayCount} today
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(item.totalCount > 0 ? 6 : 0, Math.round(item.intensity * 100))}%` }}
                      className="h-full rounded-full bg-red-700 dark:bg-red-500 transition-all"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
