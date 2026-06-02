"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function signOut() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
