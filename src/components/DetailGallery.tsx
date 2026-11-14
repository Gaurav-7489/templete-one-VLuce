"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Chevron } from "./icons";
import { Photo } from "./Photo";

/** Exterior / Interior tabs, two large frames, thumbnails, fullscreen viewer and photo download. */
export function DetailGallery({ exterior, interior, title, fileBase }: { exterior: string[]; interior: string[]; title: string; fileBase: string }) {
  const [tab, setTab] = useState<"exterior" | "interior">("exterior");
  const [open, setOpen] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const imgs = tab === "exterior" ? exterior : interior;
  const n = imgs.length;
  const go = useCallback((d: number) => setOpen((i) => (i == null ? i : (i + d + n) % n)), [n]);
  const touch = useRef<number | null>(null);

  useEffect(() => {
    if (open == null) return;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, go]);

  async function download() {
    setBusy(true);
    const all = [...exterior, ...interior];
    for (let i = 0; i < all.length; i++) {
      try {
        const blob = await (await fetch(all[i], { mode: "cors" })).blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${fileBase}-${String(i + 1).padStart(2, "0")}.jpg`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      } catch {
        window.open(all[i], "_blank", "noopener");
      }
    }
    setBusy(false);
  }

  const big = imgs.slice(0, 2);
  const thumbs = imgs.slice(2);

  return (
    <div className="dg">
      <div className="dg__bar">
        <div className="dg__tabs" role="tablist" aria-label="Photo type">
          {(["exterior", "interior"] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} disabled={t === "interior" && !interior.length} onClick={() => setTab(t)}>
              {t === "exterior" ? "Exterior" : "Interior"}
            </button>
          ))}
        </div>
        {exterior.length + interior.length > 0 && (
          <button type="button" className="dg__dl" onClick={download} disabled={busy}>
            {busy ? "Preparing…" : "Download Photos"}
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" /></svg>
          </button>
        )}
      </div>
      <div className="dg__big">
        {(big.length ? big : [""]).map((src, i) => (
          <button key={src + i} type="button" className="dg__frame" onClick={() => src && setOpen(i)} aria-label={src ? `Open photo ${i + 1} of ${n}` : "No photos yet"}>
            <Photo src={src || undefined} alt={`${title} — ${tab} photo ${i + 1}`} label={title} priority={i === 0} />
          </button>
        ))}
      </div>
      {thumbs.length > 0 && (
        <div className="dg__thumbs">
          {thumbs.map((src, i) => (
            <button key={src + i} type="button" className="dg__thumb" onClick={() => setOpen(i + 2)} aria-label={`Open photo ${i + 3} of ${n}`}>
              <Photo src={src} alt="" />
            </button>
          ))}
        </div>
      )}

      {open != null && (
        <div
          className="lightbox"
          data-lenis-prevent
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photos`}
          onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touch.current == null) return;
            const dx = e.changedTouches[0].clientX - touch.current;
            if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
            touch.current = null;
          }}
        >
          <div className="lightbox__bar">
            <span className="num">{String(open + 1).padStart(2, "0")} / {String(n).padStart(2, "0")} · {title}</span>
            <button type="button" className="menu__close" style={{ position: "static" }} onClick={() => setOpen(null)} autoFocus>
              Close <span aria-hidden="true" />
            </button>
          </div>
          <div className="lightbox__stage">
            <Photo key={imgs[open]} src={imgs[open]} alt={`${title} — photo ${open + 1}`} label={title} />
            {n > 1 && (
              <>
                <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={() => go(-1)} aria-label="Previous photo"><Chevron dir="left" /></button>
                <button type="button" className="lightbox__nav lightbox__nav--next" onClick={() => go(1)} aria-label="Next photo"><Chevron /></button>
              </>
            )}
          </div>
          <div className="lightbox__thumbs">
            {imgs.map((src, i) => (
              <button key={src + i} type="button" aria-current={i === open} onClick={() => setOpen(i)} aria-label={`Photo ${i + 1}`}>
                <Photo src={src} alt="" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
