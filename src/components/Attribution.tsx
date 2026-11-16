"use client";

import { useEffect } from "react";

const KEY = "vluce:utm";

/** Remembers the campaign tags a visitor first arrived with, so a later enquiry is attributed correctly. */
export function Attribution() {
  useEffect(() => {
    try {
      const p = new URLSearchParams(location.search);
      const utm = { source: p.get("utm_source"), medium: p.get("utm_medium"), campaign: p.get("utm_campaign") };
      if (utm.source || utm.campaign) sessionStorage.setItem(KEY, JSON.stringify(utm));
      else if (!sessionStorage.getItem(KEY) && document.referrer && !document.referrer.startsWith(location.origin)) {
        const host = new URL(document.referrer).hostname.replace(/^www\./, "");
        sessionStorage.setItem(KEY, JSON.stringify({ source: host.split(".")[0], medium: "referral", referrer: host }));
      }
    } catch {
      /* storage unavailable */
    }
  }, []);
  return null;
}

export function readAttribution(): { utmSource?: string; utmMedium?: string; utmCampaign?: string; referrer?: string } {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) ?? "{}");
    return { utmSource: v.source ?? undefined, utmMedium: v.medium ?? undefined, utmCampaign: v.campaign ?? undefined, referrer: v.referrer ?? undefined };
  } catch {
    return {};
  }
}
