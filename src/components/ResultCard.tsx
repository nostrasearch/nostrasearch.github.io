import React, { useState } from 'react';
import {
  Magnet,
  Globe,
  Package,
  Music,
  Video,
  FileText,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
  Heart,
  Clock,
  Info,
  Radio,
} from 'lucide-react';
import { IndexedItem, Language } from '../types';
import { getTranslation } from '../i18n/translations';

interface ResultCardProps {
  item: IndexedItem;
  lang: Language;
  onOpenDetails: (item: IndexedItem) => void;
  onToggleVote: (itemId: string) => void;
  onSelectTag: (tag: string) => void;
  onCopyMagnet: (magnet: string) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  item,
  lang,
  onOpenDetails,
  onToggleVote,
  onSelectTag,
  onCopyMagnet,
}) => {
  const t = getTranslation(lang);
  const [copied, setCopied] = useState(false);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'torrent':
        return {
          icon: <Magnet className="w-3.5 h-3.5 text-rose-400" />,
          label: t.torrents,
          bg: 'bg-rose-950/60 border-rose-800/60 text-rose-300',
        };
      case 'ipfs':
        return {
          icon: <Package className="w-3.5 h-3.5 text-amber-400" />,
          label: t.ipfs,
          bg: 'bg-amber-950/60 border-amber-800/60 text-amber-300',
        };
      case 'mp3':
        return {
          icon: <Music className="w-3.5 h-3.5 text-emerald-400" />,
          label: t.mp3,
          bg: 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300',
        };
      case 'video':
        return {
          icon: <Video className="w-3.5 h-3.5 text-sky-400" />,
          label: t.video,
          bg: 'bg-sky-950/60 border-sky-800/60 text-sky-300',
        };
      case 'pdf':
        return {
          icon: <FileText className="w-3.5 h-3.5 text-red-400" />,
          label: t.pdf,
          bg: 'bg-red-950/60 border-red-800/60 text-red-300',
        };
      case 'onion':
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5 text-violet-400" />,
          label: t.onion,
          bg: 'bg-violet-950/60 border-violet-800/60 text-violet-300',
        };
      default:
        return {
          icon: <Globe className="w-3.5 h-3.5 text-blue-400" />,
          label: t.web,
          bg: 'bg-blue-950/60 border-blue-800/60 text-blue-300',
        };
    }
  };

  const badge = getTypeBadge(item.type);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyMagnet(item.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(item.createdAt * 1000).toLocaleDateString(
    lang === 'pt' ? 'pt-BR' : 'en-US',
    { month: 'short', day: 'numeric', year: 'numeric' }
  );

  const isMagnet = item.url.startsWith('magnet:?');
  const isIpfs = item.url.startsWith('ipfs://');
  const isOnion = item.url.includes('.onion');

  const getOpenUrl = () => {
    if (isIpfs) {
      const hash = item.url.replace('ipfs://', '');
      return `https://ipfs.io/ipfs/${hash}`;
    }
    return item.url;
  };

  return (
    <div className="group bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 shadow-lg hover:shadow-purple-950/20 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
        {/* Title and Badge */}
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}
            >
              {badge.icon}
              <span>{badge.label}</span>
            </span>

            {item.size && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                {item.size}
              </span>
            )}

            {item.relaySource && (
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono text-purple-400/80 bg-purple-950/30 px-2 py-0.5 rounded-md border border-purple-900/40">
                <Radio className="w-2.5 h-2.5" />
                {item.relaySource.replace('wss://', '')}
              </span>
            )}
          </div>

          <h3
            onClick={() => onOpenDetails(item)}
            className="text-lg font-bold text-slate-100 hover:text-purple-300 cursor-pointer transition-colors leading-snug line-clamp-2"
          >
            {item.title}
          </h3>
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          {isMagnet ? (
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-950/80 border border-rose-800 hover:bg-rose-900 text-rose-200'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : t.copyMagnet}</span>
            </button>
          ) : isOnion ? (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-950/80 border border-violet-800 text-violet-200 hover:bg-violet-900 text-xs font-semibold transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{t.copyOnion}</span>
            </button>
          ) : (
            <a
              href={getOpenUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/80 border border-purple-800 hover:bg-purple-900 text-purple-200 text-xs font-semibold transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isIpfs ? t.openIpfs : t.openLink}</span>
            </a>
          )}
        </div>
      </div>

      {/* URL / Link Preview */}
      <div className="mb-3">
        <p className="text-xs font-mono text-purple-400/90 truncate bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80 select-all">
          {item.url}
        </p>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-slate-300 text-sm mb-3 line-clamp-2 leading-relaxed">
          {item.description}
        </p>
      )}

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {item.tags.map((tag) => (
            <button
              key={tag}
              onClick={(e) => {
                e.stopPropagation();
                onSelectTag(tag);
              }}
              className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-purple-950/60 border border-slate-700/60 hover:border-purple-800 text-slate-400 hover:text-purple-300 text-xs font-mono transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Footer Meta & Interaction */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleVote(item.id)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              item.userVoted
                ? 'bg-rose-950/80 border border-rose-800 text-rose-400 font-bold'
                : 'hover:bg-slate-800 text-slate-400 hover:text-rose-400'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${item.userVoted ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{(item.upvotes || 0) + (item.userVoted ? 1 : 0)}</span>
          </button>

          <span className="flex items-center gap-1 font-mono text-slate-500">
            <Clock className="w-3 h-3" />
            {formattedDate}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-purple-400/80 hidden sm:inline">
            by {item.pubkey.substring(0, 10)}...
          </span>

          <button
            onClick={() => onOpenDetails(item)}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 p-1"
            title="View Details & Raw Event"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
