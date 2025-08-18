// src/app/page.tsx (SERVER COMPONENT)
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServer();

  // 1) Pas connecté → /sign-in
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) redirect("/sign-in");

  // 2) Connecté → rôle depuis profiles(user_id)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", session.user.id) // ✅ bonne colonne
    .single();

  const target = profile?.role === "ADMIN"
    ? "/admin/interventions"
    : "/tech/interventions";

  redirect(target);
}

