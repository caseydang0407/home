import {
  CNA_LOCATIONS,
  CnaLocation,
  CheckInRecord,
  MEMBER_ROLES,
  MemberRole,
} from '../types/cna';

export function toLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysToDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  return toLocalDateKey(dt);
}

export function hasCheckedInToday(
  records: CheckInRecord[],
  name: string,
  location: CnaLocation,
  dateKey: string
): CheckInRecord | undefined {
  const normalized = name.trim().toLowerCase();
  return records.find(
    (r) =>
      r.dateKey === dateKey &&
      r.location === location &&
      r.name.trim().toLowerCase() === normalized
  );
}

export interface DashboardKPIs {
  todayCount: number;
  weekCount: number;
  monthCount: number;
  totalRecords: number;
  pendingSyncCount: number;
  uniqueDepartmentsToday: number;
  roleBreakdownToday: Record<MemberRole, number>;
  roleBreakdownMonth: Record<MemberRole, number>;
}

export function computeDashboardKPIs(
  records: CheckInRecord[],
  referenceDate: Date = new Date()
): DashboardKPIs {
  const todayKey = toLocalDateKey(referenceDate);
  const weekStartKey = addDaysToDateKey(todayKey, -6);
  const monthPrefix = todayKey.slice(0, 7); // YYYY-MM

  const roleBreakdownToday: Record<MemberRole, number> = {
    'Union Rep': 0,
    'Unit Rep': 0,
    'PPC': 0,
  };
  const roleBreakdownMonth: Record<MemberRole, number> = {
    'Union Rep': 0,
    'Unit Rep': 0,
    'PPC': 0,
  };

  let todayCount = 0;
  let weekCount = 0;
  let monthCount = 0;
  let pendingSyncCount = 0;
  const deptsToday = new Set<string>();

  for (const r of records) {
    if (r.syncStatus === 'pending') {
      pendingSyncCount++;
    }
    if (r.dateKey === todayKey) {
      todayCount++;
      roleBreakdownToday[r.role] = (roleBreakdownToday[r.role] || 0) + 1;
      if (r.department) deptsToday.add(r.department);
    }
    if (r.dateKey >= weekStartKey && r.dateKey <= todayKey) {
      weekCount++;
    }
    if (r.dateKey.startsWith(monthPrefix)) {
      monthCount++;
      roleBreakdownMonth[r.role] = (roleBreakdownMonth[r.role] || 0) + 1;
    }
  }

  return {
    todayCount,
    weekCount,
    monthCount,
    totalRecords: records.length,
    pendingSyncCount,
    uniqueDepartmentsToday: deptsToday.size,
    roleBreakdownToday,
    roleBreakdownMonth,
  };
}

export type TrendGranularity = 'daily' | 'weekly' | 'monthly';

export interface TrendBucket {
  label: string;
  key: string;
  total: number;
  byRole: Record<MemberRole, number>;
}

