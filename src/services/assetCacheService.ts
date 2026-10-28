import { Scene, VideoProject } from '../types/video';

export interface AssetCacheEntry {
  key: string;
  type: 'image' | 'audio' | 'scene_clip' | 'captions';
  path: string;
  url: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface AssetCacheManifest {
  version: string;
  entries: Record<string, AssetCacheEntry>;
}

/**
 * Fast simple 32-bit FNV-1a hash generator (browser and node safe)
 */
export function simpleHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * Compute a deterministic composite hash for image generation requests.
 */
export function getImageCacheKey(
  prompt: string,
  style: string = 'cinematic',
  aspectRatio: string = '9:16'
): string {
  const normalized = `${prompt.trim().toLowerCase()}_${style.trim().toLowerCase()}_${aspectRatio.trim()}`;
  return `img_${simpleHash(normalized)}`;
}

/**
 * Compute a deterministic composite hash for voice generation requests.
 */
export function getAudioCacheKey(
  text: string,
  voiceId: string = 'male_educational',
  speed: number = 1.0
): string {
  const normalized = `${text.trim().toLowerCase()}_${voiceId.trim().toLowerCase()}_${speed.toFixed(2)}`;
  return `voice_${simpleHash(normalized)}`;
}

/**
 * Compute a deterministic hash for a full scene to enable scene-level incremental rendering.
 * If image, animation, transition, glitch, duration, and audio remain unchanged, the scene hash matches.
 */
export function getSceneHash(scene: Scene): string {
  const composite = [
    scene.id,
    scene.imageUrl || scene.image_prompt,
    scene.audioUrl || scene.narration,
    scene.duration,
    scene.animation,
    scene.transition,
    scene.glitchEffect || 'none',
    (scene.glitchTriggers || []).map((t) => `${t.timeOffset}:${t.duration}:${t.effect}`).join(','),
    scene.cropMode || 'cover',
  ].join('|');
  return `scene_${scene.id}_${simpleHash(composite)}`;
}

/**
 * Compute overall project timeline hash for fast cache verification.
 */
export function getProjectHash(project: VideoProject): string {
  const sceneHashes = project.scenes.map(getSceneHash).join('-');
  const base = `${project.id}_${project.project.musicTrackId}_${project.captions.enabled}_${sceneHashes}`;
  return `proj_${simpleHash(base)}`;
}

class AssetCacheService {
  private memoryCache: Map<string, AssetCacheEntry> = new Map();
  private storageKey = 'faceless_asset_cache_manifest_v1';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const manifest: AssetCacheManifest = JSON.parse(data);
        for (const [k, v] of Object.entries(manifest.entries)) {
          this.memoryCache.set(k, v);
        }
      }
    } catch {
      // ignore
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      const entries: Record<string, AssetCacheEntry> = {};
      this.memoryCache.forEach((v, k) => {
        entries[k] = v;
      });
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({ version: '1.0', entries } as AssetCacheManifest)
      );
    } catch {
      // ignore
    }
  }

  has(key: string): boolean {
    return this.memoryCache.has(key);
  }

  get(key: string): AssetCacheEntry | undefined {
    const entry = this.memoryCache.get(key);
    if (entry) {
      console.log(`[AssetCache] Reusing cached asset: ${key} -> ${entry.url}`);
    }
    return entry;
  }

  set(
    key: string,
    type: AssetCacheEntry['type'],
    path: string,
    url: string,
    metadata?: Record<string, any>
  ): void {
    const entry: AssetCacheEntry = {
      key,
      type,
      path,
      url,
      createdAt: new Date().toISOString(),
      metadata,
    };
    this.memoryCache.set(key, entry);
    this.saveToStorage();
    console.log(`[AssetCache] Cached new asset: ${key} (${type})`);
  }

  clear(): void {
    this.memoryCache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  getAll(): AssetCacheEntry[] {
    return Array.from(this.memoryCache.values());
  }
}

export const assetCache = new AssetCacheService();
