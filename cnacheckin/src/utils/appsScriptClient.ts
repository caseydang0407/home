import { APPS_SCRIPT_WEB_APP_URL } from '../config/backend';
import {
  CNA_LOCATIONS,
  CheckInRecord,
  CnaLocation,
  MEMBER_ROLES,
} from '../types/cna';
import { addDaysToDateKey, toLocalDateKey } from './analytics';
import { verifyLocationCodeLocal } from './security';

const RECORDS_STORAGE_KEY = 'cna_checkin_records_v2';
const SESSION_LOCATION_KEY = 'cna_unlocked_location_v1';

const SAMPLE_DEPARTMENTS = [
  'ICU / Critical Care',
  'Emergency (ED)',
  'Med-Surg',
  'Telemetry / Step-Down',
  'Labor & Delivery',
  'NICU',
  'OR / Perioperative',
  'Oncology',
  'Pediatrics',
];

/**
 * Deterministic 30-day participation history across all 5 California chapters
 * so the dashboard charts, California heat map, and roster are populated immediately
 * when running without a live Google Apps Script endpoint.
 */
function buildInitialSeedRecords(referenceDate: Date = new Date()): CheckInRecord[] {
  const today = toLocalDateKey(referenceDate);
  const seedPeople: {
    name: string;
    phone: string;
    email: string;
    role: (typeof MEMBER_ROLES)[number];
    department: string;
    location: CnaLocation;
  }[] = [
    { name: 'Elena Morales, RN', phone: '(916) 555-0142', email: 'e.morales@calnurses.org', role: 'Unit Rep', department: SAMPLE_DEPARTMENTS[0], location: 'Sacramento' },
    { name: 'Marcus Vance, RN', phone: '(916) 555-0188', email: 'm.vance@calnurses.org', role: 'Union Rep', department: SAMPLE_DEPARTMENTS[1], location: 'Sacramento' },
    { name: 'Hannah Kim, RN', phone: '(916) 555-0194', email: 'h.kim@calnurses.org', role: 'PPC', department: SAMPLE_DEPARTMENTS[2], location: 'Sacramento' },
    { name: 'Priya Subramanian, RN', phone: '(415) 555-0123', email: 'p.subramanian@calnurses.org', role: 'Unit Rep', department: SAMPLE_DEPARTMENTS[4], location: 'San Francisco' },
    { name: 'Devon Brooks, RN', phone: '(415) 555-0167', email: 'd.brooks@calnurses.org', role: 'Union Rep', department: SAMPLE_DEPARTMENTS[0], location: 'San Francisco' },
    { name: 'Sofia Alvarez, RN', phone: '(415) 555-0155', email: 's.alvarez@calnurses.org', role: 'PPC', department: SAMPLE_DEPARTMENTS[5], location: 'San Francisco' },
    { name: 'Carlos Mendoza, RN', phone: '(213) 555-0119', email: 'c.mendoza@calnurses.org', role: 'Unit Rep', department: SAMPLE_DEPARTMENTS[1], location: 'Los Angeles' },
    { name: 'Tanya Jenkins, RN', phone: '(213) 555-0174', email: 't.jenkins@calnurses.org', role: 'Union Rep', department: SAMPLE_DEPARTMENTS[3], location: 'Los Angeles' },
    { name: 'Kenji Watanabe, RN', phone: '(213) 555-0131', email: 'k.watanabe@calnurses.org', role: 'PPC', department: SAMPLE_DEPARTMENTS[6], location: 'Los Angeles' },
    { name: 'Natalie Nguyen, RN', phone: '(949) 555-0162', email: 'n.nguyen@calnurses.org', role: 'Unit Rep', department: SAMPLE_DEPARTMENTS[7], location: 'Irvine' },
    { name: 'Omar Hassan, RN', phone: '(949) 555-0108', email: 'o.hassan@calnurses.org', role: 'Union Rep', department: SAMPLE_DEPARTMENTS[2], location: 'Irvine' },
    { name: 'Rachel Goldstein, RN', phone: '(949) 555-0149', email: 'r.goldstein@calnurses.org', role: 'PPC', department: SAMPLE_DEPARTMENTS[8], location: 'Irvine' },
    { name: 'Gabriel Ortiz, RN', phone: '(619) 555-0183', email: 'g.ortiz@calnurses.org', role: 'Unit Rep', department: SAMPLE_DEPARTMENTS[0], location: 'San Diego' },
    { name: 'Claire Bennett, RN', phone: '(619) 555-0190', email: 'c.bennett@calnurses.org', role: 'Union Rep', department: SAMPLE_DEPARTMENTS[1], location: 'San Diego' },
    { name: 'Maya Lin, RN', phone: '(619) 555-0112', email: 'm.lin@calnurses.org', role: 'PPC', department: SAMPLE_DEPARTMENTS[4], location: 'San Diego' },
  ];

  const shiftPeakHours = [7, 7, 8, 12, 12, 13, 15, 16, 18, 19, 11, 14];
  const records: CheckInRecord[] = [];
  let counter = 1;

  for (let dayOffset = 28; dayOffset >= 0; dayOffset--) {
    const dk = addDaysToDateKey(today, -dayOffset);
    const [yy, mm, dd] = dk.split('-').map(Number);

    const dt = new Date(yy, mm - 1, dd);
    const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
    const countForDay = dayOffset === 0 ? 7 : isWeekend ? 4 : 6 + ((dayOffset * 3) % 5);

    for (let j = 0; j < countForDay; j++) {
      const person = seedPeople[(dayOffset * 5 + j * 3) % seedPeople.length];
      const hour = shiftPeakHours[(dayOffset + j * 2) % shiftPeakHours.length];
      const minute = ((dayOffset * 11 + j * 17) % 50) + 5;
      const ts = new Date(yy, mm - 1, dd, hour, minute, 0).toISOString();

      const alreadyExists = records.some(
        (r) => r.dateKey === dk && r.location === person.location && r.name === person.name
      );
      if (!alreadyExists) {
        records.push({
          id: `seed-${counter++}`,
          dateKey: dk,
          timestamp: ts,
          name: person.name,
          phone: person.phone,
          email: person.email,
          role: person.role,
          department: person.department,
          location: person.location,
          syncStatus: 'synced',
        });
      }
    }
  }

  return records.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function loadCheckInRecords(): CheckInRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CheckInRecord[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback to seed
  }
  const seeded = buildInitialSeedRecords();
  saveCheckInRecords(seeded);
  return seeded;
}

