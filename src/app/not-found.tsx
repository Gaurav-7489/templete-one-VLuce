import Link from "next/link";

export default function NotFound() {
  return (
    <section className="nf">
      <div className="empty">
        <h1 className="display h-xl">Page not found</h1>
        <p>The page or car you were looking for is no longer here. It may have found a new home.</p>
        <Link href="/collection" className="btn">Explore All</Link>
      </div>
    </section>
  );
}
