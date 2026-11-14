"use client";

import { useSyncExternalStore } from "react";

/** Shortlist of saved vehicles, kept in this browser only. */
const KEY = "vluce:shortlist";
const listeners = new Set<() => void>();
let cache: string[] | null = null;

function read(): string[] {
  if (cache) return cache;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(v) ? v.filter((s) => typeof s === "string") : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: string[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: keep in memory for this visit */
  }
  listeners.forEach((l) => l());
}

const EMPTY: string[] = [];
const subscribe = (l: () => void) => {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
};

export function useShortlist() {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    list,
    has: (slug: string) => list.includes(slug),
    toggle: (slug: string) => write(list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]),
    clear: () => write([]),
  };
}
