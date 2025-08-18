// src/lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
// Si tu as des types générés :
// import type { Database } from "@/lib/supabase/types";

/**
 * Fabrique Supabase côté serveur (RSC / Server Actions) — Next 15
 * - cookies() est async
 * - le get() doit retourner string | null (pas undefined)
 * - set/remove sont tolérés là où l’environnement autorise l’écriture ; on try/catch sinon.
 */
export async function createSupabaseServer(
  /* opts? */
)/*: Promise<SupabaseClient<Database>>*/: Promise<SupabaseClient> {
  // Next 15 : cookies() est asynchrone
  const cookieStore = await cookies();

  return createServerClient/*<Database>*/(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // IMPORTANT: retourner string | null
        get(name: string) {
          return cookieStore.get(name)?.value ?? null;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // En RSC, set peut être readonly ; ignorer proprement si c’est le cas
            (cookieStore as any).set?.({ name, value, ...options });
          } catch { /* no-op */ }
        },
        remove(name: string, options: CookieOptions) {
          try {
            (cookieStore as any).set?.({ name, value: "", ...options });
          } catch { /* no-op */ }
        },
      },
    }
  );
}

