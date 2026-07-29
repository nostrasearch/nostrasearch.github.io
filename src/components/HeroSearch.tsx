import React from 'react';
import { Search, Magnet, Globe, Package, Music, Video, FileText, ShieldAlert, Sparkles, PlusCircle, ArrowRight } from 'lucide-react';
import { ContentType, Language, NostrUser } from '../types';
import { getTranslation } from '../i18n/translations';

interface HeroSearchProps {
  query: string;
  setQuery: (q: string) => void;
  onSearch: (type?: ContentType) => void;
  selectedType: ContentType;
  setSelectedType: (type: ContentType) => void;
  lang: Language;
  user: NostrUser | null;
  onOpenIndex: () => void;
  onOpenLogin: () => void;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  query,
  setQuery,
  onSearch,
  selectedType,
  setSelectedType,
  lang,
  user,
  onOpenIndex,
  onOpenLogin,
}) => {
  const t = getTranslation(lang);

  const categories: { type: ContentType; label: string; icon: React.ReactNode; color: string }[] = [
    { type: 'all', label: t.all, icon: <Globe className="w-4 h-4" />, color: 'from-purple-500 to-indigo-500' },
    { type: 'torrent', label: t.torrents, icon: <Magnet className="w-4 h-4" />, color: 'from-rose-500 to-pink-500' },
    { type: 'web', label: t.web, icon: <Globe className="w-4 h-4" />, color: 'from-blue-500 to-cyan-500' },
    { type: 'ipfs', label: t.ipfs, icon: <Package className="w-4 h-4" />, color: 'from-amber-500 to-orange-500' },
    { type: 'mp3', label: t.mp3, icon: <Music className="w-4 h-4" />, color: 'from-emerald-500 to-teal-500' },
    { type: 'video', label: t.video, icon: <Video className="w-4 h-4" />, color: 'from-sky-500 to-indigo-500' },
    { type: 'pdf', label: t.pdf, icon: <FileText className="w-4 h-4" />, color: 'from-red-500 to-amber-500' },
    { type: 'onion', label: t.onion, icon: <ShieldAlert className="w-4 h-4" />, color: 'from-violet-600 to-fuchsia-600' },
  ];

  const popularTags = [
    'linux',
    'torrents',
    'video',
    'bitcoin',
    'ipfs',
    'privacy',
    'audio',
    'pdf',
    'onion',
    'open-source',
    'p2p',
    'satoshi',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(selectedType);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4 py-8 text-center max-w-4xl mx-auto">
      {/* Brand Header */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/60 text-purple-300 text-xs font-medium mb-2 animate-bounce">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Nostr Protocol Decentralized Search</span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-200 to-pink-300">
          {t.appName}
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed">
          {t.tagline}
        </p>
      </div>

      {/* Main Search Box */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-6">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 rounded-full blur-md opacity-30 group-hover:opacity-60 transition duration-300"></div>
          
          <div className="relative flex items-center bg-slate-900 border border-slate-700/80 rounded-full shadow-2xl p-2 pl-5 focus-within:border-purple-500">
            <Search className="w-5 h-5 text-purple-400 shrink-0 mr-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-transparent text-slate-100 placeholder-slate-400 text-base focus:outline-none"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-200 text-sm px-2 mr-1"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-purple-900/30 transition-transform active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <span>{t.searchButton}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Category Pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-3xl">
        {categories.map((cat) => {
          const isSelected = selectedType === cat.type;
          return (
            <button
              key={cat.type}
              type="button"
              onClick={() => setSelectedType(cat.type)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 ring-2 ring-purple-400/50 scale-105'
                  : 'bg-slate-800/80 border border-slate-700/70 text-slate-300 hover:bg-slate-700/80 hover:text-white'
              }`}
            >
              <span className={isSelected ? 'text-white' : 'text-purple-400'}>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Actions (Index Content or Feeling Lucky) */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
        <button
          type="button"
          onClick={() => onSearch(selectedType)}
          className="px-5 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-purple-500/80 text-slate-200 text-xs font-medium transition-all cursor-pointer"
        >
          {t.feelingLucky}
        </button>

        <button
          type="button"
          onClick={user ? onOpenIndex : onOpenLogin}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-950/80 border border-purple-800/80 hover:bg-purple-900/80 text-purple-200 text-xs font-semibold transition-all"
        >
          <PlusCircle className="w-4 h-4 text-purple-400" />
          <span>{user ? t.indexButton : t.loginToindex}</span>
        </button>
      </div>

      {/* Popular Tags */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
          Popular Nostr Tags
        </span>
        <div className="flex flex-wrap justify-center gap-1.5 max-w-xl">
          {popularTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setQuery(`#${tag}`);
                onSearch(selectedType);
              }}
              className="px-2.5 py-1 rounded-md bg-slate-800/50 hover:bg-purple-950/50 border border-slate-800 hover:border-purple-800 text-slate-400 hover:text-purple-300 text-xs transition-colors font-mono"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
