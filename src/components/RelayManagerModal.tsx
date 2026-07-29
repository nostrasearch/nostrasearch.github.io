import React, { useState } from 'react';
import { X, Radio, Plus, Trash2, RotateCcw, Check, AlertCircle, Wifi } from 'lucide-react';
import { NostrRelay, Language } from '../types';
import { getTranslation } from '../i18n/translations';

interface RelayManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  relays: NostrRelay[];
  lang: Language;
  onAddRelay: (url: string) => void;
  onRemoveRelay: (url: string) => void;
  onToggleRelay: (url: string) => void;
  onResetRelays: () => void;
}

export const RelayManagerModal: React.FC<RelayManagerModalProps> = ({
  isOpen,
  onClose,
  relays,
  lang,
  onAddRelay,
  onRemoveRelay,
  onToggleRelay,
  onResetRelays,
}) => {
  if (!isOpen) return null;

  const t = getTranslation(lang);
  const [newRelayUrl, setNewRelayUrl] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRelayUrl.trim()) {
      onAddRelay(newRelayUrl.trim());
      setNewRelayUrl('');
    }
  };

  const getStatusBadge = (relay: NostrRelay) => {
    if (!relay.enabled) {
      return (
        <span className="text-[11px] text-slate-500 font-mono">Disabled</span>
      );
    }
    switch (relay.status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            {t.relayStatusConnected} {relay.latency ? `(${relay.latency}ms)` : ''}
          </span>
        );
      case 'connecting':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {t.relayStatusConnecting}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-800/60">
            <AlertCircle className="w-3 h-3" />
            {t.relayStatusError}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4" />
            <span>Decentralized Network</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100">{t.relayManager}</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Nostra connects directly to WebSocket relays to retrieve and broadcast search indexes.
          </p>
        </div>

        {/* Add New Relay Input */}
        <form onSubmit={handleAdd} className="mb-6 flex gap-2">
          <input
            type="text"
            value={newRelayUrl}
            onChange={(e) => setNewRelayUrl(e.target.value)}
            placeholder={t.addRelayPlaceholder}
            className="flex-1 h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-slate-100 text-xs font-mono placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 h-11 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shrink-0 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>

        {/* Relay List */}
        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-1">
          {relays.map((relay) => (
            <div
              key={relay.url}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors gap-3"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <input
                  type="checkbox"
                  checked={relay.enabled}
                  onChange={() => onToggleRelay(relay.url)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-purple-500 shrink-0"
                />
                <div className="overflow-hidden">
                  <p className="text-xs font-mono text-slate-200 truncate">{relay.url}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {getStatusBadge(relay)}
                    {relay.eventCount && relay.eventCount > 0 ? (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {relay.eventCount} events
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onRemoveRelay(relay.url)}
                className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-900 transition-colors shrink-0"
                title="Remove Relay"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
          <button
            onClick={onResetRelays}
            className="flex items-center gap-1.5 text-slate-400 hover:text-purple-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetRelays}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
