import Link from "next/link";
import { LoginForm } from "@/features/auth/login-form";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ link?: string }> }) { const { link } = await searchParams; const linkCurrentUser = link === "1"; return <main className="auth-page"><Link className="wordmark" href="/">Emotional Map</Link><section><p className="eyebrow">Identity keeps a memory yours</p><h1>{linkCurrentUser ? "Connect your email." : "Enter your map."}</h1><LoginForm linkCurrentUser={linkCurrentUser} /></section></main>; }
