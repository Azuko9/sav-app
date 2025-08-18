"use server";

import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Minimum 6 caractères"),
  redirectTo: z.string().optional(),
});

export async function signInAction(prevState: any, formData: FormData) {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo"),
  });
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { ok: false, message: error.message };

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user!.id)
    .single();

  const fallback = profile?.role === "ADMIN" ? "/admin/interventions" : "/tech/interventions";
  redirect(parsed.data.redirectTo || fallback);
}
