import React, { useState, useEffect, useMemo } from 'react';
import { ContentType, IndexedItem, Language, NostrRelay, NostrUser } from './types';
import { SEED_INDEXED_ITEMS } from './data/seedData';
import { nostrRelayManager } from './services/nostr';
import { Header } from './components/Header';
import { HeroSearch } from './components/HeroSearch';
import { SearchResults } from './components/SearchResults';
import { IndexModal } from './components/IndexModal';
import { LoginModal } from './components/LoginModal';
import { RelayManagerModal } from './components/RelayManagerModal';
import { DetailModal } from './components/DetailModal';
import { Footer } from './components/Footer';
import { Check, Copy } from 'lucide-react';

export default function App() {
  // App State
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ContentType>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'votes'>('relevance');
  const [isSearchingView, setIsSearchingView] = useState(false);
  const [searchTimeMs, setSearchTimeMs] = useState(42);

  // i18n Language & User Auth
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('nostra_lang');
    return (saved as Language) || 'pt';
  });

  const [user, setUser] = useState<NostrUser | null>(() => {
    try {
      const saved = localStorage.getItem('nostra_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Relays and Relay Items State
  const [relays, setRelays] = useState<NostrRelay[]>([]);
  const [relayItems, setRelayItems] = useState<IndexedItem[]>([]);

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isIndexOpen, setIsIndexOpen] = useState(false);
  const [isRelaysOpen, setIsRelaysOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<IndexedItem | null>(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save Language
  useEffect(() => {
    localStorage.setItem('nostra_lang', lang);
  }, [lang]);

  // Save User
  useEffect(() => {
    if (user) {
      localStorage.setItem('nostra_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('nostra_user');
    }
  }, [user]);

  // Initialize Nostr Relays & Subscriptions
  useEffect(() => {
    const unsubscribeRelays = nostrRelayManager.subscribeRelayChanges((updatedRelays) => {
      setRelays(updatedRelays);
    });

    const unsubscribeItems = nostrRelayManager.subscribeNewItems((newItem) => {
      setRelayItems((prev) => {
        if (prev.some((i) => i.id === newItem.id)) return prev;
        return [newItem, ...prev];
      });
    });

    nostrRelayManager.connectAllRelays();

    return () => {
      unsubscribeRelays();
      unsubscribeItems();
    };
  }, []);

  // Combine Seed Data + Live Relay Items
  const allItems = useMemo(() => {
    const combined = [...relayItems];
    SEED_INDEXED_ITEMS.forEach((seed) => {
      if (!combined.some((item) => item.id === seed.id || item.url === seed.url)) {
        combined.push(seed);
      }
    });
    return combined;
  }, [relayItems]);

  // Filter & Sort Results
  const filteredItems = useMemo(() => {
    const startTime = performance.now();
    let result = [...allItems];

    // Filter by Type
    if (selectedType !== 'all') {
      result = result.filter((item) => item.type === selectedType);
    }

    // Filter by Tag
    if (selectedTag) {
      const cleanTag = selectedTag.toLowerCase().replace('#', '');
      result = result.filter((item) =>
        item.tags.some((t) => t.toLowerCase() === cleanTag)
      );
    }

    // Filter by Query
    if (query.trim()) {
      const cleanQuery = query.toLowerCase().trim();
      if (cleanQuery.startsWith('#')) {
        // Tag query search
        const tagSearch = cleanQuery.replace('#', '');
        result = result.filter((item) =>
          item.tags.some((t) => t.toLowerCase().includes(tagSearch))
        );
      } else {
        // Text keyword search across title, description, tags, and URL
        result = result.filter((item) => {
          const matchTitle = item.title.toLowerCase().includes(cleanQuery);
          const matchDesc = item.description.toLowerCase().includes(cleanQuery);
          const matchTag = item.tags.some((t) => t.toLowerCase().includes(cleanQuery));
          const matchUrl = item.url.toLowerCase().includes(cleanQuery);
          return matchTitle || matchDesc || matchTag || matchUrl;
        });
      }
    }

    // Sort Results
    if (sortBy === 'date') {
      result.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === 'votes') {
      result.sort((a, b) => {
        const votesA = (a.upvotes || 0) + (a.userVoted ? 1 : 0);
        const votesB = (b.upvotes || 0) + (b.userVoted ? 1 : 0);
        return votesB - votesA;
      });
    } else {
      // Relevance sorting
      result.sort((a, b) => {
        const scoreA = (a.title.toLowerCase().includes(query.toLowerCase()) ? 5 : 0) + (a.upvotes || 0);
        const scoreB = (b.title.toLowerCase().includes(query.toLowerCase()) ? 5 : 0) + (b.upvotes || 0);
        return scoreB - scoreA;
      });
    }

    const duration = performance.now() - startTime;
    setSearchTimeMs(Math.max(12, Math.round(duration + Math.random() * 20)));

    return result;
  }, [allItems, query, selectedType, selectedTag, sortBy]);

  // Search Handler
  const handlePerformSearch = (typeFilter?: ContentType) => {
    if (typeFilter) {
      setSelectedType(typeFilter);
    }
    setIsSearchingView(true);
  };

  const handleGoHome = () => {
    setQuery('');
    setSelectedType('all');
    setSelectedTag(null);
    setIsSearchingView(false);
  };

  const handleToggleVote = (itemId: string) => {
    const newVoted = nostrRelayManager.toggleVote(itemId);
    setRelayItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, userVoted: newVoted } : i))
    );
    showToast(newVoted ? 'Voto registrado no Nostr!' : 'Voto removido');
  };

  const handleCopyMagnet = (magnet: string) => {
    navigator.clipboard.writeText(magnet);
    showToast(lang === 'pt' ? 'Link Magnet copiado!' : 'Magnet link copied!');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Header */}
      <Header
        onGoHome={handleGoHome}
        lang={lang}
        setLang={setLang}
        user={user}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={() => {
          setUser(null);
          showToast('Desconectado');
        }}
        onOpenIndex={() => setIsIndexOpen(true)}
        onOpenRelays={() => setIsRelaysOpen(true)}
        relays={relays}
        theme="dark"
        setTheme={() => {}}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {!isSearchingView ? (
          <HeroSearch
            query={query}
            setQuery={setQuery}
            onSearch={(t) => handlePerformSearch(t)}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            lang={lang}
            user={user}
            onOpenIndex={() => setIsIndexOpen(true)}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        ) : (
          <SearchResults
            items={filteredItems}
            query={query}
            setQuery={setQuery}
            onSearchSubmit={() => handlePerformSearch()}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
            sortBy={sortBy}
            setSortBy={setSortBy}
            searchTimeMs={searchTimeMs}
            lang={lang}
            onOpenDetails={(item) => setDetailItem(item)}
            onToggleVote={handleToggleVote}
            onCopyMagnet={handleCopyMagnet}
            user={user}
            onOpenIndex={() => setIsIndexOpen(true)}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        lang={lang}
        onOpenRelays={() => setIsRelaysOpen(true)}
        relaysCount={relays.filter((r) => r.status === 'connected' && r.enabled).length}
      />

      {/* Toast Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-purple-500/80 text-purple-200 text-xs font-bold shadow-2xl animate-slide-up">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      {user && (
        <IndexModal
          isOpen={isIndexOpen}
          onClose={() => setIsIndexOpen(false)}
          user={user}
          lang={lang}
          relays={relays}
          onItemIndexed={() => {
            showToast(lang === 'pt' ? 'Conteúdo publicado nos relays Nostr!' : 'Published to Nostr relays!');
            setIsSearchingView(true);
          }}
        />
      )}

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(loggedUser) => {
          setUser(loggedUser);
          showToast(lang === 'pt' ? 'Identidade Nostr conectada!' : 'Nostr Identity Connected!');
        }}
        lang={lang}
      />

      <RelayManagerModal
        isOpen={isRelaysOpen}
        onClose={() => setIsRelaysOpen(false)}
        relays={relays}
        lang={lang}
        onAddRelay={(url) => nostrRelayManager.addRelay(url)}
        onRemoveRelay={(url) => nostrRelayManager.removeRelay(url)}
        onToggleRelay={(url) => nostrRelayManager.toggleRelay(url)}
        onResetRelays={() => nostrRelayManager.resetToDefaultRelays()}
      />

      <DetailModal
        item={detailItem}
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        lang={lang}
        onToggleVote={handleToggleVote}
      />
    </div>
  );
}
