import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { OnboardingForm } from "@/features/auth/onboarding-form";

export default async function OnboardingPage() {
  const user = await getCurrentUser(); if (!user) redirect("/login"); if (user.displayName && user.publicSlug) redirect("/");
  return <main className="auth-page"><Link className="wordmark" href="/">Emotional Map</Link><section><p className="eyebrow">A quiet beginning</p><h1>Name your map.</h1><OnboardingForm initialName={user.displayName ?? ""} /></section></main>;
}