export function saveCheckInRecords(records: CheckInRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadUnlockedLocation(): CnaLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = sessionStorage.getItem(SESSION_LOCATION_KEY) || localStorage.getItem(SESSION_LOCATION_KEY);
    if (val && CNA_LOCATIONS.includes(val as CnaLocation)) {
      return val as CnaLocation;
    }
  } catch {
    // Ignore
  }
  return null;
}

export function saveUnlockedLocation(location: CnaLocation | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (location) {
      sessionStorage.setItem(SESSION_LOCATION_KEY, location);
      localStorage.setItem(SESSION_LOCATION_KEY, location);
    } else {
      sessionStorage.removeItem(SESSION_LOCATION_KEY);
      localStorage.removeItem(SESSION_LOCATION_KEY);
    }
  } catch {
    // Ignore
  }
}

/**
 * Fetches check-in records from the Google Sheets database via Apps Script
 * when APPS_SCRIPT_WEB_APP_URL is configured, merging any unsynced local cache.
 */
export async function fetchCheckInsFromGoogleSheet(
  localRecords: CheckInRecord[]
): Promise<CheckInRecord[]> {
  const cleanUrl = APPS_SCRIPT_WEB_APP_URL.trim();
  if (!cleanUrl) return localRecords;

  try {
    const res = await fetch(`${cleanUrl}?action=getCheckins`);
    const data = (await res.json()) as { ok?: boolean; records?: CheckInRecord[] };
    if (!data.ok || !Array.isArray(data.records)) {
      return localRecords;
    }

    const pendingLocal = localRecords.filter((r) => r.syncStatus === 'pending');
    const seen = new Set(
      data.records.map((r) => `${r.dateKey}|${r.location}|${r.name.trim().toLowerCase()}`)
    );

    const merged = [...data.records];
    for (const p of pendingLocal) {
      const k = `${p.dateKey}|${p.location}|${p.name.trim().toLowerCase()}`;
      if (!seen.has(k)) {
        merged.push(p);
      }
    }

    const sorted = merged.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    saveCheckInRecords(sorted);
    return sorted;
  } catch {
    return localRecords;
  }
}

/**
 * Verifies location access code against Google Apps Script Web App if configured,
 * or falls back to SHA-256 verification for standalone GitHub / static preview mode.
 */
export async function verifyLocationAccess(
  location: CnaLocation,
  code: string
): Promise<{ authorized: boolean; mode: 'apps-script' | 'local'; error?: string }> {
  const cleanUrl = APPS_SCRIPT_WEB_APP_URL.trim();
  if (cleanUrl) {
    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'verifyAccess', location, code }),
      });
      const json = (await response.json()) as { authorized?: boolean; error?: string };
      if (json.authorized) {
        return { authorized: true, mode: 'apps-script' };
      }
      return {
        authorized: false,
        mode: 'apps-script',
        error: json.error || `Invalid secret code for ${location}.`,
      };
    } catch {
      return {
        authorized: false,
        mode: 'apps-script',
        error: 'Could not reach the chapter verification service. Check your network connection.',
      };
    }
  }

  const localResult = await verifyLocationCodeLocal(location, code);
  return { ...localResult, mode: 'local' };
}

/**
 * Syncs locally cached ('pending') check-ins to Google Sheets via Google Apps Script.
 */
export async function syncPendingCheckIns(
  records: CheckInRecord[]
): Promise<{
  updatedRecords: CheckInRecord[];
  syncedCount: number;
  syncedAt: string;
  mode: 'apps-script' | 'local-cache';
  error?: string;
}> {
  const pending = records.filter((r) => r.syncStatus === 'pending');
  const nowIso = new Date().toISOString();
  const cleanUrl = APPS_SCRIPT_WEB_APP_URL.trim();

  if (pending.length === 0) {
    return {
      updatedRecords: records,
      syncedCount: 0,
      syncedAt: nowIso,
      mode: cleanUrl ? 'apps-script' : 'local-cache',
    };
  }

  if (cleanUrl) {
    try {
      const res = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'syncCheckins', records: pending }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok) {
        return {
          updatedRecords: records,
          syncedCount: 0,
          syncedAt: nowIso,
          mode: 'apps-script',
          error: data.error || 'Google Sheets sync returned an error.',
        };
      }
    } catch {
      return {
        updatedRecords: records,
        syncedCount: 0,
        syncedAt: nowIso,
        mode: 'apps-script',
        error: 'Network offline — check-ins remain safely cached locally until sync succeeds.',
      };
    }
  }

  const pendingIds = new Set(pending.map((p) => p.id));
  const updatedRecords = records.map((r) =>
    pendingIds.has(r.id) ? { ...r, syncStatus: 'synced' as const } : r
  );
  saveCheckInRecords(updatedRecords);

  return {
    updatedRecords,
    syncedCount: pending.length,
    syncedAt: nowIso,
    mode: cleanUrl ? 'apps-script' : 'local-cache',
  };
}
