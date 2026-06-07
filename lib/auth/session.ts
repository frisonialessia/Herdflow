// Minimal, local-first session: a signed (HMAC) cookie holding the user id.
// $0, no external auth service. Swap for Supabase Auth / Clerk in production —
// the rest of the app only depends on getSessionUserId().
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "hf_session";
const secret = () => process.env.SESSION_SECRET || "dev-insecure-secret-change-me";

function sign(value: string): string {
  const mac = createHmac("sha256", secret()).update(value).digest("base64url");
  return `${value}.${mac}`;
}

function verify(signed: string): string | null {
  const i = signed.lastIndexOf(".");
  if (i < 0) return null;
  const value = signed.slice(0, i);
  const mac = Buffer.from(signed.slice(i + 1));
  const expected = Buffer.from(createHmac("sha256", secret()).update(value).digest("base64url"));
  if (mac.length === expected.length && timingSafeEqual(mac, expected)) return value;
  return null;
}

/** Read the current user id from the session cookie (server components / actions). */
export function getSessionUserId(): string | null {
  const c = cookies().get(COOKIE)?.value;
  return c ? verify(c) : null;
}

/** Set the session (server actions / route handlers only). */
export function setSession(userId: string) {
  cookies().set(COOKIE, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSession() {
  cookies().delete(COOKIE);
}
