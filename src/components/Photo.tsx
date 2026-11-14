"use client";

import { useState } from "react";
import { CarLine } from "./icons";

type Props = {
  src?: string;
  alt: string;
  /** Shown in the designed fallback when no image is available or it fails to load. */
  label?: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
  shade?: boolean;
};

/**
 * Image with a designed fallback. Dealership photography should always be supplied,
 * but a missing or failed image never leaves a broken frame: the studio backdrop shows instead.
 */
export function Photo({ src, alt, label, priority, className = "", shade }: Props) {
  const [state, setState] = useState<"loading" | "loaded" | "error">(src ? "loading" : "error");
  return (
    <div className={`photo ${shade ? "photo--shade" : ""} ${className}`}>
      {state !== "loaded" && (
        <div className="photo__fallback" aria-hidden="true">
          {state === "error" && (
            <>
              <CarLine />
              {label && <span>{label}</span>}
            </>
          )}
        </div>
      )}
      {src && state !== "error" && (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          data-loaded={state === "loaded"}
          ref={(el) => {
            if (el?.complete && el.naturalWidth > 0 && state === "loading") setState("loaded");
          }}
          onLoad={() => setState("loaded")}
          onError={() => setState("error")}
        />
      )}
    </div>
  );
}
