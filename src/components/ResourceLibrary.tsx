import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  FileText,
  Pause,
  Play,
  Search,
  Video,
  WifiOff,
  X,
} from 'lucide-react';
import { CNA_RESOURCES } from '../data/resources';
import { ResourceCategory, ResourceItem } from '../types/cna';
import ppcThumb from '../assets/images/resource_thumb_ppc_1795385415787.jpg';
import stewardThumb from '../assets/images/resource_thumb_steward_1795385415747.jpg';

interface ResourceLibraryProps {
  bookmarkedIds: string[];
  onToggleBookmark: (resource: ResourceItem) => void;
}

type LibraryFilter = 'All' | ResourceCategory | 'Bookmarked';

export const ResourceLibrary: React.FC<ResourceLibraryProps> = ({
  bookmarkedIds,
  onToggleBookmark,
}) => {
  const [filter, setFilter] = useState<LibraryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeResource, setActiveResource] = useState<ResourceItem | null>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [brokenThumbs, setBrokenThumbs] = useState<Record<string, boolean>>({});

  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CNA_RESOURCES.filter((item) => {
      if (filter === 'Bookmarked' && !bookmarkedIds.includes(item.id)) return false;
      if (
        filter !== 'All' &&
        filter !== 'Bookmarked' &&
        item.category !== filter
      ) {
        return false;
      }
      if (
        q &&
        !item.title.toLowerCase().includes(q) &&
        !item.summary.toLowerCase().includes(q) &&
        !item.tags.some((t) => t.toLowerCase().includes(q))
      ) {
        return false;
      }
      return true;
    });
  }, [filter, searchQuery, bookmarkedIds]);

  const getThumbnailSrc = (item: ResourceItem): string => {
    return item.thumbnailType === 'steward' ? stewardThumb : ppcThumb;
  };

  const getCategoryIcon = (cat: ResourceCategory) => {
    if (cat === 'Manuals') return <BookOpen className="w-4 h-4" />;
    if (cat === 'Training Videos') return <Video className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const filterTabs: { id: LibraryFilter; label: string }[] = [
    { id: 'All', label: 'All Materials' },
    { id: 'Manuals', label: 'Manuals' },
    { id: 'Guides', label: 'Guides' },
    { id: 'Training Videos', label: 'Training Videos' },
    { id: 'Bookmarked', label: `Bookmarked (${bookmarkedIds.length})` },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-red-700 dark:text-red-400">
            Field Reference &amp; Training Repository
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            Resource Library
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Search union manuals, shift-huddle guides, and training videos. Bookmark essential materials to cache their full contents locally for offline hospital floor access.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
          <WifiOff className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <span className="font-mono tabular-nums">{bookmarkedIds.length} saved for offline access</span>
        </div>
      </div>

      {/* Search & Category Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {filterTabs.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            aria-label="Search manuals, guides, and videos"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search manuals, guides, videos…"
            className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>
      </div>

      {/* Resource Cards Grid */}
      {filteredResources.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {filter === 'Bookmarked'
              ? 'No materials bookmarked for offline access yet.'
              : 'No resources matched your search.'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {filter === 'Bookmarked'
              ? 'Click the bookmark icon on any manual, guide, or training video to save it offline.'
              : 'Try clearing the search box or switching to All Materials.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((item) => {
            const isBookmarked = bookmarkedIds.includes(item.id);
            const thumbFailed = brokenThumbs[item.id];

            return (
              <article
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                    {!thumbFailed ? (
                      <img
                        src={getThumbnailSrc(item)}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setBrokenThumbs((prev) => ({ ...prev, [item.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 text-slate-600 dark:text-slate-300 p-4">
                        {getCategoryIcon(item.category)}
                        <span className="text-xs font-medium mt-2">{item.category}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                        {getCategoryIcon(item.category)}
                        <span>{item.category}</span>
                      </span>
                      <span>{item.updatedAt}</span>
                    </div>

                    <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {item.title}
                    </h2>

                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                      {item.summary}
                    </p>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-mono">
                      {item.durationOrLength} · {item.tags.join(' · ')}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveResource(item);
                      setIsPlayingVideo(false);
                    }}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
                  >
                    {item.category === 'Training Videos' ? 'Watch & Read Transcript' : 'Open Material'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleBookmark(item)}
                    aria-pressed={isBookmarked}
                    aria-label={
                      isBookmarked
                        ? `Remove offline bookmark for ${item.title}`
                        : `Bookmark ${item.title} for offline access`
                    }
                    className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isBookmarked
                        ? 'border-red-700 bg-red-50 text-red-800 dark:border-red-500 dark:bg-red-950/50 dark:text-red-200'
                        : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    <span>{isBookmarked ? 'Saved Offline' : 'Bookmark'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Resource Reader / Video Modal */}
      {activeResource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resource-modal-title"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-slate-900 dark:text-slate-100">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-xs font-medium text-red-700 dark:text-red-400">
                  {activeResource.category} · {activeResource.durationOrLength}
                </p>
                <h2 id="resource-modal-title" className="font-display text-xl font-bold mt-1">
                  {activeResource.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveResource(null)}
                aria-label="Close resource viewer"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeResource.category === 'Training Videos' && (
              <div className="mt-5 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 text-white">
                <div className="relative aspect-video bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
                  <img
                    src={getThumbnailSrc(activeResource)}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover opacity-35"
                  />
                  <div className="relative z-10 space-y-3">
                    <button
                      type="button"
                      onClick={() => setIsPlayingVideo((p) => !p)}
                      className="w-14 h-14 rounded-full bg-red-700 hover:bg-red-600 text-white inline-flex items-center justify-center transition-colors cursor-pointer"
                      aria-label={isPlayingVideo ? 'Pause training video' : 'Play training video'}
                    >
                      {isPlayingVideo ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                    </button>
                    <p className="text-xs font-medium text-slate-100">
                      {isPlayingVideo
                        ? 'Playing offline-cached training module — review chapter notes below'
                        : 'Click Play to launch training briefing & chapter walkthrough'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className="mt-5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {activeResource.summary}
            </p>

            <div className="mt-6 space-y-5">
              {activeResource.offlineSections.map((section) => (
                <section key={section.heading} className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                    {section.heading}
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-sm text-slate-600 dark:text-slate-300 list-disc list-inside">
                    {section.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onToggleBookmark(activeResource)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Bookmark
                  className={`w-4 h-4 ${
                    bookmarkedIds.includes(activeResource.id) ? 'fill-current text-red-700 dark:text-red-400' : ''
                  }`}
                />
                <span>
                  {bookmarkedIds.includes(activeResource.id)
                    ? 'Bookmarked for Offline Access'
                    : 'Bookmark for Offline Access'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveResource(null)}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold cursor-pointer"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
