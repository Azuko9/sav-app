"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SignaturePad from "@/components/SignaturePad";

type Line = { libelle: string; qte: number; pu: number; tva: number };

export default function NewIntervention() {
    const sb = createClient();
    const router = useRouter();

    const [techEmail, setTechEmail] = useState<string>("");
    const [client, setClient] = useState({ nom: "", adresse: "", tel: "", email: "" });
    const [dateInter, setDateInter] = useState<string>(() => new Date().toISOString().slice(0, 10));
    const [lignes, setLignes] = useState<Line[]>([{ libelle: "", qte: 1, pu: 0, tva: 20 }]);
    const [signature, setSignature] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const { data: { user } } = await sb.auth.getUser();
            setTechEmail(user?.email ?? "");
        })();
    }, [sb]);

    const totals = useMemo(() => {
        const ht = lignes.reduce((s, l) => s + l.qte * l.pu, 0);
        const tva = lignes.reduce((s, l) => s + l.qte * l.pu * (l.tva / 100), 0);
        return { ht: +ht.toFixed(2), tva: +tva.toFixed(2), ttc: +(ht + tva).toFixed(2) };
    }, [lignes]);

    async function save(status: "DRAFT" | "LOCKED") {
        setSaving(true); setErr(null);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) { setErr("Session expirée"); setSaving(false); return; }

        const payload = {
            tech_id: user.id,
            client_name: client.nom,
            client_address: client.adresse,
            client_phone: client.tel,
            client_email: client.email,
            date_intervention: dateInter,
            prestations: lignes.map(l => ({ libelle: l.libelle, qte: l.qte, pu_ht: l.pu, tva_pct: l.tva })),
            total_ht: totals.ht,
            total_tva: totals.tva,
            total_ttc: totals.ttc,
            signature_png: signature,   // MVP: dataURL
            status,
        };

        const { error } = await sb.from("interventions").insert(payload);
        setSaving(false);
        if (error) { setErr(error.message); return; }
        router.replace("/tech");
    }

    return (
        <main className="mx-auto max-w-4xl p-4 print:p-0">
            {/* En-tête */}
            <div className="border p-4 rounded bg-white">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-xl font-semibold">Fiche d’intervention</h1>
                        <p className="text-sm text-gray-600">Technicien: {techEmail || "-"}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm">Date</div>
                        <input
                            type="date"
                            className="border rounded p-1 text-sm"
                            value={dateInter}
                            onChange={(e) => setDateInter(e.target.value)}
                        />
                    </div>
                </div>

                {/* Bloc Client */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                        <label className="text-xs text-gray-600">Client / Société</label>
                        <input className="w-full border rounded p-2"
                            value={client.nom} onChange={e => setClient({ ...client, nom: e.target.value })} />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs text-gray-600">Adresse chantier</label>
                        <input className="w-full border rounded p-2"
                            value={client.adresse} onChange={e => setClient({ ...client, adresse: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs text-gray-600">Téléphone</label>
                        <input className="w-full border rounded p-2"
                            value={client.tel} onChange={e => setClient({ ...client, tel: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs text-gray-600">Email</label>
                        <input className="w-full border rounded p-2"
                            value={client.email} onChange={e => setClient({ ...client, email: e.target.value })} />
                    </div>
                </div>

                {/* Tableau Prestations */}
                <div className="mt-6">
                    <div className="grid grid-cols-12 text-xs font-medium bg-gray-50 border-y">
                        <div className="col-span-6 p-2 border-r">Désignation</div>
                        <div className="col-span-2 p-2 border-r text-right">Qté</div>
                        <div className="col-span-2 p-2 border-r text-right">PU HT</div>
                        <div className="col-span-2 p-2 text-right">TVA %</div>
                    </div>
                    {lignes.map((l, i) => (
                        <div key={i} className="grid grid-cols-12 border-b">
                            <input
                                className="col-span-6 p-2 border-r outline-none"
                                placeholder="Description"
                                value={l.libelle}
                                onChange={(e) => { const a = [...lignes]; a[i].libelle = e.target.value; setLignes(a); }}
                            />
                            <input
                                type="number" className="col-span-2 p-2 border-r text-right outline-none"
                                value={l.qte} min={0} step="1"
                                onChange={(e) => { const a = [...lignes]; a[i].qte = +e.target.value; setLignes(a); }}
                            />
                            <input
                                type="number" className="col-span-2 p-2 border-r text-right outline-none"
                                value={l.pu} min={0} step="0.01"
                                onChange={(e) => { const a = [...lignes]; a[i].pu = +e.target.value; setLignes(a); }}
                            />
                            <input
                                type="number" className="col-span-2 p-2 text-right outline-none"
                                value={l.tva} min={0} step="0.01"
                                onChange={(e) => { const a = [...lignes]; a[i].tva = +e.target.value; setLignes(a); }}
                            />
                        </div>
                    ))}
                    <div className="mt-2">
                        <button
                            className="border rounded px-3 py-1 text-sm"
                            onClick={() => setLignes([...lignes, { libelle: "", qte: 1, pu: 0, tva: 20 }])}
                        >
                            + Ajouter une ligne
                        </button>
                    </div>
                </div>

                {/* Totaux */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                    <div />
                    <div className="col-span-2 border rounded p-3 bg-gray-50">
                        <div className="flex justify-between text-sm">
                            <span>Sous‑total HT</span><span>{totals.ht.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>TVA</span><span>{totals.tva.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                            <span>Total TTC</span><span>{totals.ttc.toFixed(2)} €</span>
                        </div>
                    </div>
                </div>

                {/* Signature */}
                <div className="mt-6">
                    <div className="text-sm mb-1">Signature client</div>
                    <SignaturePad value={signature} onChange={setSignature} />
                </div>

                {/* Actions */}
                {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
                <div className="mt-6 flex gap-2">
                    <button disabled={saving} className="border rounded px-4 py-2" onClick={() => save("DRAFT")}>
                        Enregistrer brouillon
                    </button>
                    <button
                        disabled={saving || !signature}
                        className="rounded px-4 py-2 bg-black text-white"
                        onClick={() => save("LOCKED")}
                    >
                        Valider et verrouiller
                    </button>
                </div>
            </div>
        </main>
    );
}
