import "server-only";
import { createClient } from "@supabase/supabase-js";
import { normalizeEmail } from "./auth";

export class MagicLinkError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function authClient() {
  const url = process.env.SUPABASE_URL?.trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.replace(/\s/g, "");
  if (!url || !secret) {
    throw new MagicLinkError("Email sign-in is not configured for this environment.", 503);
  }

  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function requestMagicLink(rawEmail: string, redirectTo: string) {
  const email = normalizeEmail(rawEmail);
  const { error } = await authClient().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
  });

  if (error) {
    if (error.status === 429) {
      throw new MagicLinkError("Please wait a minute before requesting another sign-in link.", 429);
    }
    throw new MagicLinkError("We could not send a sign-in link right now. Please try again later.", 503);
  }
}

export async function verifyMagicLinkAccessToken(accessToken: string) {
  const { data, error } = await authClient().auth.getUser(accessToken);
  if (error || !data.user?.email) {
    throw new MagicLinkError("That sign-in link is invalid or has expired. Request a new one.", 401);
  }

  return normalizeEmail(data.user.email);
}
