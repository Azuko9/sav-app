// src/app/tech/interventions/[id]/page.tsx
import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import SignForm from "./sign-form";

type Props = { params: { id: string } };

export default async function TechInterventionDetail({ params }: Props) {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/sign-in");

    // Récupère la fiche (RLS : TECH ne voit que ses fiches)
    const { data: itv, error } = await supabase
        .from("interventions")
        .select("*")
        .eq("id", params.id)
        .single();

    if (error || !itv) return notFound();

    // Totaux issus de la DB (source de vérité)
    const {
        client_name,
        client_email,
        prestations,
        montant_ht,
        montant_tva,
        montant_ttc,
        tva_rate,
        status,
        signature_path,
        signed_at,
    } = itv as any;

    const locked = status === "LOCKED";

    return (
        <main className="p-6 max-w-3xl mx-auto space-y-6">
            <a href="/tech/interventions" className="inline-block text-sm underline">&larr; Retour</a>

            <header className="space-y-1">
                <h1 className="text-2xl font-semibold">Fiche d’intervention</h1>
                <p className="text-neutral-600">État : <strong>{status}</strong></p>
            </header>

            {/* Client */}
            <section className="rounded-2xl border p-6">
                <h2 className="text-lg font-medium mb-4">Client</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <div className="text-sm text-neutral-500">Nom</div>
                        <div className="font-medium">{client_name}</div>
                    </div>
                    <div>
                        <div className="text-sm text-neutral-500">Email</div>
                        <div className="font-medium">{client_email || "—"}</div>
                    </div>
                </div>
            </section>

            {/* Prestations */}
            <section className="rounded-2xl border p-6 space-y-3">
                <h2 className="text-lg font-medium">Prestations</h2>
                <div className="divide-y">
                    {(prestations || []).map((p: any, i: number) => (
                        <div key={i} className="py-2 flex items-center justify-between text-sm">
                            <div className="text-neutral-700">{p.label}</div>
                            <div className="tabular-nums">
                                {p.qty} × {p.unit_price.toFixed(2)} € = {(p.qty * p.unit_price).toFixed(2)} €
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Totaux */}
            <section className="rounded-2xl border p-6">
                <div className="flex items-center justify-between text-lg">
                    <span>Montant HT</span>
                    <span className="font-semibold">{Number(montant_ht).toFixed(2)} €</span>
                </div>
                <div className="flex items-center justify-between text-lg">
                    <span>TVA ({tva_rate}%)</span>
                    <span className="font-semibold">{Number(montant_tva).toFixed(2)} €</span>
                </div>
                <div className="flex items-center justify-between text-xl mt-2">
                    <span>Total TTC</span>
                    <span className="font-bold">{Number(montant_ttc).toFixed(2)} €</span>
                </div>
            </section>

            {/* Signature */}
            <section className="rounded-2xl border p-6 space-y-4">
                <h2 className="text-lg font-medium">Signature du client</h2>

                {locked ? (
                    <div className="space-y-3">
                        <p className="text-green-700">Fiche signée le {new Date(signed_at).toLocaleString()}</p>
                        {signature_path ? (
                            <img
                                alt="Signature"
                                className="border rounded-xl bg-white"
                                src={`/api/signatures?path=${encodeURIComponent(signature_path)}`}
                            />
                        ) : (
                            <p className="text-sm text-neutral-600">Signature enregistrée.</p>
                        )}
                    </div>
                ) : (
                    <SignForm id={params.id} />
                )}
            </section>
        </main>
    );
}
