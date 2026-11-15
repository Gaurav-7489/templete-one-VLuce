import type { Metadata } from "next";
import Link from "next/link";
import { ConnectForm } from "@/components/ConnectForm";
import { connectable, getConnection, intelligenceUrl, websiteKey } from "@/lib/vandlabs/connection";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Intelligence connection", robots: { index: false, follow: false } };

/** Older Intelligence deployments only: the owner signed in here with an Intelligence password. Off unless explicitly enabled. */
const passwordConnect = () => process.env.LEGACY_PASSWORD_CONNECT?.trim().toLowerCase() === "enabled";

/**
 * For the dealership and VandLabs. Not linked from the site. Shows whether this website is linked to a VandLabs Automotive
 * Intelligence workspace. Linking is done by VandLabs (Intelligence admin console → dealership → Website), which issues a key
 * for this website's hosting settings. Nobody enters a password here.
 */
export default async function ConnectPage() {
  const base = intelligenceUrl();
  const key = websiteKey();
  const connection = base && key ? await getConnection() : null;
  const legacy = passwordConnect() && connectable();
  return (
    <section className="page-hero">
      <div className="wrap">
        <div className="page-hero__row">
          <ol className="crumbs" aria-label="Breadcrumb">
            <li><Link href="/">Home</Link></li>
            <li aria-current="page">Intelligence</li>
          </ol>
          <h1 className="display h-xl">Intelligence <em>connection</em></h1>
          <p className="lead">When this website is linked to the dealership&apos;s VandLabs Automotive Intelligence workspace, it shows the cars published there and sends enquiries to the dealership&apos;s leads.</p>
        </div>
        <div className="connect">
          {legacy ? (
            <ConnectForm connected={connection ? { dealership: connection.dealership, site: connection.site, expiresAt: connection.expiresAt } : null} intelligence={new URL(base).host} />
          ) : (
            <div className="connect__card">
              <div className="connect__status" role="status">
                <span className="connect__dot" data-on={!!connection} />
                {connection ? `Linked to ${connection.dealership || "the dealership's workspace"}` : base && key ? "Not linked (the key was not accepted)" : "Not linked"}
              </div>
              {connection ? (
                <dl>
                  <dt>Intelligence</dt><dd>{new URL(base).host}</dd>
                  {connection.site && <><dt>Website</dt><dd>{connection.site}</dd></>}
                  {connection.expiresAt && <><dt>Renew by</dt><dd>{new Date(connection.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</dd></>}
                </dl>
              ) : (
                <p className="muted">
                  VandLabs links this website from the Intelligence admin console (dealership → Website). It issues a key once; set
                  {" "}<code>VANDLABS_API_URL</code> (the Intelligence address) and <code>VANDLABS_API_KEY</code> (the key) in this website&apos;s hosting
                  settings and redeploy. To unlink, VandLabs revokes the key. Questions: contact VandLabs support.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
