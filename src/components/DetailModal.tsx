import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Heart,
  Magnet,
  Globe,
  Package,
  Music,
  Video,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Code,
  ExternalLink,
  Radio,
} from 'lucide-react';
import { IndexedItem, Language } from '../types';
import { getTranslation } from '../i18n/translations';

interface DetailModalProps {
  item: IndexedItem | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onToggleVote: (itemId: string) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  item,
  isOpen,
  onClose,
  lang,
  onToggleVote,
}) => {
  if (!isOpen || !item) return null;

  const t = getTranslation(lang);
  const [copiedEvent, setCopiedEvent] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const formattedDate = new Date(item.createdAt * 1000).toLocaleString(
    lang === 'pt' ? 'pt-BR' : 'en-US'
  );

  const handleCopyEvent = () => {
    navigator.clipboard.writeText(JSON.stringify(item.rawEvent || item, null, 2));
    setCopiedEvent(true);
    setTimeout(() => setCopiedEvent(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(item.url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const isMagnet = item.url.startsWith('magnet:?');
  const isIpfs = item.url.startsWith('ipfs://');
  const isOnion = item.url.includes('.onion');
  const isDirectVideo = /\.(mp4|webm|ogg|m4v)$/i.test(item.url);

  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  };
  const youtubeId = getYoutubeId(item.url);

  const ipfsGateways = [
    { name: 'IPFS.io', url: `https://ipfs.io/ipfs/${item.url.replace('ipfs://', '')}` },
    { name: 'DWeb.link', url: `https://dweb.link/ipfs/${item.url.replace('ipfs://', '')}` },
    { name: 'Cloudflare IPFS', url: `https://cloudflare-ipfs.com/ipfs/${item.url.replace('ipfs://', '')}` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-purple-950 text-purple-300 border border-purple-800">
              {item.type}
            </span>
            {item.size && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                {item.size}
              </span>
            )}
          </div>

          <h2 className="text-2xl font-extrabold text-slate-100 leading-snug">{item.title}</h2>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>{t.publishedBy}:</span>
            <span className="text-purple-300 font-bold">{item.pubkey}</span>
          </div>
        </div>

        {/* Anti-Censorship Encryption Notice */}
        {item.isEncrypted && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 space-y-1">
            <h4 className="text-xs font-bold text-emerald-300 uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t.encryptedBadge}</span>
            </h4>
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              {t.decryptedSuccessMsg}
            </p>
          </div>
        )}

        {/* URL / Protocol Box */}
        <div className="mb-6 space-y-2">
          <label className="block text-xs font-semibold text-slate-400 uppercase">
            Resource Link / Media URI
          </label>
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <p className="flex-1 font-mono text-xs text-purple-300 break-all select-all">
              {item.url}
            </p>
            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shrink-0 transition-colors"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Video Player Preview if direct MP4/WebM or YouTube */}
        {(isDirectVideo || youtubeId) && (
          <div className="mb-6 space-y-2">
            <label className="block text-xs font-semibold text-sky-400 uppercase flex items-center gap-1.5">
              <Video className="w-4 h-4" />
              <span>Video Preview</span>
            </label>
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-black">
              {isDirectVideo ? (
                <video
                  src={item.url}
                  controls
                  className="w-full max-h-80 object-contain"
                  poster=""
                >
                  Your browser does not support the video tag.
                </video>
              ) : youtubeId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={item.title}
                  className="w-full aspect-video border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : null}
            </div>
          </div>
        )}

        {/* IPFS Gateways Options */}
        {isIpfs && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/30 border border-amber-900/50 space-y-2">
            <h4 className="text-xs font-bold text-amber-300 uppercase flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              <span>IPFS Gateway Launchers</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {ipfsGateways.map((gw) => (
                <a
                  key={gw.name}
                  href={gw.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-amber-900/40 hover:border-amber-500 text-xs font-medium text-slate-200 transition-colors"
                >
                  <span>{gw.name}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Onion Tor Network Warning */}
        {isOnion && (
          <div className="mb-6 p-4 rounded-2xl bg-violet-950/40 border border-violet-800/60 space-y-2">
            <h4 className="text-xs font-bold text-violet-300 uppercase flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-violet-400" />
              <span>{t.onionWarningTitle}</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">{t.onionWarningDesc}</p>
          </div>
        )}

        {/* Description */}
        {item.description && (
          <div className="mb-6 space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase">
              Description
            </label>
            <p className="text-sm text-slate-200 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 leading-relaxed whitespace-pre-wrap">
              {item.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="mb-6 space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-purple-300 font-mono text-xs border border-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Raw Nostr Event JSON */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-purple-400" />
              <span>{t.rawEvent}</span>
            </label>
            <button
              onClick={handleCopyEvent}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono"
            >
              {copiedEvent ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedEvent ? 'Copied JSON' : t.copyEventJson}</span>
            </button>
          </div>
          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-purple-300/90 overflow-x-auto max-h-48 scrollbar-thin">
            {JSON.stringify(item.rawEvent || item, null, 2)}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={() => onToggleVote(item.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              item.userVoted
                ? 'bg-rose-950 border border-rose-800 text-rose-300'
                : 'bg-slate-800 border border-slate-700 text-slate-300 hover:text-rose-400'
            }`}
          >
            <Heart className={`w-4 h-4 ${item.userVoted ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>
              {item.userVoted ? t.upvoted : t.upvote} ({(item.upvotes || 0) + (item.userVoted ? 1 : 0)})
            </span>
          </button>

          <span className="text-xs font-mono text-slate-500">{formattedDate}</span>
        </div>
      </div>
    </div>
  );
};
