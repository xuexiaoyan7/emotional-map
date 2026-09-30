"use client";

import { useState } from "react";

export function LoginForm({ linkCurrentUser = false }: { linkCurrentUser?: boolean }) {
  const [email, setEmail] = useState(""); const [requested, setRequested] = useState(false); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function requestLink(event: React.FormEvent) { event.preventDefault(); setBusy(true); setError(""); try { const result = await fetch("/api/auth/request-code", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, linkCurrentUser }) }); const body = await result.json(); if (!result.ok) return setError(body.error); setRequested(true); } catch { setError("Unable to request a sign-in link right now. Check your connection and try again."); } finally { setBusy(false); } }
  return <form className="auth-form" onSubmit={requestLink}>
    {linkCurrentUser && <p className="quiet-note">Verify an email to keep this existing map available after you sign out.</p>}
    <label>Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
    {requested && <p className="quiet-note" role="status">Check your inbox and open the secure sign-in link. It can be used once.</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
    <button className="primary-action" disabled={busy}>{busy ? "Sending…" : requested ? "Send another link" : "Email me a sign-in link"}</button>
  </form>;
}
