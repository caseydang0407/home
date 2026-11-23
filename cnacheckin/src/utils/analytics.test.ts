import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCaliforniaLocationStats,
  buildLocationHeatMap,
  buildTrendSeries,
  computeDashboardKPIs,
  hasCheckedInToday,
} from './analytics';
import { CheckInRecord } from '../types/cna';

const refDate = new Date(2026, 10, 22, 14, 0, 0); // 2026-11-22

const sampleRecords: CheckInRecord[] = [
  {
    id: '1',
    dateKey: '2026-11-22',
    timestamp: new Date(2026, 10, 22, 7, 15, 0).toISOString(),
    name: 'Maria Gonzalez, RN',
    phone: '(916) 555-0101',
    email: 'maria@calnurses.org',
    role: 'Unit Rep',
    department: 'ICU / Critical Care',
    location: 'Sacramento',
    syncStatus: 'pending',
  },
  {
    id: '2',
    dateKey: '2026-11-22',
    timestamp: new Date(2026, 10, 22, 12, 30, 0).toISOString(),
    name: 'David Chen, RN',
    phone: '(415) 555-0102',
    email: 'david@calnurses.org',
    role: 'PPC',
    department: 'Emergency (ED)',
    location: 'San Francisco',
    syncStatus: 'synced',
  },
  {
    id: '3',
    dateKey: '2026-11-19',
    timestamp: new Date(2026, 10, 19, 12, 45, 0).toISOString(),
    name: 'Amira Patel, RN',
    phone: '(213) 555-0103',
    email: 'amira@calnurses.org',
    role: 'Union Rep',
    department: 'Med-Surg',
    location: 'Los Angeles',
    syncStatus: 'synced',
  },
  {
    id: '4',
    dateKey: '2026-11-04',
    timestamp: new Date(2026, 10, 4, 15, 10, 0).toISOString(),
    name: 'Jordan Brooks, RN',
    phone: '(619) 555-0104',
    email: 'jordan@calnurses.org',
    role: 'Unit Rep',
    department: 'Telemetry / Step-Down',
    location: 'San Diego',
    syncStatus: 'synced',
  },
  {
    id: '5',
    dateKey: '2026-10-15',
    timestamp: new Date(2026, 9, 15, 9, 0, 0).toISOString(),
    name: 'Priya Nair, RN',
    phone: '(949) 555-0105',
    email: 'priya@calnurses.org',
    role: 'PPC',
    department: 'NICU',
    location: 'Irvine',
    syncStatus: 'synced',
  },
];

test('computeDashboardKPIs aggregates today, week, month, and pending sync accurately', () => {
  const kpis = computeDashboardKPIs(sampleRecords, refDate);
  assert.equal(kpis.todayCount, 2);
  assert.equal(kpis.weekCount, 3);
  assert.equal(kpis.monthCount, 4);
  assert.equal(kpis.totalRecords, 5);
  assert.equal(kpis.pendingSyncCount, 1);
  assert.equal(kpis.uniqueDepartmentsToday, 2);
  assert.equal(kpis.roleBreakdownToday['Unit Rep'], 1);
  assert.equal(kpis.roleBreakdownToday['PPC'], 1);
});

test('hasCheckedInToday prevents duplicate daily counting at same location', () => {
  const dup = hasCheckedInToday(sampleRecords, ' maria gonzalez, rn ', 'Sacramento', '2026-11-22');
  assert.ok(dup);
  const diffLoc = hasCheckedInToday(sampleRecords, 'Maria Gonzalez, RN', 'Irvine', '2026-11-22');
  assert.equal(diffLoc, undefined);
});

test('buildTrendSeries produces 14 daily buckets, 8 weekly buckets, and 6 monthly buckets', () => {
  const daily = buildTrendSeries(sampleRecords, 'daily', refDate);
  assert.equal(daily.length, 14);
  assert.equal(daily[daily.length - 1].total, 2);

  const weekly = buildTrendSeries(sampleRecords, 'weekly', refDate);
  assert.equal(weekly.length, 8);
  assert.equal(weekly[weekly.length - 1].total, 3);

  const monthly = buildTrendSeries(sampleRecords, 'monthly', refDate);
  assert.equal(monthly.length, 6);
  assert.equal(monthly[monthly.length - 1].total, 4);
});

test('buildLocationHeatMap identifies peak time slot and busiest location', () => {
  const heatmap = buildLocationHeatMap(sampleRecords);
  assert.equal(heatmap.peakSlotLabel, '12:00–14:00');
  assert.equal(heatmap.peakSlotCount, 2);
  assert.equal(heatmap.matrix['Sacramento']['06-08'], 1);
  assert.equal(heatmap.matrix['San Francisco']['12-14'], 1);
});

test('buildCaliforniaLocationStats computes chapter intensities and today counts', () => {
  const stats = buildCaliforniaLocationStats(sampleRecords, refDate);
  assert.equal(stats.length, 5);
  const sac = stats.find((s) => s.location === 'Sacramento');
  assert.ok(sac);
  assert.equal(sac.totalCount, 1);
  assert.equal(sac.todayCount, 1);
  assert.equal(sac.intensity, 1);
  assert.equal(sac.topDepartment, 'ICU / Critical Care');
});
