import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  Radio,
  CheckCircle,
  AlertCircle,
  Magnet,
  Globe,
  Package,
  Music,
  Video,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Loader2,
} from 'lucide-react';
import { ContentType, Language, NostrUser, NostrRelay } from '../types';
import { getTranslation } from '../i18n/translations';
import { nostrRelayManager } from '../services/nostr';

interface IndexModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: NostrUser;
  lang: Language;
  relays: NostrRelay[];
  onItemIndexed: () => void;
}

export const IndexModal: React.FC<IndexModalProps> = ({
  isOpen,
  onClose,
  user,
  lang,
  relays,
  onItemIndexed,
}) => {
  if (!isOpen) return null;

  const t = getTranslation(lang);

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<ContentType>('web');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [contentLang, setContentLang] = useState(lang);
  const [enableEncryption, setEnableEncryption] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<
    { relay: string; success: boolean; msg?: string }[] | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-detect protocol type from URL input
  const handleUrlChange = (val: string) => {
    setUrl(val);
    const clean = val.trim();
    if (clean.startsWith('magnet:?')) {
      setType('torrent');
    } else if (clean.includes('.onion')) {
      setType('onion');
    } else if (clean.startsWith('ipfs://') || clean.includes('/ipfs/')) {
      setType('ipfs');
    } else if (
      /\.(mp4|webm|mkv|avi|mov|m4v)$/i.test(clean) ||
      clean.includes('youtube.com') ||
      clean.includes('youtu.be') ||
      clean.includes('peertube') ||
      clean.includes('odysee.com') ||
      clean.includes('vimeo.com') ||
      clean.includes('bitchute.com') ||
      clean.includes('rumble.com')
    ) {
      setType('video');
    } else if (clean.endsWith('.mp3') || clean.endsWith('.ogg') || clean.endsWith('.wav')) {
      setType('mp3');
    } else if (clean.endsWith('.pdf')) {
      setType('pdf');
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      setErrorMessage('Title and URL / Link are required');
      return;
    }

    setErrorMessage(null);
    setIsPublishing(true);
    setPublishStatus(null);

    try {
      const parsedTags = tagsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const newItem = await nostrRelayManager.publishIndexItem(
        user,
        {
          title: title.trim(),
          url: url.trim(),
          type,
          description: description.trim(),
          tags: parsedTags,
          lang: contentLang,
        },
        enableEncryption
      );

      // Show success, wait 1.5s, trigger update & close modal
      setIsPublishing(false);
      onItemIndexed();
      setTimeout(() => {
        onClose();
        // Reset form
        setTitle('');
        setUrl('');
        setDescription('');
        setTagsInput('');
        setPublishStatus(null);
      }, 1200);
    } catch (err: any) {
      console.error('Publish error:', err);
      setIsPublishing(false);
      setErrorMessage(err.message || t.publishFailed);
    }
  };

  const connectedRelays = relays.filter((r) => r.enabled && r.status === 'connected');

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
        <div className="mb-6">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <PlusCircle className="w-4 h-4" />
            <span>Nostr Protocol Indexing</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100">{t.indexModalTitle}</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">{t.indexModalSubtitle}</p>
        </div>

        {/* Form */}
        <form onSubmit={handlePublish} className="space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              {t.titleLabel} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.titlePlaceholder}
              className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
              required
            />
          </div>

          {/* URL / Magnet Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              {t.urlLabel} *
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder={t.urlPlaceholder}
              className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-slate-100 placeholder-slate-500 text-sm font-mono focus:outline-none"
              required
            />
          </div>

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              {t.typeLabel}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { type: 'web', label: t.web, icon: <Globe className="w-3.5 h-3.5" /> },
                { type: 'torrent', label: t.torrents, icon: <Magnet className="w-3.5 h-3.5" /> },
                { type: 'ipfs', label: t.ipfs, icon: <Package className="w-3.5 h-3.5" /> },
                { type: 'video', label: t.video, icon: <Video className="w-3.5 h-3.5" /> },
                { type: 'mp3', label: t.mp3, icon: <Music className="w-3.5 h-3.5" /> },
                { type: 'pdf', label: t.pdf, icon: <FileText className="w-3.5 h-3.5" /> },
                { type: 'onion', label: t.onion, icon: <ShieldAlert className="w-3.5 h-3.5" /> },
              ].map((cat) => (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() => setType(cat.type as ContentType)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    type === cat.type
                      ? 'bg-purple-600 border-purple-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              {t.descriptionLabel}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.descriptionPlaceholder}
              rows={3}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-slate-100 placeholder-slate-500 text-sm focus:outline-none resize-none"
            />
          </div>

          {/* Tags & Language Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                {t.tagsLabel}
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder={t.tagsPlaceholder}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                {t.langLabel}
              </label>
              <select
                value={contentLang}
                onChange={(e) => setContentLang(e.target.value as Language)}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-slate-100 text-sm focus:outline-none"
              >
                <option value="en">English (EN)</option>
                <option value="pt">Português (PT)</option>
              </select>
            </div>
          </div>

          {/* Anti-Censorship Relay Encryption Toggle Box */}
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableEncryption}
                onChange={(e) => setEnableEncryption(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/30 accent-emerald-500"
              />
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.enableEncryptionLabel}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {t.enableEncryptionDesc}
                </p>
              </div>
            </label>
          </div>

          {/* Active Broadcast Relays Badge */}
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-900/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-purple-300">
              <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>
                Target Relays: <strong>{connectedRelays.length} active</strong>
              </span>
            </div>
            <span className="text-slate-400 text-[11px] font-mono">Kind 30078 (NIP-78)</span>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPublishing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.publishing}</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>{t.publishButton}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
