// src/app/tech/interventions/new/actions.ts
"use server";

import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Schéma Zod : le client_name est requis, email optionnel,
// prestations = liste d'items (libellé, quantité, prix unitaire).
const prestationSchema = z.object({
  label: z.string().min(1, "Libellé requis"),
  qty: z.number().positive("Quantité > 0"),
  unit_price: z.number().min(0, "Prix >= 0"),
});
const formSchema = z.object({
  client_name: z.string().min(2, "Nom client trop court"),
  client_email: z.string().email().optional().or(z.literal("").transform(() => undefined)),
  prestations: z.array(prestationSchema).min(1, "Ajoute au moins une prestation"),
});

// Aide : parse float (“12,34” -> 12.34)
function parseNumber(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  const s = String(v).replace(",", ".").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function createInterventionAction(prevState: any, formData: FormData) {
  // 1) Récupérer l'utilisateur (pour tech_id)
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Non authentifié." };
  }

  // 2) Reconstituer les prestations (on reçoit un JSON stringifié)
  let prestations: unknown = [];
  try {
    prestations = JSON.parse(String(formData.get("prestations") ?? "[]"));
  } catch {
    return { ok: false, message: "Prestations invalides." };
  }

  // 3) Construire les données à valider
  const payload = {
    client_name: String(formData.get("client_name") ?? ""),
    client_email: String(formData.get("client_email") ?? ""),
    prestations: Array.isArray(prestations) ? prestations.map((p) => ({
      label: String(p?.label ?? ""),
      qty: Number(p?.qty ?? 0),
      unit_price: Number(p?.unit_price ?? 0),
    })) : [],
  };

  // 4) Validation Zod
  const parsed = formSchema.safeParse(payload);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { ok: false, errors, message: "Merci de corriger les erreurs." };
  }

  // 5) Calcul montant_ht (somme des lignes)
  const montant_ht = parsed.data.prestations
    .reduce((acc, p) => acc + p.qty * p.unit_price, 0);

  if (montant_ht <= 0) {
    return { ok: false, message: "Montant HT doit être > 0." };
  }

// 6) Insert sécurisé (tech_id = user.id) + on récupère l'id
  const { data, error } = await supabase
    .from("interventions")
    .insert({
      tech_id: user.id,
      client_name: parsed.data.client_name,
      client_email: parsed.data.client_email,
      prestations: parsed.data.prestations,
      montant_ht,
    })
    .select("id")  // ✅ on récupère l'id
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  // 7) Redirection vers la fiche détaillée (signature ensuite)
  redirect(`/tech/interventions/${data.id}`);
}
