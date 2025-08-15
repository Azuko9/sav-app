"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const supabase = createClient();

      // 1) pas connecté → /login
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace("/login");

      // 2) connecté → route selon rôle
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      router.replace(profile?.role === "ADMIN" ? "/admin" : "/tech");
    };
    run();
  }, [router]);

  return null; // écran neutre le temps de la redirection
}
