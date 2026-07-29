import React from 'react';
import {
  Globe,
  Magnet,
  Package,
  Music,
  Video,
  FileText,
  ShieldAlert,
  Search,
  SlidersHorizontal,
  PlusCircle,
  X,
} from 'lucide-react';
import { IndexedItem, ContentType, Language, NostrUser } from '../types';
import { getTranslation } from '../i18n/translations';
import { ResultCard } from './ResultCard';

interface SearchResultsProps {
  items: IndexedItem[];
  query: string;
  setQuery: (query: string) => void;
  onSearchSubmit: () => void;
  selectedType: ContentType;
  setSelectedType: (type: ContentType) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  sortBy: 'relevance' | 'date' | 'votes';
  setSortBy: (sort: 'relevance' | 'date' | 'votes') => void;
  searchTimeMs: number;
  lang: Language;
  onOpenDetails: (item: IndexedItem) => void;
  onToggleVote: (itemId: string) => void;
  onCopyMagnet: (magnet: string) => void;
  user: NostrUser | null;
  onOpenIndex: () => void;
  onOpenLogin: () => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  items,
  query,
  setQuery,
  onSearchSubmit,
  selectedType,
  setSelectedType,
  selectedTag,
  setSelectedTag,
  sortBy,
  setSortBy,
  searchTimeMs,
  lang,
  onOpenDetails,
  onToggleVote,
  onCopyMagnet,
  user,
  onOpenIndex,
  onOpenLogin,
}) => {
  const t = getTranslation(lang);

  const categories: { type: ContentType; label: string; icon: React.ReactNode }[] = [
    { type: 'all', label: t.all, icon: <Globe className="w-4 h-4" /> },
    { type: 'torrent', label: t.torrents, icon: <Magnet className="w-4 h-4" /> },
    { type: 'web', label: t.web, icon: <Globe className="w-4 h-4" /> },
    { type: 'ipfs', label: t.ipfs, icon: <Package className="w-4 h-4" /> },
    { type: 'mp3', label: t.mp3, icon: <Music className="w-4 h-4" /> },
    { type: 'video', label: t.video, icon: <Video className="w-4 h-4" /> },
    { type: 'pdf', label: t.pdf, icon: <FileText className="w-4 h-4" /> },
    { type: 'onion', label: t.onion, icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  // Calculate counts per category
  const getCategoryCount = (type: ContentType) => {
    if (type === 'all') return items.length;
    return items.filter((i) => i.type === type).length;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Google-Style Main Search Box on Results Page */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl">
        <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 flex items-center w-full bg-slate-950 border border-slate-700/80 rounded-full px-4 py-2.5 shadow-inner focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
            <Search className="w-5 h-5 text-purple-400 shrink-0 mr-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-transparent text-slate-100 placeholder-slate-400 text-sm sm:text-base focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 font-bold"
                title="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto h-11 px-6 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 shrink-0 transition-transform active:scale-95 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>{t.searchButton}</span>
          </button>
        </form>
      </div>

      {/* Search Stats & Category Navigation */}
      <div className="border-b border-slate-800/80 pb-4 space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const count = getCategoryCount(cat.type);
            const isSelected = selectedType === cat.type;
            return (
              <button
                key={cat.type}
                onClick={() => setSelectedType(cat.type)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                    isSelected ? 'bg-purple-800 text-purple-100' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Query Meta Info & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              {items.length} {t.resultsFound} {(searchTimeMs / 1000).toFixed(2)} {t.seconds}
            </span>

            {selectedTag && (
              <span className="inline-flex items-center gap-1 bg-purple-950 border border-purple-800 text-purple-300 px-2.5 py-0.5 rounded-full font-mono">
                #{selectedTag}
                <button
                  onClick={() => setSelectedTag(null)}
                  className="hover:text-white ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-medium text-slate-400">{t.sortBy}:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:border-purple-500 focus:outline-none"
            >
              <option value="relevance">{t.sortRelevance}</option>
              <option value="date">{t.sortDate}</option>
              <option value="votes">{t.sortVotes}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Results List */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {items.map((item) => (
            <ResultCard
              key={item.id}
              item={item}
              lang={lang}
              onOpenDetails={onOpenDetails}
              onToggleVote={onToggleVote}
              onSelectTag={(tag) => setSelectedTag(tag)}
              onCopyMagnet={onCopyMagnet}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-400 mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-2">{t.noResultsTitle}</h3>
          <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
            {t.noResultsDesc}
          </p>

          <button
            onClick={user ? onOpenIndex : onOpenLogin}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-900/30 transition-all hover:scale-105"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{user ? t.indexButton : t.loginToindex}</span>
          </button>
        </div>
      )}
    </div>
  );
};
