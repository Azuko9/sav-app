"use server";

import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// ==== Zod ====
// Une prestation: libellé + quantité + prix unitaire
const prestationSchema = z.object({
  label: z.string().min(1, "Libellé requis"),
  qty: z.number().positive("Quantité > 0"),
  unit_price: z.number().min(0, "Prix >= 0"),
});

// Le formulaire complet
const formSchema = z.object({
  client_name: z.string().min(2, "Nom client trop court"),
  client_email: z.string().email().optional().or(z.literal("").transform(() => undefined)),
  prestations: z.array(prestationSchema).min(1, "Ajoute au moins une prestation"),
  signatureDataUrl: z.string().optional(), // "data:image/png;base64,..." si présente
});

// dataURL -> ArrayBuffer (Edge/Node OK)
async function dataUrlToArrayBuffer(dataUrl: string | undefined): Promise<ArrayBuffer | null> {
  if (!dataUrl) return null;
  if (!/^data:image\/png;base64,/.test(dataUrl)) return null;
  const res = await fetch(dataUrl);
  if (!res.ok) return null;
  return res.arrayBuffer();
}

export async function createInterventionAction(prev: any, formData: FormData) {
  const supabase = await createSupabaseServer();

  // 1) Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié." };

  // 2) Reco des prestations (depuis un hidden JSON)
  let prestations: unknown = [];
  try {
    prestations = JSON.parse(String(formData.get("prestations") ?? "[]"));
  } catch {
    return { ok: false, message: "Prestations invalides." };
  }

  // 3) Payload pour Zod
  const payload = {
    client_name: String(formData.get("client_name") ?? ""),
    client_email: String(formData.get("client_email") ?? ""),
    prestations: Array.isArray(prestations)
      ? prestations.map((p) => ({
          label: String(p?.label ?? ""),
          qty: Number(p?.qty ?? 0),
          unit_price: Number(p?.unit_price ?? 0),
        }))
      : [],
    signatureDataUrl: String(formData.get("signatureDataUrl") ?? "") || undefined,
  };

  const parsed = formSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors, message: "Merci de corriger les erreurs." };
  }

  // 4) Montant HT côté serveur (source de vérité)
  const montant_ht = parsed.data.prestations.reduce((acc, p) => acc + p.qty * p.unit_price, 0);
  if (montant_ht <= 0) {
    return { ok: false, message: "Montant HT doit être > 0." };
  }

  // 5) Insert DRAFT
  const { data: inserted, error: insertErr } = await supabase
    .from("interventions")
    .insert({
      tech_id: user.id,
      client_name: parsed.data.client_name,
      client_email: parsed.data.client_email,
      prestations: parsed.data.prestations,
      montant_ht,
      // status: DRAFT (par défaut)
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return { ok: false, message: insertErr?.message ?? "Insertion impossible." };
  }

  const id = inserted.id as string;

  // 6) Si signature fournie : upload + LOCKED
  const buf = await dataUrlToArrayBuffer(parsed.data.signatureDataUrl);
  if (buf) {
    const path = `${user.id}/${id}-${Date.now()}.png`;
    const up = await supabase.storage.from("signatures").upload(path, buf, {
      contentType: "image/png",
      upsert: true,
    });
    if (up.error) {
      // on garde la fiche DRAFT si l'upload échoue
      return { ok: false, message: `Upload signature: ${up.error.message}` };
    }

    // Verrouille la fiche (autorisé par RLS puisque status était DRAFT)
    const { error: updErr } = await supabase
      .from("interventions")
      .update({ signature_path: path, signed_at: new Date().toISOString(), status: "LOCKED" })
      .eq("id", id)
      .eq("status", "DRAFT");

    if (updErr) return { ok: false, message: `Verrouillage: ${updErr.message}` };

    // Redirige (succès signature)
    redirect("/tech/interventions?created=1");
  }

  // 7) Sans signature -> fiche DRAFT
  redirect("/tech/interventions?created=1");
}