export function buildTrendSeries(
  records: CheckInRecord[],
  granularity: TrendGranularity,
  referenceDate: Date = new Date()
): TrendBucket[] {
  const todayKey = toLocalDateKey(referenceDate);

  if (granularity === 'daily') {
    const buckets: TrendBucket[] = [];
    const map = new Map<string, TrendBucket>();
    for (let i = 13; i >= 0; i--) {
      const dk = addDaysToDateKey(todayKey, -i);
      const [, mm, dd] = dk.split('-');
      const bucket: TrendBucket = {
        key: dk,
        label: `${Number(mm)}/${Number(dd)}`,
        total: 0,
        byRole: { 'Union Rep': 0, 'Unit Rep': 0, 'PPC': 0 },
      };
      buckets.push(bucket);
      map.set(dk, bucket);
    }
    for (const r of records) {
      const b = map.get(r.dateKey);
      if (b) {
        b.total++;
        b.byRole[r.role]++;
      }
    }
    return buckets;
  }

  if (granularity === 'weekly') {
    // 8 rolling 7-day weeks ending at todayKey
    const buckets: TrendBucket[] = [];
    for (let w = 7; w >= 0; w--) {
      const endKey = addDaysToDateKey(todayKey, -w * 7);
      const startKey = addDaysToDateKey(endKey, -6);
      const [, sm, sd] = startKey.split('-');
      const bucket: TrendBucket = {
        key: `${startKey}_${endKey}`,
        label: `Wk ${Number(sm)}/${Number(sd)}`,
        total: 0,
        byRole: { 'Union Rep': 0, 'Unit Rep': 0, 'PPC': 0 },
      };
      for (const r of records) {
        if (r.dateKey >= startKey && r.dateKey <= endKey) {
          bucket.total++;
          bucket.byRole[r.role]++;
        }
      }
      buckets.push(bucket);
    }
    return buckets;
  }

  // Monthly: last 6 calendar months
  const buckets: TrendBucket[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const map = new Map<string, TrendBucket>();

  for (let mOffset = 5; mOffset >= 0; mOffset--) {
    const dt = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - mOffset, 1);
    const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    const bucket: TrendBucket = {
      key: ym,
      label: `${monthNames[dt.getMonth()]} '${String(dt.getFullYear()).slice(2)}`,
      total: 0,
      byRole: { 'Union Rep': 0, 'Unit Rep': 0, 'PPC': 0 },
    };
    buckets.push(bucket);
    map.set(ym, bucket);
  }

  for (const r of records) {
    const ym = r.dateKey.slice(0, 7);
    const b = map.get(ym);
    if (b) {
      b.total++;
      b.byRole[r.role]++;
    }
  }

  return buckets;
}

export const HEATMAP_TIME_SLOTS = [
  { id: '06-08', label: '06:00–08:00', shortLabel: '6a', startHour: 6, endHour: 8 },
  { id: '08-10', label: '08:00–10:00', shortLabel: '8a', startHour: 8, endHour: 10 },
  { id: '10-12', label: '10:00–12:00', shortLabel: '10a', startHour: 10, endHour: 12 },
  { id: '12-14', label: '12:00–14:00', shortLabel: '12p', startHour: 12, endHour: 14 },
  { id: '14-16', label: '14:00–16:00', shortLabel: '2p', startHour: 14, endHour: 16 },
  { id: '16-18', label: '16:00–18:00', shortLabel: '4p', startHour: 16, endHour: 18 },
  { id: '18-20', label: '18:00–20:00', shortLabel: '6p', startHour: 18, endHour: 20 },
  { id: '20-22', label: '20:00–22:00', shortLabel: '8p', startHour: 20, endHour: 24 },
] as const;

export interface LocationHeatMapSummary {
  matrix: Record<CnaLocation, Record<string, number>>;
  maxCellCount: number;
  locationTotals: Record<CnaLocation, number>;
  peakSlotLabel: string;
  peakSlotCount: number;
  busiestLocation: CnaLocation;
  busiestLocationCount: number;
}

