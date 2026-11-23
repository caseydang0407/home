import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, CloudUpload, RotateCcw, Trash2, UserCheck } from 'lucide-react';
import {
  CheckInRecord,
  CnaLocation,
  MEMBER_ROLES,
  MemberRole,
  RememberedMemberProfile,
} from '../types/cna';
import { hasCheckedInToday, toLocalDateKey } from '../utils/analytics';
import { formatRecordTime } from '../utils/exporters';

interface CheckInViewProps {
  currentLocation: CnaLocation;
  records: CheckInRecord[];
  rememberedProfile: RememberedMemberProfile | null;
  onCheckIn: (payload: {
    name: string;
    phone: string;
    email: string;
    role: MemberRole;
    department: string;
    rememberMe: boolean;
  }) => { ok: boolean; duplicate?: CheckInRecord; record?: CheckInRecord; error?: string };
  onClearRemembered: () => void;
  onSyncNow: () => void;
  isSyncing: boolean;
}

export const CheckInView: React.FC<CheckInViewProps> = ({
  currentLocation,
  records,
  rememberedProfile,
  onCheckIn,
  onClearRemembered,
  onSyncNow,
  isSyncing,
}) => {
  const [name, setName] = useState(rememberedProfile?.name ?? '');
  const [phone, setPhone] = useState(rememberedProfile?.phone ?? '');
  const [email, setEmail] = useState(rememberedProfile?.email ?? '');
  const [role, setRole] = useState<MemberRole>(rememberedProfile?.role ?? 'Unit Rep');
  const [department, setDepartment] = useState<string>(rememberedProfile?.department ?? '');
  const [rememberMe, setRememberMe] = useState<boolean>(Boolean(rememberedProfile));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    type: 'success' | 'already';
    record: CheckInRecord;
  } | null>(null);

  useEffect(() => {
    if (rememberedProfile) {
      setName(rememberedProfile.name);
      setPhone(rememberedProfile.phone || '');
      setEmail(rememberedProfile.email || '');
      setRole(rememberedProfile.role);
      setDepartment(rememberedProfile.department);
      setRememberMe(true);
    }
  }, [rememberedProfile]);

  const todayKey = toLocalDateKey();
  const todaysLocationRecords = records.filter(
    (r) => r.dateKey === todayKey && r.location === currentLocation
  );
  const pendingCount = records.filter((r) => r.syncStatus === 'pending').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setConfirmation(null);

    if (!name.trim()) {
      setErrorMsg('Please enter your full name to check in.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Please enter your phone number.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!department.trim()) {
      setErrorMsg('Please enter your hospital department or unit.');
      return;
    }

    const existing = hasCheckedInToday(records, name, currentLocation, todayKey);
    if (existing) {
      setConfirmation({ type: 'already', record: existing });
      return;
    }

    const result = onCheckIn({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      role,
      department: department.trim(),
      rememberMe,
    });

    if (!result.ok) {
      if (result.duplicate) {
        setConfirmation({ type: 'already', record: result.duplicate });
      } else {
        setErrorMsg(result.error || 'Could not record check-in.');
      }
      return;
    }

    if (result.record) {
      setConfirmation({ type: 'success', record: result.record });
    }
  };

  const handleCheckInAnother = () => {
    setName('');
    setPhone('');
    setEmail('');
    setDepartment('');
    setConfirmation(null);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-red-700 dark:text-red-400">
            Daily Member Participation · {currentLocation} Chapter
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            Daily Check-In
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            No member account or sign-out needed. Record your participation once per day; entries are cached locally and synced to the chapter Google Sheet for the 7:00 PM summary.
          </p>
        </div>
        <div className="text-left sm:text-right font-mono text-xs text-slate-600 dark:text-slate-400 shrink-0">
          <div className="text-slate-900 dark:text-slate-100 font-semibold tabular-nums">
            {todaysLocationRecords.length} checked in today ({currentLocation})
          </div>
          <div>Date: {todayKey}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section
          aria-label="Member daily check-in form"
          className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
              Member Sign-In Form
            </h2>
            {rememberedProfile && (
              <button
                type="button"
                onClick={() => {
                  onClearRemembered();
                  setName('');
                  setPhone('');
                  setEmail('');
                  setDepartment('');
                  setRememberMe(false);
                  setConfirmation(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Saved Info</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="checkin-name"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
              >
                Full Name
              </label>
              <input
                id="checkin-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="e.g., Elena Morales, RN"
                className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="checkin-phone"
                  className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
                >
                  Phone Number
                </label>
                <input
                  id="checkin-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="e.g., (916) 555-0142"
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
                />
              </div>

              <div>
                <label
                  htmlFor="checkin-email"
                  className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
                >
                  Email
                </label>
                <input
                  id="checkin-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="e.g., elena.rn@hospital.org"
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
                />
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                Union Role
              </span>
              <div className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Union Role">
                {MEMBER_ROLES.map((r) => {
                  const active = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setRole(r)}
                      className={`min-h-[46px] px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-red-700 border-red-700 text-white dark:bg-red-600 dark:border-red-600'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="checkin-department"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
              >
                Hospital Department / Unit
              </label>
              <input
                id="checkin-department"
                type="text"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="e.g., ICU, Emergency (ED), Med-Surg, Labor & Delivery"
                className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
              />
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-3 cursor-pointer select-none min-h-[44px] py-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-red-700 focus:ring-red-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    Remember my information on this device
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Saves your name, phone, email, role, and department in a browser cookie so you do not need to re-type next time.
                  </span>
                </span>
              </label>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/70 bg-red-50 dark:bg-red-950/50 text-sm text-red-800 dark:text-red-200"
              >
                {errorMsg}
              </div>
            )}

            {confirmation && (
              <div
                role="status"
                className={`p-4 rounded-xl border text-sm ${
                  confirmation.type === 'success'
                    ? 'border-emerald-200 dark:border-emerald-900/70 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100'
                    : 'border-amber-200 dark:border-amber-900/70 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">
                        {confirmation.type === 'success'
                          ? `Checked in for ${confirmation.record.location}`
                          : `Already checked in today for ${confirmation.record.location}`}
                      </p>
                      <p className="text-xs opacity-90 mt-1">
                        {confirmation.record.name} · {confirmation.record.role} ·{' '}
                        {confirmation.record.department} · {formatRecordTime(confirmation.record.timestamp)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckInAnother}
                    className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Another Member</span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              <UserCheck className="w-4 h-4" />
              <span>Check In for Today</span>
            </button>
          </form>
        </section>

        <aside className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                End-of-Day Sync &amp; Local Cache
              </h2>
              <span className="font-mono text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                {pendingCount} pending
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Check-ins are saved immediately in device storage so low-signal hospital units never drop entries. Cached entries sync automatically to Google Sheets before the 7:00 PM summary (sent only when check-ins occur).
            </p>
            <button
              type="button"
              onClick={onSyncNow}
              disabled={isSyncing || pendingCount === 0}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-900 dark:text-slate-100 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <CloudUpload className="w-4 h-4 text-red-700 dark:text-red-400" />
              <span>
                {isSyncing
                  ? 'Syncing Local Cache…'
                  : pendingCount > 0
                  ? `Sync ${pendingCount} Cached Check-In${pendingCount > 1 ? 's' : ''} Now`
                  : 'All Local Check-Ins Synced'}
              </span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Today in {currentLocation}
              </h2>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {todaysLocationRecords.length} total
              </span>
            </div>

            {todaysLocationRecords.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
                No members checked in yet today at {currentLocation}. Submit the form to record the first entry.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {todaysLocationRecords.slice(0, 6).map((rec) => (
                  <li key={rec.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {rec.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {rec.role} · {rec.department}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-xs text-slate-700 dark:text-slate-300 tabular-nums inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatRecordTime(rec.timestamp)}</span>
                      </div>
                      <div
                        className={`text-[11px] font-medium mt-0.5 ${
                          rec.syncStatus === 'synced'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {rec.syncStatus === 'synced' ? 'Synced' : 'Cached Locally'}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
