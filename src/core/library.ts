import type { MediaAsset } from "./types";

const STORAGE_KEY = "mochi.media-library.v1";

export class MediaLibrary {
  private assets: MediaAsset[] = [];

  constructor() {
    this.assets = this.load();
  }

  list(): MediaAsset[] {
    return [...this.assets].sort((a, b) => b.createdAt - a.createdAt);
  }

  add(asset: MediaAsset): void {
    const existing = this.assets.findIndex((item) => item.id === asset.id);
    if (existing >= 0) this.assets[existing] = asset;
    else this.assets.push(asset);
    this.save();
  }

  remove(id: string): void {
    this.assets = this.assets.filter((asset) => asset.id !== id);
    this.save();
  }

  byKind(kind: MediaAsset["kind"]): MediaAsset[] {
    return this.list().filter((asset) => asset.kind === kind);
  }

  private load(): MediaAsset[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as MediaAsset[]) : [];
    } catch {
      return [];
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.assets));
  }
}
