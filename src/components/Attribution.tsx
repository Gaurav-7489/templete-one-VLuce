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
        sessionStorage.setItem(KEY, JSON.stringify({ source: new URL(document.referrer).hostname.replace(/^www\./, "").split(".")[0], medium: "referral" }));
      }
    } catch {
      /* storage unavailable */
    }
  }, []);
  return null;
}

export function readAttribution(): { utmSource?: string; utmMedium?: string; utmCampaign?: string } {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) ?? "{}");
    return { utmSource: v.source ?? undefined, utmMedium: v.medium ?? undefined, utmCampaign: v.campaign ?? undefined };
  } catch {
    return {};
  }
}
