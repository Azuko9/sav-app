"use server";

import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Minimum 6 caractères"),
  full_name: z.string().min(2).max(80).optional(),
});

export async function signUpAction(prevState: any, formData: FormData) {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name"),
  });
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };

  const supabase = await createSupabaseServer();

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.full_name ?? null } },
  });
  if (error) return { ok: false, message: error.message };

  // Tentative de login direct pour l’enchaînement MVP
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (signInErr) return { ok: false, message: signInErr.message };

  redirect("/");
}
