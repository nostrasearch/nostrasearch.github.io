import React from 'react';
import { Radio, PlusCircle, LogIn, LogOut, Sparkles } from 'lucide-react';
import { Language, NostrUser, NostrRelay } from '../types';
import { getTranslation } from '../i18n/translations';

interface HeaderProps {
  onGoHome: () => void;
  lang: Language;
  setLang: (l: Language) => void;
  user: NostrUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenIndex: () => void;
  onOpenRelays: () => void;
  relays: NostrRelay[];
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onGoHome,
  lang,
  setLang,
  user,
  onOpenLogin,
  onLogout,
  onOpenIndex,
  onOpenRelays,
  relays,
}) => {
  const t = getTranslation(lang);
  const connectedCount = relays.filter((r) => r.status === 'connected' && r.enabled).length;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-900/80 border-b border-slate-800 text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2.5 group text-left focus:outline-none"
            title="Go to Nostra Home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-400 p-0.5 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-200 to-white">
                {t.appName}
              </span>
              <span className="text-[10px] uppercase font-semibold text-purple-400/80 tracking-widest hidden sm:inline">
                Nostr Search
              </span>
            </div>
          </button>
        </div>



        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Relay Status Indicator */}
          <button
            onClick={onOpenRelays}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 hover:border-purple-500/50 text-xs font-medium text-slate-300 hover:text-white transition-all"
            title={t.relayManager}
          >
            <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="hidden md:inline">{connectedCount}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          </button>

          {/* Index Content Button */}
          <button
            onClick={user ? onOpenIndex : onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-900/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.indexButton}</span>
          </button>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-1 rounded-md transition-all ${
                lang === 'en' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('pt')}
              className={`px-2 py-1 rounded-md transition-all ${
                lang === 'pt' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PT
            </button>
          </div>

          {/* Auth Button / Profile Pill */}
          {user ? (
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700/80 rounded-lg px-2.5 py-1">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
                {user.npub.substring(5, 7).toUpperCase()}
              </div>
              <span className="text-xs font-mono text-purple-300 hidden md:inline">
                {user.npub.substring(0, 8)}...
              </span>
              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                title={t.logout}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-purple-500 text-slate-200 text-xs font-medium transition-all"
            >
              <LogIn className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">{t.login}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
