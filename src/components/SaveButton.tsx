"use client";

import { Heart } from "./icons";
import { useShortlist } from "./shortlist";

export function SaveButton({ slug, title, inline = false }: { slug: string; title: string; inline?: boolean }) {
  const { has, toggle } = useShortlist();
  const saved = has(slug);
  return (
    <button
      type="button"
      className={`save-btn ${inline ? "save-btn--inline" : ""}`}
      aria-pressed={saved}
      aria-label={inline ? undefined : saved ? `Remove ${title} from shortlist` : `Save ${title} to shortlist`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
      }}
    >
      <Heart fill={saved ? "currentColor" : "none"} />
      {inline && <span>{saved ? "Saved" : "Save"}</span>}
    </button>
  );
}
