"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Chevron } from "./icons";
import { Photo } from "./Photo";

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const n = images.length;
  const go = useCallback((d: number) => setOpen((i) => (i == null ? i : (i + d + n) % n)), [n]);
  const show = (i: number) => {
    lastFocus.current = document.activeElement as HTMLElement;
    setOpen(i);
  };
  const close = () => {
    setOpen(null);
    lastFocus.current?.focus();
  };

  useEffect(() => {
    if (open == null) return;
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, go]);

  const touch = useRef<number | null>(null);
  const tiles = images.length ? images.slice(0, 3) : [""];

  return (
    <>
      <div className="gallery">
        {tiles.map((src, i) => (
          <button key={i} type="button" className="gallery__item" onClick={() => n && show(i)} aria-label={n ? `Open photo ${i + 1} of ${n}` : "No photos yet"}>
            <Photo src={src || undefined} alt={`${title} — photo ${i + 1}`} label={i === 0 ? title : undefined} priority={i === 0} />
            {i === tiles.length - 1 && n > 3 && <span className="badge gallery__more">+{n - 3} photos</span>}
          </button>
        ))}
        {/* On mobile the strip scrolls through every photo. */}
        {images.slice(3).map((src, i) => (
          <button key={src + i} type="button" className="gallery__item gallery__item--extra" onClick={() => show(i + 3)} aria-label={`Open photo ${i + 4} of ${n}`}>
            <Photo src={src} alt={`${title} — photo ${i + 4}`} />
          </button>
        ))}
      </div>

      {open != null && (
        <div
          className="lightbox"
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
            <button ref={closeRef} type="button" className="menu__close" style={{ position: "static" }} onClick={close}>
              Close <span aria-hidden="true" />
            </button>
          </div>
          <div className="lightbox__stage">
            <Photo key={open} src={images[open]} alt={`${title} — photo ${open + 1}`} label={title} />
            {n > 1 && (
              <>
                <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={() => go(-1)} aria-label="Previous photo"><Chevron dir="left" /></button>
                <button type="button" className="lightbox__nav lightbox__nav--next" onClick={() => go(1)} aria-label="Next photo"><Chevron /></button>
              </>
            )}
          </div>
          <div className="lightbox__thumbs">
            {images.map((src, i) => (
              <button key={src + i} type="button" aria-current={i === open} onClick={() => setOpen(i)} aria-label={`Photo ${i + 1}`}>
                <Photo src={src} alt="" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
