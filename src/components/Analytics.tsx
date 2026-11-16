"use client";

import { useEffect } from "react";
import { readAttribution } from "./Attribution";

const SID_KEY = "vluce:sid";
const SENT_KEY = "vluce:visit";

/** Visitors who ask not to be tracked (Do Not Track or Global Privacy Control) are not counted at all. */
const optedOut = () => {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean; doNotTrack?: string };
  return n.globalPrivacyControl === true || n.doNotTrack === "1";
};

function sid(): string | null {
  try {
    let v = sessionStorage.getItem(SID_KEY);
    if (!v) {
      v = crypto.randomUUID().replace(/-/g, "");
      sessionStorage.setItem(SID_KEY, v);
    }
    return v;
  } catch {
    return null;
  }
}

const device = () => (window.matchMedia("(max-width: 640px)").matches ? "mobile" : window.matchMedia("(max-width: 1024px)").matches ? "tablet" : "desktop");

export function track(type: "visit" | "vehicle_view" | "whatsapp_click" | "call_click", extra: { stockId?: string } = {}) {
  if (typeof window === "undefined" || optedOut()) return;
  const id = sid();
  if (!id) return;
  const a = readAttribution();
  const body = JSON.stringify({ events: [{ type, sid: id, stockId: extra.stockId, source: a.utmSource, medium: a.utmMedium, campaign: a.utmCampaign, device: device() }] });
  try {
    if (!navigator.sendBeacon?.("/api/analytics", new Blob([body], { type: "application/json" }))) void fetch("/api/analytics", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
  } catch {
    /* never affects the page */
  }
}

/**
 * First-party, cookieless counting: one visit per browser tab, car views, and clicks on WhatsApp or call links. Clicks are
 * counted as clicks, never as enquiries. Nothing is sent to a third party; the site's server forwards counts to Intelligence
 * only when the dealership has connected it.
 */
export function Analytics() {
  useEffect(() => {
    try {
      if (!sessionStorage.getItem(SENT_KEY)) {
        // Wait a tick so Attribution has stored the campaign tags from the landing URL.
        setTimeout(() => track("visit"), 0);
        sessionStorage.setItem(SENT_KEY, "1");
      }
    } catch {
      /* storage unavailable */
    }
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const stockId = a.closest<HTMLElement>("[data-stock-id]")?.dataset.stockId;
      if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(a.href)) track("whatsapp_click", { stockId });
      else if (a.href.startsWith("tel:")) track("call_click", { stockId });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}

/** Counts one view of a car page per tab. */
export function TrackView({ stockId }: { stockId: string }) {
  useEffect(() => {
    track("vehicle_view", { stockId });
  }, [stockId]);
  return null;
}
