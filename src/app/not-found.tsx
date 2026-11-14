import Link from "next/link";
import { Arrow } from "@/components/icons";

export default function NotFound() {
  return (
    <section className="nf">
      <div>
        <span className="eyebrow eyebrow--plain">404</span>
        <h1 className="display h-xl" style={{ marginTop: 20 }}>This road <em>leads nowhere.</em></h1>
        <p className="lead" style={{ margin: "24px auto 40px" }}>The page or vehicle you were looking for is no longer here. It may have found a new home.</p>
        <Link href="/collection" className="btn">Explore Collection <Arrow /></Link>
      </div>
    </section>
  );
}
