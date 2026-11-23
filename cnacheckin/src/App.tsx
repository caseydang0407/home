import { useCallback, useEffect, useState } from 'react';
import { CheckInView } from './components/CheckInView';
import { LocationGate } from './components/LocationGate';
import { ResourceLibrary } from './components/ResourceLibrary';
import { SummaryDashboard } from './components/SummaryDashboard';
import { TopNav } from './components/TopNav';
import { APPS_SCRIPT_WEB_APP_URL } from './config/backend';
import { CNA_RESOURCES } from './data/resources';
import {
  AppSection,
  CheckInRecord,
  CnaLocation,
  MemberRole,
  RememberedMemberProfile,
  ResourceItem,
} from './types/cna';
import { hasCheckedInToday, toLocalDateKey } from './utils/analytics';
import {
  fetchCheckInsFromGoogleSheet,
  loadCheckInRecords,
  loadUnlockedLocation,
  saveCheckInRecords,
  saveUnlockedLocation,
  syncPendingCheckIns,
  verifyLocationAccess,
} from './utils/appsScriptClient';
import {
  clearRememberedProfile,
  loadRememberedProfile,
  saveRememberedProfile,
} from './utils/security';

const THEME_STORAGE_KEY = 'cna_theme_v1';
const BOOKMARKS_STORAGE_KEY = 'cna_offline_bookmarks_v1';
const OFFLINE_CACHE_STORAGE_KEY = 'cna_offline_resources_payload_v1';

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    } catch {
      return false;
    }
  });

  const [unlockedLocation, setUnlockedLocation] = useState<CnaLocation | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return 'Sacramento';
      }
    }
    return loadUnlockedLocation();
  });

  const [activeSection, setActiveSection] = useState<AppSection>('checkin');
  const [records, setRecords] = useState<CheckInRecord[]>(() => loadCheckInRecords());
  const [rememberedProfile, setRememberedProfile] = useState<RememberedMemberProfile | null>(() =>
    loadRememberedProfile()
  );
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return ['res-ppc-manual'];
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncBanner, setSyncBanner] = useState<string | null>(null);
  const isLiveBackend = Boolean(APPS_SCRIPT_WEB_APP_URL.trim());

  // Sync Tailwind v4 .dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDark]);

  // Pull check-ins from Google Sheets on unlock when live backend URL is configured
  useEffect(() => {
    if (!unlockedLocation || !isLiveBackend) return;
    let active = true;
    void fetchCheckInsFromGoogleSheet(records).then((merged) => {
      if (active) {
        setRecords(merged);
      }
    });
    return () => {
      active = false;
    };
  }, [unlockedLocation, isLiveBackend]);

  // Persist offline resource payloads for bookmarked items
  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarkedIds));
      const offlineItems = CNA_RESOURCES.filter((r) => bookmarkedIds.includes(r.id));
      localStorage.setItem(OFFLINE_CACHE_STORAGE_KEY, JSON.stringify(offlineItems));
    } catch {
      // ignore
    }
  }, [bookmarkedIds]);

  const handleSyncNow = useCallback(async () => {
    setIsSyncing(true);
    setSyncBanner(null);
    try {
      const result = await syncPendingCheckIns(records);
      setRecords(result.updatedRecords);
      if (result.error) {
        setSyncBanner(result.error);
      } else {
        setSyncBanner(
          result.syncedCount > 0
            ? `Synced ${result.syncedCount} cached check-in${result.syncedCount > 1 ? 's' : ''} to Google Sheets database.`
            : 'All check-ins are already synced.'
        );
      }
    } finally {
      setIsSyncing(false);
    }
  }, [records]);

  // Automatic background sync: immediately on online reconnect (when live backend is configured)
  // and at end of day (19:00 / 7 PM) before the daily PDF summary runs.
  useEffect(() => {
    const checkAutoSync = () => {
      const now = new Date();
      const pending = records.some((r) => r.syncStatus === 'pending');
      if (!pending || !navigator.onLine || isSyncing) return;
      if (isLiveBackend || now.getHours() >= 19) {
        void handleSyncNow();
      }
    };
    const interval = setInterval(checkAutoSync, 60_000);
    window.addEventListener('online', checkAutoSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', checkAutoSync);
    };
  }, [records, isLiveBackend, isSyncing, handleSyncNow]);

  const handleVerifyGate = async (location: CnaLocation, code: string) => {
    const res = await verifyLocationAccess(location, code);
    return { authorized: res.authorized, error: res.error };
  };

  const handleUnlock = (location: CnaLocation) => {
    saveUnlockedLocation(location);
    setUnlockedLocation(location);
  };

  const handleLockGate = () => {
    saveUnlockedLocation(null);
    setUnlockedLocation(null);
  };

  const handleMemberCheckIn = (payload: {
    name: string;
    phone: string;
    email: string;
    role: MemberRole;
    department: string;
    rememberMe: boolean;
  }) => {
    if (!unlockedLocation) {
      return { ok: false, error: 'Chapter location session is locked.' };
    }
    const todayKey = toLocalDateKey();
    const duplicate = hasCheckedInToday(records, payload.name, unlockedLocation, todayKey);
    if (duplicate) {
      return { ok: false, duplicate };
    }

    const newRecord: CheckInRecord = {
      id: `chk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      dateKey: todayKey,
      timestamp: new Date().toISOString(),
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      role: payload.role,
      department: payload.department,
      location: unlockedLocation,
      syncStatus: 'pending',
    };

    const nextRecords = [newRecord, ...records];
    setRecords(nextRecords);
    saveCheckInRecords(nextRecords);

    if (payload.rememberMe) {
      const profile: RememberedMemberProfile = {
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        role: payload.role,
        department: payload.department,
      };
      saveRememberedProfile(profile);
      setRememberedProfile(profile);
    } else {
      clearRememberedProfile();
      setRememberedProfile(null);
    }

    // Attempt immediate background sync to Google Sheets when configured and online
    if (isLiveBackend && navigator.onLine) {
      void syncPendingCheckIns(nextRecords).then((res) => {
        if (!res.error) {
          setRecords(res.updatedRecords);
        }
      });
    }

    return { ok: true, record: newRecord };
  };

  const handleClearRemembered = () => {
    clearRememberedProfile();
    setRememberedProfile(null);
  };

  const handleToggleBookmark = (resource: ResourceItem) => {
    setBookmarkedIds((prev) =>
      prev.includes(resource.id) ? prev.filter((id) => id !== resource.id) : [...prev, resource.id]
    );
  };

  return (
    <>
      {!unlockedLocation ? (
        <LocationGate
          isLiveBackend={isLiveBackend}
          onVerify={handleVerifyGate}
          onUnlock={handleUnlock}
          isDark={isDark}
          onToggleTheme={() => setIsDark((d) => !d)}
        />
      ) : (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 pb-20 md:pb-10">
          <TopNav
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            currentLocation={unlockedLocation}
            pendingCount={records.filter((r) => r.syncStatus === 'pending').length}
            isSyncing={isSyncing}
            onSyncNow={() => void handleSyncNow()}
            onLockGate={handleLockGate}
            isDark={isDark}
            onToggleTheme={() => setIsDark((d) => !d)}
          />

          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {syncBanner && (
              <div
                role="status"
                className="mb-6 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 text-xs text-slate-800 dark:text-slate-200"
              >
                <span>{syncBanner}</span>
                <button
                  type="button"
                  onClick={() => setSyncBanner(null)}
                  className="font-semibold text-red-700 dark:text-red-400 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {activeSection === 'checkin' && (
              <CheckInView
                currentLocation={unlockedLocation}
                records={records}
                rememberedProfile={rememberedProfile}
                onCheckIn={handleMemberCheckIn}
                onClearRemembered={handleClearRemembered}
                onSyncNow={() => void handleSyncNow()}
                isSyncing={isSyncing}
              />
            )}

            {activeSection === 'dashboard' && (
              <SummaryDashboard
                records={records}
                currentLocation={unlockedLocation}
                isLiveBackend={isLiveBackend}
                isSyncing={isSyncing}
                onSyncNow={() => void handleSyncNow()}
              />
            )}

            {activeSection === 'resources' && (
              <ResourceLibrary
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={handleToggleBookmark}
              />
            )}
          </main>

          <footer className="hidden md:block border-t border-slate-200 dark:border-slate-800 py-5 text-xs text-slate-500 dark:text-slate-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
              <span>California Nurses Association · Member Check-In &amp; Organizing Portal</span>
              <span>Static GitHub Pages · Google Sheets Serverless Database</span>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}
