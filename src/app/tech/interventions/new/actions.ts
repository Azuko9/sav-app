// app/tech/interventions/new/actions.ts
"use server";
import { createClient } from "@/lib/supabase/server";

type Payload = {
  client: { name:string; address:string; phone?:string; email?:string };
  lines: { label:string; qty:number; unit:number; vat:number }[];
  totals: { ht:number; tva:number; ttc:number };
  signature: string | null; // dataURL
};

export async function saveDraft(p: Payload) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("unauth");
  await supabase.from("interventions").insert({
    user_id: user.id,
    status: "DRAFT",
    client: p.client,
    lines: p.lines,
    totals: p.totals
  });
}

export async function lockIntervention(p: Payload) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("unauth");
  const { data, error } = await supabase
    .from("interventions")
    .insert({
      user_id: user.id,
      status: "LOCKED",
      client: p.client,
      lines: p.lines,
      totals: p.totals,
      signature_png: p.signature // MVP: on stocke le dataURL; V2: Storage
    })
    .select("id")
    .single();
  if (error) throw error;

  // MVP PDF simple: à implémenter via @react-pdf/renderer puis upload Storage. 【PDF basique MVP】
  return data?.id;
}
