"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// dataURL "data:image/png;base64,...." -> Buffer
function dataUrlToBuffer(dataUrl: string): Buffer | null {
  const m = /^data:image\/png;base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  return Buffer.from(m[1], "base64");
}

export async function signAction(id: string, signatureDataUrl: string) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié." };

  // 1) Vérifier que la fiche existe et est DRAFT (sécurité)
  const { data: itv } = await supabase
    .from("interventions")
    .select("id, status")
    .eq("id", id)
    .single();

  if (!itv) return { ok: false, message: "Fiche introuvable." };
  if (itv.status !== "DRAFT") return { ok: false, message: "Fiche déjà verrouillée." };

  // 2) Convertir l'image
  const buf = dataUrlToBuffer(signatureDataUrl);
  if (!buf) return { ok: false, message: "Signature invalide." };

  // 3) Upload dans Storage (bucket privé "signatures")
  const path = `${user.id}/${id}-${Date.now()}.png`;
  const up = await supabase.storage.from("signatures")
    .upload(path, buf, { contentType: "image/png", upsert: true });
  if (up.error) return { ok: false, message: up.error.message };

  // 4) Verrouiller la fiche (LOCKED) + enregistrer signature_path + signed_at
  const { error: updErr } = await supabase
    .from("interventions")
    .update({
      signature_path: path,
      signed_at: new Date().toISOString(),
      status: "LOCKED",
    })
    .eq("id", id)
    .eq("status", "DRAFT"); // évite double signature

  if (updErr) return { ok: false, message: updErr.message };

  // 5) Retour à la liste TECH avec bannière
  redirect("/tech/interventions?created=1"); // tu peux changer en ?signed=1 si tu préfères
}
