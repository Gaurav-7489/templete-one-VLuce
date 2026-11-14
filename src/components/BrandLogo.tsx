import { brandLogos } from "@/data/brand-logos";

/**
 * A make's logo, or its name when no logo is available.
 * Logos come from src/data/brand-logos.ts (generated from Simple Icons). To use a dealer-supplied
 * file instead, add it to `customLogos` below, e.g. { "Land Rover": "/brands/land-rover.svg" }.
 * Logos are trademarks of their owners and identify the makes the dealership offers.
 */
const customLogos: Record<string, string> = {};

export function BrandLogo({ brand, className = "blogo" }: { brand: string; className?: string }) {
  const src = customLogos[brand];
  if (src) return <img className={className} src={src} alt={brand} loading="lazy" />;
  const path = brandLogos[brand];
  if (!path) return <span className={`${className} ${className}--text`}>{brand}</span>;
  return (
    <svg className={className} viewBox="0 0 24 24" role="img" aria-label={brand} fill="currentColor">
      <title>{brand}</title>
      <path d={path} />
    </svg>
  );
}
