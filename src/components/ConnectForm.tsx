"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Connected = { dealership: string; site: string; expiresAt: string | null } | null;

export function ConnectForm({ connected, intelligence }: { connected: Connected; intelligence: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needCode, setNeedCode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const action = connected ? "disconnect" : "connect";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, email, password, code: needCode ? code : undefined }) }).catch(() => null);
    const body = (await res?.json().catch(() => ({}))) as { ok?: boolean; message?: string; code?: string; dealership?: string };
    setBusy(false);
    if (res?.ok) {
      setPassword("");
      setCode("");
      setNeedCode(false);
      setDone(action === "connect" ? `Connected to ${body.dealership || "your workspace"}. Your published cars now appear on this website.` : "Disconnected. This website shows its demo collection again.");
      router.refresh();
      return;
    }
    if (body?.code === "mfa_required") setNeedCode(true);
    setError(body?.message ?? "We could not reach this website's server. Try again.");
  }

  return (
    <div className="connect__card">
      <div className="connect__status" role="status">
        <span className="connect__dot" data-on={!!connected} />
        {connected ? `Connected to ${connected.dealership || "your workspace"}` : "Not connected"}
      </div>
      {connected ? (
        <dl>
          <dt>Intelligence</dt><dd>{intelligence}</dd>
          <dt>Website</dt><dd>{connected.site}</dd>
          {connected.expiresAt && <><dt>Renew by</dt><dd>{new Date(connected.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</dd></>}
        </dl>
      ) : (
        <p className="muted" style={{ margin: "0 0 24px" }}>Showing the demo collection. Connect to show your own stock from {intelligence}.</p>
      )}
      {done && <p className="notice" role="status" style={{ marginBottom: 20 }}>{done}</p>}
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>Intelligence email</span>
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {needCode && (
          <label className="field">
            <span>6-digit code from your authenticator app</span>
            <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required value={code} onChange={(e) => setCode(e.target.value)} />
          </label>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className={`btn btn--block ${connected ? "btn--ghost" : ""}`} disabled={busy}>
          {busy ? "Please wait…" : connected ? "Disconnect" : "Connect Website"}
        </button>
        <p className="muted" style={{ fontSize: 13 }}>Only the workspace owner can do this. Your password goes to Intelligence and is not stored on this website. The link can also be ended in Intelligence → Settings → API.</p>
      </form>
    </div>
  );
}
