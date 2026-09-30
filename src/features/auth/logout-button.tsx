"use client";
export function LogoutButton() { return <button className="text-button" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.assign("/"); }}>Log out</button>; }
