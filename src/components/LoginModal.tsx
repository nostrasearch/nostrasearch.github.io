import React, { useState } from 'react';
import { X, Key, ShieldCheck, Sparkles, AlertCircle, ArrowRight, Copy, Check, UserCheck } from 'lucide-react';
import { Language, NostrUser } from '../types';
import { getTranslation } from '../i18n/translations';
import { generateTestNostrUser, parseNsecUser } from '../services/nostr';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: NostrUser) => void;
  lang: Language;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  lang,
}) => {
  if (!isOpen) return null;

  const t = getTranslation(lang);

  const [nsecInput, setNsecInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<NostrUser | null>(null);
  const [copiedKey, setCopiedKey] = useState<'nsec' | 'npub' | null>(null);

  // NIP-07 Extension Login
  const handleExtensionLogin = async () => {
    setErrorMsg(null);
    if ((window as any).nostr) {
      try {
        const pubkey = await (window as any).nostr.getPublicKey();
        const user: NostrUser = {
          pubkey,
          npub: pubkey,
          method: 'extension',
          name: 'Extension Nostr User',
        };
        onLoginSuccess(user);
        onClose();
      } catch (err: any) {
        setErrorMsg('Extension login failed or rejected: ' + (err.message || ''));
      }
    } else {
      setErrorMsg('Nostr extension not detected! Install Alby or nos2x, or use Secret Key / Generated Key.');
    }
  };

  // Nsec Private Key Login
  const handleNsecLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const user = parseNsecUser(nsecInput);
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMsg(t.invalidNsec);
    }
  };

  // Generate New Nostr Keypair & Show Creation Screen
  const handleGenerateKey = () => {
    setErrorMsg(null);
    const user = generateTestNostrUser();
    setCreatedUser(user);
  };

  const handleCopyKey = (key: string, type: 'nsec' | 'npub') => {
    navigator.clipboard.writeText(key);
    setCopiedKey(type);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleConfirmCreatedAccount = () => {
    if (createdUser) {
      onLoginSuccess(createdUser);
      setCreatedUser(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={() => {
            setCreatedUser(null);
            onClose();
          }}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!createdUser ? (
          <>
            {/* Modal Header */}
            <div className="mb-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 shadow-lg shadow-purple-900/30 mx-auto mb-3 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Key className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-100">{t.loginModalTitle}</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">{t.loginModalDesc}</p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Method 1: Extension */}
              <button
                onClick={handleExtensionLogin}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-800/80 flex items-center justify-center text-purple-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-purple-300">
                      {t.loginNip07}
                    </h4>
                    <p className="text-[11px] text-slate-400">{t.loginNip07Desc}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-transform group-hover:translate-x-1" />
              </button>

              {/* Method 2: Secret Key Input */}
              <form onSubmit={handleNsecLogin} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase">
                  {t.loginNsec}
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={nsecInput}
                    onChange={(e) => setNsecInput(e.target.value)}
                    placeholder={t.loginNsecPlaceholder}
                    className="flex-1 h-10 px-3 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-purple-500 text-slate-100 text-xs font-mono focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 h-10 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shrink-0"
                  >
                    {t.login}
                  </button>
                </div>
              </form>

              {/* Method 3: Create Account / Generate Keypair */}
              <button
                onClick={handleGenerateKey}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-purple-950/30 border border-purple-900/40 hover:border-purple-500/60 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-900/50 flex items-center justify-center text-purple-300">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-purple-200 group-hover:text-purple-100">
                      {t.loginGenerate}
                    </h4>
                    <p className="text-[11px] text-purple-300/70">{t.loginGenerateDesc}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </>
        ) : (
          /* Account Creation Success View */
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 mx-auto mb-3 flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-100">{t.createAccountTitle}</h2>
              <p className="text-slate-400 text-xs mt-1">{t.createAccountDesc}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              {/* NSEC (Private key) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
                    {t.loginNsec} (Chave Privada / Secret)
                  </span>
                  <button
                    onClick={() => handleCopyKey(createdUser.nsec || '', 'nsec')}
                    className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    {copiedKey === 'nsec' ? (
                      <>
                        <Check className="w-3 h-3" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> {t.copyNsec}
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 truncate select-all">
                  {createdUser.nsec}
                </div>
              </div>

              {/* NPUB (Public key) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {t.loginReadOnly} (Chave Pública / npub)
                  </span>
                  <button
                    onClick={() => handleCopyKey(createdUser.npub, 'npub')}
                    className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    {copiedKey === 'npub' ? (
                      <>
                        <Check className="w-3 h-3" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> {t.copyNpub}
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-400 truncate select-all">
                  {createdUser.npub}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-purple-200 text-xs flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>{t.accountCreatedSuccess}</span>
            </div>

            <button
              onClick={handleConfirmCreatedAccount}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all"
            >
              <span>{t.useCreatedAccount}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
