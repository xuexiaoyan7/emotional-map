"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OnboardingForm({ initialName = "" }: { initialName?: string }) {
  const router = useRouter(); const [displayName, setDisplayName] = useState(initialName); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); setBusy(true); setError(""); try { const response = await fetch("/api/account/onboarding", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ displayName }) }); const result = await response.json(); if (!response.ok) return setError(result.error); router.push("/"); router.refresh(); } catch { setError("Unable to name your map right now. Check your connection and try again."); } finally { setBusy(false); } }
  return <form className="auth-form" onSubmit={submit}><label>Display name<input required value={displayName} maxLength={60} onChange={(event) => setDisplayName(event.target.value)} placeholder="How should your map be signed?" autoComplete="name" /></label><p className="quiet-note">This becomes the name on your public map. You can share only the memories you choose.</p>{error && <p role="alert" className="form-error">{error}</p>}<button className="primary-action" disabled={busy}>{busy ? "Naming your map…" : "Continue"}</button></form>;
}
