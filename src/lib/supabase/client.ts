"use client";

import { createBrowserClient } from "@supabase/ssr";
// import type { Database } from "@/lib/supabase/types"; // si tu as généré les types

export const supabaseBrowser = () =>
  createBrowserClient/*<Database>*/(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