export function buildLocationHeatMap(records: CheckInRecord[]): LocationHeatMapSummary {
  const matrix = {} as Record<CnaLocation, Record<string, number>>;
  const locationTotals = {} as Record<CnaLocation, number>;
  const slotTotals: Record<string, number> = {};

  for (const loc of CNA_LOCATIONS) {
    matrix[loc] = {};
    locationTotals[loc] = 0;
    for (const slot of HEATMAP_TIME_SLOTS) {
      matrix[loc][slot.id] = 0;
    }
  }
  for (const slot of HEATMAP_TIME_SLOTS) {
    slotTotals[slot.id] = 0;
  }

  for (const rec of records) {
    if (!matrix[rec.location]) continue;
    const dt = new Date(rec.timestamp);
    const hour = Number.isNaN(dt.getTime()) ? 12 : dt.getHours();
    let matchedSlot: string = HEATMAP_TIME_SLOTS[0].id;
    for (const slot of HEATMAP_TIME_SLOTS) {
      if (hour >= slot.startHour && hour < slot.endHour) {
        matchedSlot = slot.id;
        break;
      }
      if (hour < HEATMAP_TIME_SLOTS[0].startHour) {
        matchedSlot = HEATMAP_TIME_SLOTS[0].id;
      }
    }
    matrix[rec.location][matchedSlot]++;
    locationTotals[rec.location]++;
    slotTotals[matchedSlot]++;
  }

  let maxCellCount = 0;
  for (const loc of CNA_LOCATIONS) {
    for (const slot of HEATMAP_TIME_SLOTS) {
      if (matrix[loc][slot.id] > maxCellCount) {
        maxCellCount = matrix[loc][slot.id];
      }
    }
  }

  let peakSlotLabel: string = HEATMAP_TIME_SLOTS[0].label;
  let peakSlotCount = -1;
  for (const slot of HEATMAP_TIME_SLOTS) {
    if (slotTotals[slot.id] > peakSlotCount) {
      peakSlotCount = slotTotals[slot.id];
      peakSlotLabel = slot.label;
    }
  }

  let busiestLocation: CnaLocation = CNA_LOCATIONS[0];
  let busiestLocationCount = -1;
  for (const loc of CNA_LOCATIONS) {
    if (locationTotals[loc] > busiestLocationCount) {
      busiestLocationCount = locationTotals[loc];
      busiestLocation = loc;
    }
  }

  return {
    matrix,
    maxCellCount,
    locationTotals,
    peakSlotLabel,
    peakSlotCount: Math.max(0, peakSlotCount),
    busiestLocation,
    busiestLocationCount: Math.max(0, busiestLocationCount),
  };
}

export function getRoleCountsForRecords(records: CheckInRecord[]): Record<MemberRole, number> {
  const counts: Record<MemberRole, number> = {
    'Union Rep': 0,
    'Unit Rep': 0,
    'PPC': 0,
  };
  for (const r of records) {
    if (MEMBER_ROLES.includes(r.role)) {
      counts[r.role]++;
    }
  }
  return counts;
}

export interface CaliforniaLocationStat {
  location: CnaLocation;
  totalCount: number;
  todayCount: number;
  intensity: number;
  roleCounts: Record<MemberRole, number>;
  peakWindow: string;
  topDepartment: string;
}

export function buildCaliforniaLocationStats(
  records: CheckInRecord[],
  referenceDate: Date = new Date()
): CaliforniaLocationStat[] {
  const todayKey = toLocalDateKey(referenceDate);
  const heatmap = buildLocationHeatMap(records);
  const maxTotal = Math.max(1, ...CNA_LOCATIONS.map((loc) => heatmap.locationTotals[loc]));

  return CNA_LOCATIONS.map((location) => {
    const locRecords = records.filter((r) => r.location === location);
    const todayCount = locRecords.filter((r) => r.dateKey === todayKey).length;
    const roleCounts = getRoleCountsForRecords(locRecords);

    // Peak window for this location
    let peakSlotId: string = HEATMAP_TIME_SLOTS[0].id;
    let peakSlotCount = -1;
    for (const slot of HEATMAP_TIME_SLOTS) {
      const c = heatmap.matrix[location][slot.id] || 0;
      if (c > peakSlotCount) {
        peakSlotCount = c;
        peakSlotId = slot.id;
      }
    }
    const peakSlotObj = HEATMAP_TIME_SLOTS.find((s) => s.id === peakSlotId);
    const peakWindow = peakSlotCount > 0 && peakSlotObj ? peakSlotObj.label : 'No activity yet';

    // Top department
    const deptCounts: Record<string, number> = {};
    for (const rec of locRecords) {
      if (rec.department) {
        deptCounts[rec.department] = (deptCounts[rec.department] || 0) + 1;
      }
    }
    let topDepartment = '—';
    let topDeptCount = 0;
    for (const [dept, count] of Object.entries(deptCounts)) {
      if (count > topDeptCount) {
        topDeptCount = count;
        topDepartment = dept;
      }
    }

    return {
      location,
      totalCount: locRecords.length,
      todayCount,
      intensity: locRecords.length === 0 ? 0 : locRecords.length / maxTotal,
      roleCounts,
      peakWindow,
      topDepartment,
    };
  });
}
