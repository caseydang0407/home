import React, { useState } from 'react';
import { Eye, EyeOff, Lock, MapPin, Moon, ShieldCheck, Sun } from 'lucide-react';
import { CNA_LOCATIONS, CnaLocation } from '../types/cna';
import gateHeroImg from '../assets/images/cna_gate_hero_1795385415428.jpg';

interface LocationGateProps {
  isLiveBackend: boolean;
  onVerify: (location: CnaLocation, code: string) => Promise<{ authorized: boolean; error?: string }>;
  onUnlock: (location: CnaLocation) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const LocationGate: React.FC<LocationGateProps> = ({
  isLiveBackend,
  onVerify,
  onUnlock,
  isDark,
  onToggleTheme,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<CnaLocation>('Sacramento');
  const [secretCode, setSecretCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!secretCode.trim()) {
      setErrorMessage(`Enter the chapter access code for ${selectedLocation}.`);
      return;
    }

    setIsVerifying(true);
    try {
      const res = await onVerify(selectedLocation, secretCode);
      if (res.authorized) {
        onUnlock(selectedLocation);
      } else {
        setErrorMessage(res.error || 'Access denied. Verify your chapter secret code.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <span className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
            California Nurses Association
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="min-h-[44px] px-3 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="hidden sm:inline whitespace-nowrap">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="lg:col-span-6 relative min-h-[220px] lg:min-h-[540px] bg-slate-900 overflow-hidden">
            {!imgFailed ? (
              <img
                src={gateHeroImg}
                alt="Registered nurses arriving at a California hospital campus"
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover lg:absolute lg:inset-0"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 p-8">
                <ShieldCheck className="w-16 h-16 text-red-400 opacity-80" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-950/20 flex flex-col justify-end p-6 sm:p-8">
              <p className="text-xs font-medium tracking-wide text-red-300 mb-2">
                Member Participation &amp; Chapter Portal
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
                Chapter Access Verification
              </h1>
              <p className="mt-3 text-sm text-slate-200 leading-relaxed max-w-md">
                Select your California chapter and enter the facility access code provided by your CNA organizer to open daily check-in, participation analytics, and field resources.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                <Lock className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
                <span>Protected Chapter Entry</span>
                <span aria-hidden="true">·</span>
                <span>{isLiveBackend ? 'Google Sheets Connected' : 'Chapter Verified'}</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                Enter Chapter Secret Code
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                Each regional location maintains its own confidential access code inside the chapter backend.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label
                  htmlFor="gate-location"
                  className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
                >
                  Select Chapter Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="gate-location"
                    value={selectedLocation}
                    onChange={(e) => {
                      setSelectedLocation(e.target.value as CnaLocation);
                      setErrorMessage(null);
                    }}
                    className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
                  >
                    {CNA_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="gate-secret-code"
                  className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
                >
                  Location Secret Code
                </label>
                <div className="relative">
                  <input
                    id="gate-secret-code"
                    type={showCode ? 'text' : 'password'}
                    autoComplete="off"
                    value={secretCode}
                    onChange={(e) => {
                      setSecretCode(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={`Enter ${selectedLocation} access code`}
                    className="w-full min-h-[46px] pl-4 pr-12 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-sm placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode((v) => !v)}
                    aria-label={showCode ? 'Hide secret code' : 'Show secret code'}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/70 bg-red-50 dark:bg-red-950/50 text-sm text-red-800 dark:text-red-200"
                >
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-60 text-white font-semibold text-sm transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                {isVerifying ? 'Verifying Chapter Code…' : `Verify & Enter ${selectedLocation}`}
              </button>
            </form>

            <div className="mt-7 pt-5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <span>No individual member account required · Contact your chapter organizer for your facility code</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
