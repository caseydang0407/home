import { CNA_LOCATIONS, CnaLocation, RememberedMemberProfile, MEMBER_ROLES } from '../types/cna';

/**
 * SHA-256 digests of default location access codes for standalone static preview mode.
 * When a Google Apps Script Web App URL is configured, verification executes
 * server-side inside Google Apps Script PropertiesService instead.
 */
const LOCATION_CODE_HASHES: Record<CnaLocation, string> = {
  'Sacramento': '410193d269e38ca65a809ad44dcda2e393d62942db28e9ea90e82824bba08831',
  'San Francisco': 'cb2e67980c18b1f78f0d7a53fbe6e4385a67eabc4fa9aefcb878a955d7fbeac3',
  'Los Angeles': '5adfbf81de296cb1492043815bb74f4d12a76550c11aa15da311499e9cac9cb5',
  'Irvine': 'd8d40b8dbae280e9f2d18c463599c584647ea7da5e4413c64fd413fc60d8defe',
  'San Diego': '2f1dbb206e8dd42a19f114c00d15818a106390c2d5b792f98cd7994cf3f7652b',
};

export async function sha256Hex(input: string): Promise<string> {
  const normalized = input.trim().toUpperCase();
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    const data = new TextEncoder().encode(normalized);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Node.js fallback (for unit tests)
  const nodeCrypto = await import('node:crypto');
  return nodeCrypto.createHash('sha256').update(normalized).digest('hex');
}

export async function verifyLocationCodeLocal(
  location: CnaLocation,
  submittedCode: string
): Promise<{ authorized: boolean; error?: string }> {
  if (!CNA_LOCATIONS.includes(location)) {
    return { authorized: false, error: 'Please select a valid California chapter location.' };
  }
  const trimmed = submittedCode.trim();
  if (!trimmed) {
    return { authorized: false, error: 'Please enter the secret access code for this location.' };
  }
  const hashed = await sha256Hex(trimmed);
  if (hashed === LOCATION_CODE_HASHES[location]) {
    return { authorized: true };
  }
  return {
    authorized: false,
    error: `Invalid access code for ${location}. Confirm the chapter code with your organizer.`,
  };
}

const PROFILE_COOKIE_KEY = 'cna_member_profile';
const PROFILE_STORAGE_KEY = 'cna_member_profile_v1';

export function saveRememberedProfile(profile: RememberedMemberProfile): void {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(profile);
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, serialized);
  } catch {
    // Ignore storage quota errors
  }
  try {
    const encoded = encodeURIComponent(serialized);
    const maxAgeSeconds = 60 * 60 * 24 * 90; // 90 days
    document.cookie = `${PROFILE_COOKIE_KEY}=${encoded}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`;
  } catch {
    // Ignore cookie errors
  }
}

export function loadRememberedProfile(): RememberedMemberProfile | null {
  if (typeof window === 'undefined') return null;

  const parseProfile = (raw: string | null): RememberedMemberProfile | null => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<RememberedMemberProfile>;
      if (
        typeof parsed.name === 'string' &&
        typeof parsed.department === 'string' &&
        MEMBER_ROLES.includes(parsed.role as RememberedMemberProfile['role'])
      ) {
        return {
          name: parsed.name,
          phone: typeof parsed.phone === 'string' ? parsed.phone : '',
          email: typeof parsed.email === 'string' ? parsed.email : '',
          role: parsed.role as RememberedMemberProfile['role'],
          department: parsed.department,
        };
      }
    } catch {
      return null;
    }
    return null;
  };

  try {
    const fromStorage = parseProfile(localStorage.getItem(PROFILE_STORAGE_KEY));
    if (fromStorage) return fromStorage;
  } catch {
    // fallback to cookie
  }

  try {
    const cookies = document.cookie ? document.cookie.split(';') : [];
    for (const pair of cookies) {
      const [key, ...rest] = pair.trim().split('=');
      if (key === PROFILE_COOKIE_KEY) {
        return parseProfile(decodeURIComponent(rest.join('=')));
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function clearRememberedProfile(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch {
    // Ignore
  }
  try {
    document.cookie = `${PROFILE_COOKIE_KEY}=; max-age=0; path=/; SameSite=Lax`;
  } catch {
    // Ignore
  }
}
