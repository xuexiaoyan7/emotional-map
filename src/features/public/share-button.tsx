"use client";

import { useState } from "react";

export function ShareButton({ path }: { path: string }) {
  const [message, setMessage] = useState("");
  async function share() {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (navigator.share) await navigator.share({ title: "Emotional Map", url });
      else { await navigator.clipboard.writeText(url); setMessage("Link copied."); }
    } catch (error) { if ((error as Error).name !== "AbortError") setMessage("Unable to share this link."); }
  }
  return <span className="share-control"><button type="button" onClick={share}>Share</button>{message && <span role="status">{message}</span>}</span>;
}
