// Server Supabase client, for Server Components, Route Handlers and Server
// Actions. It reads/writes the auth session through Next's cookie store.
//
// In a Server Component the cookie writes throw (the request is read-only);
// that's expected and harmless because the middleware refreshes the session
// cookie on every request. Guard callers with `isSupabaseConfigured()`.

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — ignore; middleware handles refresh.
          }
        },
      },
    }
  );
}
