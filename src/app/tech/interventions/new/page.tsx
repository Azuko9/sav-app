// app/tech/interventions/new/page.tsx
"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { saveDraft, lockIntervention } from "./actions";
import SignaturePad from "@/components/SignaturePad";

type Line = { label: string; qty: number; unit: number; vat: number };
export default function NewIntervention() {
    const [client, setClient] = useState({ name: "", address: "", phone: "", email: "" });
    const [lines, setLines] = useState<Line[]>([{ label: "", qty: 1, unit: 0, vat: 20 }]);
    const [signature, setSignature] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const totals = useMemo(() => {
        const ht = lines.reduce((s, l) => s + l.qty * l.unit, 0);
        const tva = lines.reduce((s, l) => s + (l.qty * l.unit) * (l.vat / 100), 0);
        const ttc = ht + tva;
        return { ht, tva, ttc };
    }, [lines]);

    return (
        <main className="mx-auto max-w-3xl p-4 space-y-6">
            <header className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Fiche d’intervention</h1>
                <div className="text-sm text-gray-500">Statut: DRAFT</div>
            </header>

            {/* Client */}
            <section className="space-y-2">
                <h2 className="font-medium">Client</h2>
                <input className="input" placeholder="Nom / Société"
                    value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} />
                <input className="input" placeholder="Adresse chantier"
                    value={client.address} onChange={e => setClient({ ...client, address: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                    <input className="input" placeholder="Téléphone"
                        value={client.phone} onChange={e => setClient({ ...client, phone: e.target.value })} />
                    <input className="input" placeholder="Email"
                        value={client.email} onChange={e => setClient({ ...client, email: e.target.value })} />
                </div>
            </section>

            {/* Lignes */}
            <section className="space-y-2">
                <h2 className="font-medium">Prestations</h2>
                {lines.map((l, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2">
                        <input className="col-span-6 input" placeholder="Désignation"
                            value={l.label} onChange={e => {
                                const a = [...lines]; a[i].label = e.target.value; setLines(a);
                            }} />
                        <input type="number" className="col-span-2 input" placeholder="Qté"
                            value={l.qty} onChange={e => {
                                const a = [...lines]; a[i].qty = +e.target.value; setLines(a);
                            }} />
                        <input type="number" className="col-span-2 input" placeholder="PU HT"
                            value={l.unit} onChange={e => {
                                const a = [...lines]; a[i].unit = +e.target.value; setLines(a);
                            }} />
                        <input type="number" className="col-span-2 input" placeholder="TVA %"
                            value={l.vat} onChange={e => {
                                const a = [...lines]; a[i].vat = +e.target.value; setLines(a);
                            }} />
                    </div>
                ))}
                <button className="btn" onClick={() => setLines([...lines, { label: "", qty: 1, unit: 0, vat: 20 }])}>
                    + Ajouter une ligne
                </button>
            </section>

            {/* Totaux */}
            <section className="space-y-1">
                <h2 className="font-medium">Totaux</h2>
                <div className="text-sm">HT: {totals.ht.toFixed(2)} €</div>
                <div className="text-sm">TVA: {totals.tva.toFixed(2)} €</div>
                <div className="text-base font-semibold">TTC: {totals.ttc.toFixed(2)} €</div>
            </section>

            {/* Signature */}
            <section className="space-y-2">
                <h2 className="font-medium">Signature client</h2>
                <SignaturePad value={signature} onChange={setSignature} />
            </section>

            {/* Actions */}
            <section className="flex gap-2">
                <button
                    className="btn"
                    disabled={loading}
                    onClick={async () => {
                        setLoading(true);
                        await saveDraft({ client, lines, totals, signature: null });
                        setLoading(false);
                        router.replace("/tech"); // retour tableau
                    }}>
                    Enregistrer brouillon
                </button>
                <button
                    className="btn-primary"
                    disabled={loading || !signature}
                    onClick={async () => {
                        setLoading(true);
                        await lockIntervention({ client, lines, totals, signature }); // READY→LOCKED + PDF
                        setLoading(false);
                        router.replace("/tech");
                    }}>
                    Valider et verrouiller
                </button>
            </section>
        </main>
    );
}
// styles utilitaires
// .input = "w-full rounded border p-2"
// .btn = "rounded border px-3 py-2"
// .btn-primary = "rounded bg-black text-white px-3 py-2"


