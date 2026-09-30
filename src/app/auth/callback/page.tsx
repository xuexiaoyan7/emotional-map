"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    void (async () => {
      try {
        const accessToken = new URLSearchParams(window.location.hash.slice(1)).get("access_token");
        if (!accessToken) {
          setMessage("That sign-in link is incomplete or has expired. Please request a new one.");
          return;
        }
        const response = await fetch("/api/auth/magic-link", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ accessToken, linkCurrentUser: new URLSearchParams(window.location.search).get("link") === "1" }),
        });
        const body = await response.json();
        if (!response.ok) {
          setMessage(body.error ?? "Unable to complete sign-in right now.");
          return;
        }
        router.replace(body.needsOnboarding ? "/onboarding" : "/");
        router.refresh();
      } catch {
        setMessage("Unable to complete sign-in right now. Please try again.");
      }
    })();
  }, [router]);

  return <main className="auth-page"><Link className="wordmark" href="/">Emotional Map</Link><section><p className="eyebrow">One moment</p><h1>Opening your map.</h1><p className="quiet-note" role="status">{message}</p>{message !== "Signing you in…" && <p><Link className="text-button" href="/login">Return to sign in</Link></p>}</section></main>;
}
