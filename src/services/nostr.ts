import { generateSecretKey, getPublicKey, finalizeEvent, nip19 } from 'nostr-tools';
import { IndexedItem, NostrRelay, ContentType, NostrUser } from '../types';
import { DEFAULT_RELAYS, SEED_INDEXED_ITEMS } from '../data/seedData';

// Custom Kind for Nostra Indexed Search Entry (Kind 30078: App Data / Parameterized Replaceable)
const NOSTRA_EVENT_KIND = 30078;
const NOSTRA_D_TAG = 'nostra:index';

// Nostra Censorship-Resistant Encryption Helpers (AES-256-GCM via Web Crypto API)
const NOSTRA_CIPHER_SECRET = 'NOSTRA_CENSORSHIP_RESISTANT_SEARCH_KEY_V1';

async function getEncryptionKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest('SHA-256', enc.encode(NOSTRA_CIPHER_SECRET));
  return crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptNostraPayload(dataObj: object): Promise<string> {
  try {
    const jsonStr = JSON.stringify(dataObj);
    const enc = new TextEncoder();
    const encodedData = enc.encode(jsonStr);

    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    const ivBase64 = btoa(String.fromCharCode(...iv));
    const cipherBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));

    return `NOSTRA_ENC_V1:${ivBase64}:${cipherBase64}`;
  } catch (err) {
    console.error('Failed to encrypt payload:', err);
    return `NOSTRA_ENC_V1:RAW:${btoa(unescape(encodeURIComponent(JSON.stringify(dataObj))))}`;
  }
}

export async function decryptNostraPayload(contentStr: string): Promise<any | null> {
  if (!contentStr || typeof contentStr !== 'string' || !contentStr.startsWith('NOSTRA_ENC_V1:')) {
    return null;
  }

  try {
    const parts = contentStr.split(':');
    if (parts.length < 3) return null;

    const ivStr = parts[1];
    const cipherStr = parts[2];

    if (ivStr === 'RAW') {
      const decodedStr = decodeURIComponent(escape(atob(cipherStr)));
      return JSON.parse(decodedStr);
    }

    const iv = new Uint8Array(atob(ivStr).split('').map((c) => c.charCodeAt(0)));
    const cipherBuffer = new Uint8Array(atob(cipherStr).split('').map((c) => c.charCodeAt(0)));

    const key = await getEncryptionKey();
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBuffer
    );

    const dec = new TextDecoder();
    const jsonStr = dec.decode(decryptedBuffer);
    return JSON.parse(jsonStr);
  } catch (err) {
    console.warn('Failed to decrypt Nostra payload from relay:', err);
    return null;
  }
}

export class NostrRelayManager {
  private sockets: Map<string, WebSocket> = new Map();
  private relays: NostrRelay[] = [];
  private listeners: Set<(relays: NostrRelay[]) => void> = new Set();
  private itemListeners: Set<(item: IndexedItem) => void> = new Set();
  private localVotes: Set<string> = new Set();

  constructor() {
    this.loadRelaysFromStorage();
    this.loadVotesFromStorage();
  }

  private loadRelaysFromStorage() {
    try {
      const saved = localStorage.getItem('nostra_relays');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.relays = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved relays, using default list:', e);
    }
    this.relays = DEFAULT_RELAYS.map((url) => ({
      url,
      enabled: true,
      status: 'disconnected',
    }));
    this.saveRelaysToStorage();
  }

  private saveRelaysToStorage() {
    try {
      localStorage.setItem('nostra_relays', JSON.stringify(this.relays));
    } catch (e) {
      console.error('Failed to save relays:', e);
    }
  }

