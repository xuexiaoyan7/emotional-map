import Link from "next/link";
export function CreateMapLink({ signedIn }: { signedIn: boolean }) { return <Link className="create-map-link" href={signedIn ? "/" : "/login"}>Create your own Emotional Map →</Link>; }
