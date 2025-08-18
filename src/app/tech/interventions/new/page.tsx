// src/app/tech/interventions/new/page.tsx
"use client";

import { useActionState, useMemo, useState } from "react";
import { createInterventionAction } from "./actions";
import { useRouter } from "next/navigation";

type Prestation = { id: string; label: string; qty: number; unit_price: number };

export default function NewInterventionPage() {
    const router = useRouter();
    const [prestations, setPrestations] = useState<Prestation[]>([
        { id: crypto.randomUUID(), label: "", qty: 1, unit_price: 0 },
    ]);

    const [state, formAction, pending] = useActionState(
        createInterventionAction,
        { ok: true, message: "", errors: {} }
    );

    const montantHT = useMemo(
        () => prestations.reduce((sum, p) => sum + (Number(p.qty) || 0) * (Number(p.unit_price) || 0), 0),
        [prestations]
    );

    function updateRow(id: string, patch: Partial<Prestation>) {
        setPrestations((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    }
    function addRow() {
        setPrestations((rows) => [...rows, { id: crypto.randomUUID(), label: "", qty: 1, unit_price: 0 }]);
    }
    function removeRow(id: string) {
        setPrestations((rows) => rows.length > 1 ? rows.filter((r) => r.id !== id) : rows);
    }

    return (
        <main className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Nouvelle intervention</h1>
                <button
                    onClick={() => router.back()}
                    className="rounded-xl border px-4 py-2 hover:shadow"
                    type="button"
                >
                    Retour
                </button>
            </div>

            <form action={formAction} className="space-y-6">
                {/* CLIENT */}
                <section className="rounded-2xl border p-6 space-y-4">
                    <h2 className="text-lg font-medium">Client</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm">Nom du client *</label>
                            <input
                                name="client_name"
                                className="w-full border rounded-xl p-2"
                                placeholder="Société / Particulier"
                                required
                            />
                            {state?.errors?.client_name && (
                                <p className="text-sm text-red-600 mt-1">{state.errors.client_name.join(", ")}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm">Email (optionnel)</label>
                            <input
                                name="client_email"
                                type="email"
                                className="w-full border rounded-xl p-2"
                                placeholder="client@email.com"
                            />
                            {state?.errors?.client_email && (
                                <p className="text-sm text-red-600 mt-1">{state.errors.client_email.join(", ")}</p>
                            )}
                        </div>
                    </div>
                </section>

                {/* PRESTATIONS */}
                <section className="rounded-2xl border p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium">Prestations</h2>
                        <button type="button" onClick={addRow} className="rounded-xl border px-3 py-1.5 hover:shadow">
                            + Ajouter une ligne
                        </button>
                    </div>

                    <div className="space-y-3">
                        {prestations.map((p, idx) => (
                            <div key={p.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                <div className="md:col-span-6">
                                    <label className="text-sm">Libellé *</label>
                                    <input
                                        className="w-full border rounded-xl p-2"
                                        value={p.label}
                                        onChange={(e) => updateRow(p.id, { label: e.target.value })}
                                        placeholder={`Ex: Dépannage #${idx + 1}`}
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm">Qté *</label>
                                    <input
                                        className="w-full border rounded-xl p-2"
                                        type="number"
                                        min={0.01}
                                        step={0.01}
                                        value={p.qty}
                                        onChange={(e) => updateRow(p.id, { qty: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm">PU HT (€) *</label>
                                    <input
                                        className="w-full border rounded-xl p-2"
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        value={p.unit_price}
                                        onChange={(e) => updateRow(p.id, { unit_price: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="text-sm">Total</label>
                                    <div className="p-2 rounded-xl border bg-neutral-50">
                                        {((p.qty || 0) * (p.unit_price || 0)).toFixed(2)} €
                                    </div>
                                </div>
                                <div className="md:col-span-1">
                                    <button
                                        type="button"
                                        onClick={() => removeRow(p.id)}
                                        className="w-full rounded-xl border px-3 py-2 hover:shadow"
                                        disabled={prestations.length === 1}
                                        title={prestations.length === 1 ? "Au moins 1 ligne requise" : "Supprimer"}
                                    >
                                        Suppr.
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Passage des prestations au server action (JSON) */}
                    <input type="hidden" name="prestations" value={JSON.stringify(
                        prestations.map(({ id, ...rest }) => rest)
                    )} />

                    {state?.errors?.prestations && (
                        <p className="text-sm text-red-600">{state.errors.prestations.join(", ")}</p>
                    )}
                </section>

                {/* RÉCAP */}
                <section className="rounded-2xl border p-6 flex items-center justify-between">
                    <span className="text-lg">Montant HT</span>
                    <span className="text-2xl font-semibold">{montantHT.toFixed(2)} €</span>
                </section>

                {/* ERREURS GLOBALES */}
                {!state?.ok && state?.message && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                        {state.message}
                    </div>
                )}

                {/* CTA */}
                <div className="flex items-center gap-3">
                    <button
                        disabled={pending}
                        className="rounded-xl border px-6 py-2 hover:shadow disabled:opacity-50"
                    >
                        {pending ? "Enregistrement…" : "Enregistrer"}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push("/tech/interventions")}
                        className="rounded-xl px-6 py-2 border hover:shadow"
                    >
                        Annuler
                    </button>
                </div>
            </form>
        </main>
    );
}