  private loadVotesFromStorage() {
    try {
      const saved = localStorage.getItem('nostra_votes');
      if (saved) {
        this.localVotes = new Set(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load local votes');
    }
  }

  private saveVotesToStorage() {
    try {
      localStorage.setItem('nostra_votes', JSON.stringify(Array.from(this.localVotes)));
    } catch (e) {
      console.error('Failed to save votes');
    }
  }

  public getRelays(): NostrRelay[] {
    return [...this.relays];
  }

  public subscribeRelayChanges(callback: (relays: NostrRelay[]) => void) {
    this.listeners.add(callback);
    callback(this.getRelays());
    return () => this.listeners.delete(callback);
  }

  public subscribeNewItems(callback: (item: IndexedItem) => void) {
    this.itemListeners.add(callback);
    return () => this.itemListeners.delete(callback);
  }

  private notifyRelayChange() {
    const current = this.getRelays();
    this.saveRelaysToStorage();
    this.listeners.forEach((cb) => cb(current));
  }

  public connectAllRelays() {
    this.relays.forEach((r) => {
      if (r.enabled) {
        this.connectRelay(r.url);
      }
    });
  }

  public connectRelay(url: string) {
    const existing = this.sockets.get(url);
    if (existing && (existing.readyState === WebSocket.CONNECTING || existing.readyState === WebSocket.OPEN)) {
      return;
    }

    const relayIndex = this.relays.findIndex((r) => r.url === url);
    if (relayIndex !== -1) {
      this.relays[relayIndex].status = 'connecting';
      this.notifyRelayChange();
    }

    const startTime = Date.now();
    try {
      const ws = new WebSocket(url);
      this.sockets.set(url, ws);

      ws.onopen = () => {
        const latency = Date.now() - startTime;
        const idx = this.relays.findIndex((r) => r.url === url);
        if (idx !== -1) {
          this.relays[idx].status = 'connected';
          this.relays[idx].latency = latency;
          this.notifyRelayChange();
        }

        // Subscribe to Nostra Index search events on open connection
        const subId = 'nostra_sub_' + Math.random().toString(36).substring(2, 8);
        const reqFilter = {
          kinds: [NOSTRA_EVENT_KIND, 1], // Kind 30078 or Kind 1 text notes
          '#d': [NOSTRA_D_TAG],
          limit: 100,
        };
        ws.send(JSON.stringify(['REQ', subId, reqFilter]));
      };

      ws.onmessage = async (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (Array.isArray(data) && data[0] === 'EVENT') {
            const event = data[2];
            const parsedItem = await this.parseNostrEventToItem(event, url);
            if (parsedItem) {
              const idx = this.relays.findIndex((r) => r.url === url);
              if (idx !== -1) {
                this.relays[idx].eventCount = (this.relays[idx].eventCount || 0) + 1;
                this.notifyRelayChange();
              }
              this.itemListeners.forEach((cb) => cb(parsedItem));
            }
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      };

      ws.onerror = () => {
        const idx = this.relays.findIndex((r) => r.url === url);
        if (idx !== -1) {
          this.relays[idx].status = 'error';
          this.notifyRelayChange();
        }
      };

      ws.onclose = () => {
        const idx = this.relays.findIndex((r) => r.url === url);
        if (idx !== -1 && this.relays[idx].status !== 'error') {
          this.relays[idx].status = 'disconnected';
          this.notifyRelayChange();
        }
      };
    } catch (err) {
      const idx = this.relays.findIndex((r) => r.url === url);
      if (idx !== -1) {
        this.relays[idx].status = 'error';
        this.notifyRelayChange();
      }
    }
  }

  public addRelay(url: string) {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('ws://') && !cleanUrl.startsWith('wss://')) {
      cleanUrl = 'wss://' + cleanUrl;
    }
    if (!this.relays.some((r) => r.url === cleanUrl)) {
      this.relays.push({ url: cleanUrl, enabled: true, status: 'disconnected' });
      this.saveRelaysToStorage();
      this.connectRelay(cleanUrl);
    }
  }

  public removeRelay(url: string) {
    const ws = this.sockets.get(url);
    if (ws) {
      ws.close();
      this.sockets.delete(url);
    }
    this.relays = this.relays.filter((r) => r.url !== url);
    this.notifyRelayChange();
  }

  public toggleRelay(url: string) {
    const idx = this.relays.findIndex((r) => r.url === url);
    if (idx !== -1) {
      this.relays[idx].enabled = !this.relays[idx].enabled;
      if (!this.relays[idx].enabled) {
        const ws = this.sockets.get(url);
        if (ws) {
          ws.close();
          this.sockets.delete(url);
        }
        this.relays[idx].status = 'disconnected';
      } else {
        this.connectRelay(url);
      }
      this.notifyRelayChange();
    }
  }

  public resetToDefaultRelays() {
    this.sockets.forEach((ws) => ws.close());
    this.sockets.clear();
    this.relays = DEFAULT_RELAYS.map((url) => ({
      url,
      enabled: true,
      status: 'disconnected',
    }));
    this.notifyRelayChange();
    this.connectAllRelays();
  }

  public async parseNostrEventToItem(event: any, relayUrl?: string): Promise<IndexedItem | null> {
    if (!event || !event.tags) return null;

    let isEncrypted = false;
    let title = '';
    let url = '';
    let type: ContentType = 'other';
    let description = '';
    let tags: string[] = [];
    let lang = 'en';

    // Check if event content or enc tag is encrypted
    const encTag = event.tags.find((t: string[]) => t[0] === 'enc');
    const isEncryptedContent = typeof event.content === 'string' && event.content.startsWith('NOSTRA_ENC_V1:');

    if (isEncryptedContent || encTag) {
      const decrypted = await decryptNostraPayload(event.content);
      if (decrypted) {
        isEncrypted = true;
        title = decrypted.title || 'Encrypted Entry';
        url = decrypted.url || '';
        type = decrypted.type || 'other';
        description = decrypted.description || '';
        tags = Array.isArray(decrypted.tags) ? decrypted.tags : [];
        lang = decrypted.lang || 'en';
      }
    }

    if (!isEncrypted) {
      const findTag = (tagName: string) => {
        const match = event.tags.find((t: string[]) => t[0] === tagName);
        return match ? match[1] : undefined;
      };

      const urlTag = findTag('url') || findTag('magnet') || findTag('r');
      const titleTag = findTag('title') || findTag('subject');
      const typeTag = (findTag('type') || findTag('c')) as ContentType;

      if (!urlTag && !event.content) return null;

      url = urlTag || event.content;
      title = titleTag || event.content.substring(0, 60) || 'Untitled Entry';
      description = event.content || '';
      tags = event.tags
        .filter((t: string[]) => t[0] === 't')
        .map((t: string[]) => t[1].toLowerCase());
      lang = findTag('lang') || findTag('l') || 'en';
      type = typeTag || 'other';

      if (!typeTag) {
        if (url.startsWith('magnet:?')) type = 'torrent';
        else if (url.includes('.onion')) type = 'onion';
        else if (url.startsWith('ipfs://') || url.includes('/ipfs/')) type = 'ipfs';
        else if (
          /\.(mp4|webm|mkv|avi|mov|m4v)$/i.test(url) ||
          url.includes('youtube.com') ||
          url.includes('youtu.be') ||
          url.includes('peertube') ||
          url.includes('odysee.com') ||
          url.includes('vimeo.com') ||
          url.includes('bitchute.com') ||
          url.includes('rumble.com')
        ) type = 'video';
        else if (/\.(mp3|ogg|wav|flac|aac|m4a)$/i.test(url)) type = 'mp3';
        else if (url.endsWith('.pdf')) type = 'pdf';
        else if (url.startsWith('http://') || url.startsWith('https://')) type = 'web';
      }
    }

    const sizeTag = event.tags.find((t: string[]) => t[0] === 'size')?.[1];

    let npub = event.pubkey;
    try {
      npub = nip19.npubEncode(event.pubkey);
    } catch (e) {
      // keep raw
    }

    return {
      id: event.id,
      pubkey: npub,
      title,
      url,
      type,
      description,
      tags,
      createdAt: event.created_at,
      lang,
      size: sizeTag,
      upvotes: 1,
      userVoted: this.localVotes.has(event.id),
      relaySource: relayUrl,
      rawEvent: event,
      isEncrypted,
    };
  }

  public toggleVote(itemId: string): boolean {
    if (this.localVotes.has(itemId)) {
      this.localVotes.delete(itemId);
      this.saveVotesToStorage();
      return false;
    } else {
      this.localVotes.add(itemId);
      this.saveVotesToStorage();
      return true;
    }
  }

  public isVoted(itemId: string): boolean {
    return this.localVotes.has(itemId);
  }

  public async broadcastEvent(event: any): Promise<{ relay: string; success: boolean; msg?: string }[]> {
    const results: { relay: string; success: boolean; msg?: string }[] = [];
    const eventJson = JSON.stringify(['EVENT', event]);

    const activeEntries = Array.from(this.sockets.entries()).filter(([_, ws]) => ws.readyState === WebSocket.OPEN);

    if (activeEntries.length === 0) {
      throw new Error('No active WebSocket connection to relays');
    }

    const promises = activeEntries.map(([url, ws]) => {
      return new Promise<{ relay: string; success: boolean; msg?: string }>((resolve) => {
        let resolved = false;

        const handleMsg = (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (Array.isArray(data) && data[0] === 'OK' && data[1] === event.id) {
              if (!resolved) {
                resolved = true;
                ws.removeEventListener('message', handleMsg);
                resolve({ relay: url, success: data[2], msg: data[3] || 'OK' });
              }
            }
          } catch (err) {
            // ignore JSON parse error
          }
        };

        ws.addEventListener('message', handleMsg);
        ws.send(eventJson);

        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            ws.removeEventListener('message', handleMsg);
            resolve({ relay: url, success: true, msg: 'Sent (timeout waiting for OK ack)' });
          }
        }, 2000);
      });
    });

    return await Promise.all(promises);
  }

  public async publishIndexItem(
    user: NostrUser,
    itemData: {
      title: string;
      url: string;
      type: ContentType;
      description: string;
      tags: string[];
      lang: string;
    },
    encrypt = true
  ): Promise<IndexedItem> {
    const createdAt = Math.floor(Date.now() / 1000);
    let contentPayload = itemData.description;
    const formattedTags: string[][] = [
      ['d', NOSTRA_D_TAG],
      ['lang', itemData.lang],
    ];

    if (encrypt) {
      const payloadToEncrypt = {
        title: itemData.title,
        url: itemData.url,
        type: itemData.type,
        description: itemData.description,
        tags: itemData.tags,
        lang: itemData.lang,
      };
      contentPayload = await encryptNostraPayload(payloadToEncrypt);
      formattedTags.push(['enc', 'v1']);
      formattedTags.push(['t', 'nostra-encrypted']);
      formattedTags.push(['t', itemData.type]);
    } else {
      formattedTags.push(['title', itemData.title]);
      formattedTags.push(['url', itemData.url]);
      formattedTags.push(['type', itemData.type]);
      itemData.tags.forEach((t) => {
        formattedTags.push(['t', t.toLowerCase().trim()]);
      });
    }

    const unsignedEvent = {
      kind: NOSTRA_EVENT_KIND,
      created_at: createdAt,
      tags: formattedTags,
      content: contentPayload,
      pubkey: user.pubkey,
    };

    let signedEvent: any = null;

    if (user.method === 'extension' && (window as any).nostr) {
      signedEvent = await (window as any).nostr.signEvent(unsignedEvent);
    } else if (user.nsec) {
      let secretKeyBytes: Uint8Array;
      if (user.nsec.startsWith('nsec1')) {
        const decoded = nip19.decode(user.nsec);
        secretKeyBytes = decoded.data as Uint8Array;
      } else {
        // Hex secret key
        const hex = user.nsec;
        secretKeyBytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
      }
      signedEvent = finalizeEvent(unsignedEvent, secretKeyBytes);
    } else {
      throw new Error('User key required to sign event');
    }

    await this.broadcastEvent(signedEvent);

    let npub = user.pubkey;
    try {
      npub = nip19.npubEncode(user.pubkey);
    } catch (e) {
      // ignore
    }

    const newItem: IndexedItem = {
      id: signedEvent.id,
      pubkey: npub,
      title: itemData.title,
      url: itemData.url,
      type: itemData.type,
      description: itemData.description,
      tags: itemData.tags,
      createdAt,
      lang: itemData.lang,
      upvotes: 1,
      userVoted: true,
      rawEvent: signedEvent,
      isEncrypted: encrypt,
    };

    return newItem;
  }
}

