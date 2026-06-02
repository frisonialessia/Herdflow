import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Magic-link / OTP confirmation endpoint (PKCE-friendly).
//
// The Supabase email template must point its link here, e.g.:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
// On success we exchange the token for a session cookie and land the user on
// the dashboard.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(path, request.url));

  if (!isSupabaseConfigured()) return redirectTo("/");

  if (token_hash && type) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return redirectTo(next);
  }

  return redirectTo("/login?error=link_invalid");
}
