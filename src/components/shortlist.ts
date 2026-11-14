"use client";

import { useSyncExternalStore } from "react";

/** Small per-browser lists (shortlist, compare) kept in localStorage. */
function createStore(key: string, max = Infinity) {
  const listeners = new Set<() => void>();
  let cache: string[] | null = null;
  const EMPTY: string[] = [];
  const read = () => {
    if (cache) return cache;
    try {
      const v = JSON.parse(localStorage.getItem(key) ?? "[]");
      cache = Array.isArray(v) ? v.filter((s) => typeof s === "string") : [];
    } catch {
      cache = [];
    }
    return cache;
  };
  const write = (next: string[]) => {
    cache = next.slice(-max);
    try {
      localStorage.setItem(key, JSON.stringify(cache));
    } catch {
      /* storage unavailable: keep in memory */
    }
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
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
  return function useList() {
    const list = useSyncExternalStore(subscribe, read, () => EMPTY);
    return {
      list,
      max,
      has: (slug: string) => list.includes(slug),
      toggle: (slug: string) => write(list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]),
      remove: (slug: string) => write(list.filter((s) => s !== slug)),
      clear: () => write([]),
    };
  };
}

export const useShortlist = createStore("vluce:shortlist");
/** Up to three cars side by side. Adding a fourth drops the oldest. */
export const useCompare = createStore("vluce:compare", 3);