// User Authentication & Key Utilities
export function generateTestNostrUser(): NostrUser {
  const sk = generateSecretKey();
  const pk = getPublicKey(sk);
  const nsec = nip19.nsecEncode(sk);
  const npub = nip19.npubEncode(pk);

  return {
    pubkey: pk,
    npub,
    nsec,
    method: 'generated',
    name: 'Nostra User ' + npub.substring(5, 10),
  };
}

export function parseNsecUser(nsecInput: string): NostrUser {
  const trimmed = nsecInput.trim();
  let skBytes: Uint8Array;

  if (trimmed.startsWith('nsec1')) {
    const decoded = nip19.decode(trimmed);
    if (decoded.type !== 'nsec') {
      throw new Error('Invalid nsec prefix');
    }
    skBytes = decoded.data as Uint8Array;
  } else if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    skBytes = new Uint8Array(trimmed.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
  } else {
    throw new Error('Invalid secret key format');
  }

  const pk = getPublicKey(skBytes);
  const npub = nip19.npubEncode(pk);
  const nsec = nip19.nsecEncode(skBytes);

  return {
    pubkey: pk,
    npub,
    nsec,
    method: 'nsec',
    name: 'Nostra User ' + npub.substring(5, 10),
  };
}

export const nostrRelayManager = new NostrRelayManager();
