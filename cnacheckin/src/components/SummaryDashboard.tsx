import React, { useMemo, useState } from 'react';
import {
  CloudUpload,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
} from 'lucide-react';
import {
  CNA_LOCATIONS,
  CheckInRecord,
  CnaLocation,
  MEMBER_ROLES,
  MemberRole,
} from '../types/cna';
import {
  TrendGranularity,
  addDaysToDateKey,
  buildCaliforniaLocationStats,
  buildTrendSeries,
  computeDashboardKPIs,
  toLocalDateKey,
} from '../utils/analytics';
import {
  exportCheckInsToCsv,
  exportCheckInsToPdf,
  exportCheckInsToXls,
  formatRecordTime,
} from '../utils/exporters';
import { CaliforniaHeatMap } from './CaliforniaHeatMap';

interface SummaryDashboardProps {
  records: CheckInRecord[];
  currentLocation: CnaLocation;
  isLiveBackend: boolean;
  isSyncing: boolean;
  onSyncNow: () => void;
}

type DateRangeFilter = 'today' | 'week' | 'month' | 'all';

export const SummaryDashboard: React.FC<SummaryDashboardProps> = ({
  records,
  currentLocation,
  isLiveBackend,
  isSyncing,
  onSyncNow,
}) => {
  const [granularity, setGranularity] = useState<TrendGranularity>('daily');
  const [hoveredBucketKey, setHoveredBucketKey] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<'ALL' | CnaLocation>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | MemberRole>('ALL');
  const [rangeFilter, setRangeFilter] = useState<DateRangeFilter>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllRoster, setShowAllRoster] = useState(false);

  const todayKey = toLocalDateKey();
  const weekStartKey = addDaysToDateKey(todayKey, -6);
  const monthPrefix = todayKey.slice(0, 7);

  const locationScopedRecords = useMemo(() => {
    if (locationFilter === 'ALL') return records;
    return records.filter((r) => r.location === locationFilter);
  }, [records, locationFilter]);

  const kpis = useMemo(
    () => computeDashboardKPIs(locationScopedRecords),
    [locationScopedRecords]
  );

  const trendBuckets = useMemo(
    () => buildTrendSeries(locationScopedRecords, granularity),
    [locationScopedRecords, granularity]
  );

  const rangeFilteredForMap = useMemo(() => {
    return records.filter((r) => {
      if (rangeFilter === 'today') return r.dateKey === todayKey;
      if (rangeFilter === 'week') return r.dateKey >= weekStartKey && r.dateKey <= todayKey;
      if (rangeFilter === 'month') return r.dateKey.startsWith(monthPrefix);
      return true;
    });
  }, [records, rangeFilter, todayKey, weekStartKey, monthPrefix]);

  const californiaStats = useMemo(
    () => buildCaliforniaLocationStats(rangeFilteredForMap),
    [rangeFilteredForMap]
  );

  const filteredRoster = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((r) => {
      if (locationFilter !== 'ALL' && r.location !== locationFilter) return false;
      if (roleFilter !== 'ALL' && r.role !== roleFilter) return false;
      if (rangeFilter === 'today' && r.dateKey !== todayKey) return false;
      if (rangeFilter === 'week' && (r.dateKey < weekStartKey || r.dateKey > todayKey)) return false;
      if (rangeFilter === 'month' && !r.dateKey.startsWith(monthPrefix)) return false;
      if (
        q &&
        !r.name.toLowerCase().includes(q) &&
        !r.department.toLowerCase().includes(q) &&
        !r.location.toLowerCase().includes(q) &&
        !r.email.toLowerCase().includes(q) &&
        !r.phone.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [records, locationFilter, roleFilter, rangeFilter, searchQuery, todayKey, weekStartKey, monthPrefix]);

  const maxTrendTotal = Math.max(1, ...trendBuckets.map((b) => b.total));
  const activeBucket =
    trendBuckets.find((b) => b.key === hoveredBucketKey) ??
    trendBuckets[trendBuckets.length - 1];

  return (
    <div className="space-y-8">
      {/* Header + Export Actions */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-red-700 dark:text-red-400">
            Open Organizer &amp; Field Team Analytics · Active Chapter: {currentLocation}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            Participation Summary Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Real-time daily, weekly, and monthly member check-in metrics across all five California chapters. Check-ins persist in the Google Sheets database for open organizer access and export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => exportCheckInsToCsv(filteredRoster)}
            className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => exportCheckInsToXls(filteredRoster)}
            className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export XLS</span>
          </button>
          <button
            type="button"
            onClick={() =>
              exportCheckInsToPdf(filteredRoster, {
                subtitle: `Filter: ${locationFilter === 'ALL' ? 'All Chapters' : locationFilter} · ${roleFilter === 'ALL' ? 'All Roles' : roleFilter} · ${filteredRoster.length} Members`,
              })
            }
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* 4-Column KPI Strip */}
      <section aria-label="Participation metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Checked In Today</p>
          <p className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1.5 tabular-nums">
            {kpis.todayCount}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-mono tabular-nums">
            UR {kpis.roleBreakdownToday['Unit Rep']} · Union {kpis.roleBreakdownToday['Union Rep']} · PPC {kpis.roleBreakdownToday['PPC']}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">This Week (7 Days)</p>
          <p className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1.5 tabular-nums">
            {kpis.weekCount}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
            {locationFilter === 'ALL' ? 'All 5 chapters' : locationFilter}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">This Month</p>
          <p className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1.5 tabular-nums">
            {kpis.monthCount}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-mono tabular-nums">
            PPC {kpis.roleBreakdownMonth['PPC']} · Reps {kpis.roleBreakdownMonth['Unit Rep'] + kpis.roleBreakdownMonth['Union Rep']}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Units Active Today</p>
          <p className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1.5 tabular-nums">
            {kpis.uniqueDepartmentsToday}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-mono tabular-nums">
            {kpis.pendingSyncCount > 0 ? `${kpis.pendingSyncCount} pending sync` : 'Database synced'}
          </p>
        </div>
      </section>

      {/* Trend Chart + Google Sheets Sync Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section
          aria-label="Participation trend chart"
          className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Check-In Participation Trends
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Stacked by member role · Hover or tap any bar for exact breakdown
              </p>
            </div>

            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 self-start">
              {(['daily', 'weekly', 'monthly'] as TrendGranularity[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGranularity(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer whitespace-nowrap ${
                    granularity === g
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full overflow-x-auto pb-2">
            <div className="min-w-[460px] h-52 flex items-end gap-2 pt-6 border-b border-slate-200 dark:border-slate-800">
              {trendBuckets.map((bucket) => {
                const heightPct = (bucket.total / maxTrendTotal) * 100;
                const unionPct = bucket.total ? (bucket.byRole['Union Rep'] / bucket.total) * 100 : 0;
                const unitPct = bucket.total ? (bucket.byRole['Unit Rep'] / bucket.total) * 100 : 0;
                const ppcPct = bucket.total ? (bucket.byRole['PPC'] / bucket.total) * 100 : 0;
                const isSelected = activeBucket?.key === bucket.key;

                return (
                  <button
                    key={bucket.key}
                    type="button"
                    onMouseEnter={() => setHoveredBucketKey(bucket.key)}
                    onFocus={() => setHoveredBucketKey(bucket.key)}
                    onClick={() => setHoveredBucketKey(bucket.key)}
                    aria-label={`${bucket.label}: ${bucket.total} total check-ins`}
                    className="flex-1 h-full flex flex-col items-center justify-end group cursor-pointer focus:outline-none"
                  >
                    <span className="font-mono text-[11px] font-medium text-slate-600 dark:text-slate-400 tabular-nums mb-1">
                      {bucket.total}
                    </span>
                    <div
                      style={{ height: `${Math.max(bucket.total > 0 ? 8 : 2, heightPct * 0.78)}%` }}
                      className={`w-full max-w-[34px] rounded-t-md overflow-hidden flex flex-col-reverse transition-opacity ${
                        isSelected ? 'ring-2 ring-red-600 ring-offset-2 dark:ring-offset-slate-900' : 'opacity-90 group-hover:opacity-100'
                      }`}
                    >
                      {bucket.total === 0 ? (
                        <div className="w-full h-full bg-slate-200 dark:bg-slate-800" />
                      ) : (
                        <>
                          <div style={{ height: `${unitPct}%` }} className="w-full bg-red-700 dark:bg-red-500" />
                          <div style={{ height: `${unionPct}%` }} className="w-full bg-slate-800 dark:bg-sky-500" />
                          <div style={{ height: `${ppcPct}%` }} className="w-full bg-teal-600 dark:bg-teal-400" />
                        </>
                      )}
                    </div>
                    <span className="mt-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {bucket.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4 text-slate-700 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-red-700 dark:bg-red-500" aria-hidden="true" />
                Unit Rep
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-800 dark:bg-sky-500" aria-hidden="true" />
                Union Rep
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-teal-600 dark:bg-teal-400" aria-hidden="true" />
                PPC
              </span>
            </div>
            {activeBucket && (
              <div className="font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                Selected ({activeBucket.label}): {activeBucket.total} total · Unit {activeBucket.byRole['Unit Rep']} / Union {activeBucket.byRole['Union Rep']} / PPC {activeBucket.byRole['PPC']}
              </div>
            )}
          </div>
        </section>

        {/* Google Sheets Database Sync & 7 PM Report Automation Status */}
        <section
          aria-label="Google Sheets database sync and 7 PM report status"
          className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-5"
        >
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Google Sheets Sync &amp; 7:00 PM PDF
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              The check-in roster persists in the central Google Sheets database. Locally cached entries sync at end of day. At 7:00 PM PT, PDF summary emails are sent per location only if sign-in activity occurred that day.
            </p>

            <dl className="mt-4 space-y-2.5 text-xs border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">Database Store</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100">
                  {isLiveBackend ? 'Google Sheets Live' : 'Local Cache Ready'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">Pending Local Records</dt>
                <dd className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {kpis.pendingSyncCount}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">7:00 PM Email Policy</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100">
                  Active days only
                </dd>
              </div>
            </dl>
          </div>

          <button
            type="button"
            onClick={onSyncNow}
            disabled={isSyncing}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <CloudUpload className="w-4 h-4" />
            <span>{isSyncing ? 'Syncing to Google Sheets…' : 'Sync Cached Data Now'}</span>
          </button>
        </section>
      </div>

      {/* California Geographic Heat Map */}
      <CaliforniaHeatMap
        stats={californiaStats}
        selectedLocationFilter={locationFilter}
        onSelectLocation={setLocationFilter}
      />

      {/* Open Member Roster / Data Pull Table */}
      <section
        aria-label="Member participation roster"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6"
      >
        <div className="flex flex-col gap-4 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Check-In Roster ({filteredRoster.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Open member participation log — search by name or department, filter by chapter or role, and export reports
              </p>
            </div>
            {(searchQuery || locationFilter !== 'ALL' || roleFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setLocationFilter('ALL');
                  setRoleFilter('ALL');
                }}
                className="self-start sm:self-auto text-xs font-semibold text-red-700 dark:text-red-400 hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
            <div className="relative sm:col-span-2 lg:col-span-6">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="Search checked-in members by name or department"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search checked-in members by name or department…"
                className="w-full min-h-[42px] pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
              />
            </div>

            <select
              aria-label="Filter by location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value as 'ALL' | CnaLocation)}
              className="lg:col-span-2 min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="ALL">All 5 Locations</option>
              {CNA_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'ALL' | MemberRole)}
              className="lg:col-span-2 min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="ALL">All Roles</option>
              {MEMBER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by timeframe"
              value={rangeFilter}
              onChange={(e) => setRangeFilter(e.target.value as DateRangeFilter)}
              className="lg:col-span-2 min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">This Month</option>
              <option value="all">All Records</option>
            </select>
          </div>
        </div>

        {filteredRoster.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No member check-ins match your current filters. Adjust filters or check in a member on the Check-In page.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 pr-4 font-semibold">Member Name</th>
                    <th className="py-2.5 pr-4 font-semibold">Contact</th>
                    <th className="py-2.5 pr-4 font-semibold">Role</th>
                    <th className="py-2.5 pr-4 font-semibold">Department</th>
                    <th className="py-2.5 pr-4 font-semibold">Location</th>
                    <th className="py-2.5 pr-4 font-semibold">Date &amp; Time</th>
                    <th className="py-2.5 text-right font-semibold">Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(showAllRoster ? filteredRoster : filteredRoster.slice(0, 12)).map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 pr-4 font-medium text-slate-900 dark:text-slate-100">
                        {rec.name}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-slate-600 dark:text-slate-400">
                        <div className="font-mono tabular-nums">{rec.phone || '—'}</div>
                        <div className="truncate max-w-[190px]">{rec.email || '—'}</div>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-700 dark:text-slate-300">{rec.role}</td>
                      <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">{rec.department}</td>
                      <td className="py-2.5 pr-4 text-slate-700 dark:text-slate-300">{rec.location}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                        {rec.dateKey} · {formatRecordTime(rec.timestamp)}
                      </td>
                      <td className="py-2.5 text-right text-xs font-medium">
                        <span
                          className={
                            rec.syncStatus === 'synced'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-amber-700 dark:text-amber-400'
                          }
                        >
                          {rec.syncStatus === 'synced' ? 'Synced' : 'Cached'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <ul className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {(showAllRoster ? filteredRoster : filteredRoster.slice(0, 10)).map((rec) => (
                <li key={rec.id} className="py-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{rec.name}</p>
                    <span
                      className={`text-xs font-medium ${
                        rec.syncStatus === 'synced'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {rec.syncStatus === 'synced' ? 'Synced' : 'Cached'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {rec.role} · {rec.department}
                  </p>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                    {rec.phone || '—'} · {rec.email || '—'}
                  </p>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    {rec.location} · {rec.dateKey} · {formatRecordTime(rec.timestamp)}
                  </p>
                </li>
              ))}
            </ul>

            {filteredRoster.length > 12 && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  Showing {showAllRoster ? filteredRoster.length : Math.min(12, filteredRoster.length)} of {filteredRoster.length} records
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllRoster((v) => !v)}
                  className="font-semibold text-red-700 dark:text-red-400 hover:underline cursor-pointer"
                >
                  {showAllRoster ? 'Show Fewer' : `Show All (${filteredRoster.length})`}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
