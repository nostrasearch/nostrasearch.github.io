import React from 'react';
import { Sparkles, Radio, ShieldCheck, Github } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../i18n/translations';

interface FooterProps {
  lang: Language;
  onOpenRelays: () => void;
  relaysCount: number;
}

export const Footer: React.FC<FooterProps> = ({ lang, onOpenRelays, relaysCount }) => {
  const t = getTranslation(lang);

  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800/80 text-slate-400 py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        {/* Brand & Notice */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-extrabold text-slate-200 text-sm tracking-tight">{t.appName}</span>
          </div>
          <p className="text-slate-500 max-w-md">{t.decentralizedNotice}</p>
        </div>

        {/* Links & Relay Info */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={onOpenRelays}
            className="flex items-center gap-1.5 hover:text-purple-300 transition-colors font-medium"
          >
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>
              {relaysCount} {t.relaysConnected}
            </span>
          </button>

          <a
            href="https://github.com/nostr-protocol/nips"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-purple-300 transition-colors font-medium"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>NIP-78 Protocol</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
