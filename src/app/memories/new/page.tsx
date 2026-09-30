import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { MemoryWizard } from "@/features/memory/memory-wizard";
export default async function NewMemoryPage() { if (!await getCurrentUser()) redirect("/login"); return <main className="record-page"><Link className="wordmark" href="/">Emotional Map</Link><header><p className="eyebrow">A moment, carefully kept</p><h1>Leave a memory here.</h1></header><MemoryWizard /></main>; }
