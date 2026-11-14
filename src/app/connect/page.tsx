import type { Metadata } from "next";
import Link from "next/link";
import { ConnectForm } from "@/components/ConnectForm";
import { connectable, getConnection, intelligenceUrl } from "@/lib/vandlabs/connection";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Connect to Intelligence", robots: { index: false, follow: false } };

/** For the dealership only. Not linked from the site. */
export default async function ConnectPage() {
  const ready = connectable();
  const connection = ready ? await getConnection() : null;
  return (
    <section className="page-hero">
      <div className="wrap">
        <div className="page-hero__row">
          <ol className="crumbs" aria-label="Breadcrumb">
            <li><Link href="/">Home</Link></li>
            <li aria-current="page">Connect</li>
          </ol>
          <h1 className="display h-xl">Connect to <em>Intelligence</em></h1>
          <p className="lead">For the dealership owner. Sign in with your VandLabs Automotive Intelligence email, and this website will show the cars you publish there and send enquiries to your leads.</p>
        </div>
        <div className="connect">
          {ready ? (
            <ConnectForm connected={connection ? { dealership: connection.dealership, site: connection.site, expiresAt: connection.expiresAt } : null} intelligence={new URL(intelligenceUrl()).host} />
          ) : (
            <div className="connect__card">
              <div className="connect__status"><span className="connect__dot" /> Not set up</div>
              <p className="muted">This website does not have an Intelligence address yet. In the hosting settings, add <code>VANDLABS_API_URL</code> (your Intelligence address) and <code>WEBSITE_SECRET</code> (any random text, at least 24 characters), redeploy, and return to this page.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
