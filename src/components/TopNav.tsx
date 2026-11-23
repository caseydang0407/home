import React from 'react';
import { BarChart3, BookOpen, CheckSquare, CloudUpload, Lock, Moon, Sun } from 'lucide-react';
import { AppSection, CnaLocation } from '../types/cna';

interface TopNavProps {
  activeSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  currentLocation: CnaLocation;
  pendingCount: number;
  isSyncing: boolean;
  onSyncNow: () => void;
  onLockGate: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeSection,
  onSelectSection,
  currentLocation,
  pendingCount,
  isSyncing,
  onSyncNow,
  onLockGate,
  isDark,
  onToggleTheme,
}) => {
  const navItems: { id: AppSection; label: string; mobileLabel: string; icon: React.ReactNode }[] = [
    { id: 'checkin', label: 'Member Check-In', mobileLabel: 'Check-In', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'dashboard', label: 'Summary Dashboard', mobileLabel: 'Summary', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'resources', label: 'Resource Library', mobileLabel: 'Resources', icon: <BookOpen className="w-5 h-5" /> },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-13 md:h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => onSelectSection('checkin')}
            className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 cursor-pointer text-left"
          >
            <span className="md:hidden">CNA Portal</span>
            <span className="hidden md:inline">California Nurses Association</span>
          </button>

          <nav aria-label="Primary sections" className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectSection(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`py-1.5 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'border-red-700 text-red-700 dark:border-red-500 dark:text-red-400'
                      : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={onSyncNow}
              disabled={isSyncing}
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 disabled:opacity-60 text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <CloudUpload className="w-4 h-4" />
              <span>{isSyncing ? 'Syncing…' : pendingCount > 0 ? `Sync Cache (${pendingCount})` : 'Sync Now'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100">Chapter: {currentLocation}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {pendingCount > 0 ? `${pendingCount} cached locally` : 'All check-ins synced'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onToggleTheme}
              className="hidden md:inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button
              type="button"
              onClick={onLockGate}
              className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Switch Chapter</span>
            </button>
          </div>
        </div>
      </div>

      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-[60px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-4 items-center"
      >
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                isActive
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {item.icon}
              <span>{item.mobileLabel}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onSyncNow}
          disabled={isSyncing}
          className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300"
        >
          <CloudUpload className="w-5 h-5" />
          <span>{pendingCount > 0 ? `Sync (${pendingCount})` : 'Sync'}</span>
        </button>
      </nav>
    </>
  );
};
