export type ContentType = 'all' | 'torrent' | 'web' | 'ipfs' | 'mp3' | 'video' | 'pdf' | 'onion' | 'other';

export type Language = 'en' | 'pt';

export interface NostrRelay {
  url: string;
  enabled: boolean;
  status: 'connected' | 'connecting' | 'error' | 'disconnected';
  latency?: number;
  eventCount?: number;
}

export interface IndexedItem {
  id: string; // Nostr event ID or unique ID
  pubkey: string; // Nostr author public key
  title: string;
  url: string; // URL, magnet link, ipfs://, etc.
  type: ContentType;
  description: string;
  tags: string[];
  createdAt: number; // Unix timestamp in seconds
  lang?: string;
  category?: string;
  size?: string; // Optional file size (e.g., "1.2 GB")
  upvotes?: number;
  userVoted?: boolean;
  relaySource?: string; // Which relay it came from
  rawEvent?: any; // Full Nostr event object
  isEncrypted?: boolean; // Indicates item payload was encrypted on relay for anti-censorship
}

export interface NostrUser {
  pubkey: string;
  npub: string;
  nsec?: string;
  method: 'extension' | 'nsec' | 'generated' | 'read-only';
  name?: string;
  avatar?: string;
}

export interface SearchFilter {
  query: string;
  type: ContentType;
  tag?: string;
  language?: string;
  sortBy: 'relevance' | 'date' | 'votes';
}
