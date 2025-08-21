"use client";

import { useActionState, useMemo, useRef, useState, useEffect } from "react";
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
        { ok: true, message: "", errors: undefined }
    );

    // ===== Totaux (client-side) =====
    const montantHT = useMemo(
        () => prestations.reduce((sum, p) => sum + (Number(p.qty) || 0) * (Number(p.unit_price) || 0), 0),
        [prestations]
    );
    const tvaRate = 20;
    const montantTVA = useMemo(() => +(montantHT * tvaRate / 100).toFixed(2), [montantHT]);
    const montantTTC = useMemo(() => +(montantHT + montantTVA).toFixed(2), [montantHT, montantTVA]);

    // ===== Signature (canvas) =====
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [drawing, setDrawing] = useState(false);
    const [hasStroke, setHasStroke] = useState(false);
    const sigHiddenRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current!;
        const dpr = window.devicePixelRatio || 1;
        const width = Math.min(720, window.innerWidth - 48); // responsive
        const height = 200;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        const ctx = canvas.getContext("2d")!;
        ctx.scale(dpr, dpr);
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#111827"; // neutral-900
    }, []);

    function pos(e: React.MouseEvent | React.TouchEvent) {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const p = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
        return { x: p.clientX - rect.left, y: p.clientY - rect.top };
    }

    function start(e: any) {
        e.preventDefault();
        setDrawing(true);
        const ctx = canvasRef.current!.getContext("2d")!;
        const { x, y } = pos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
    function move(e: any) {
        if (!drawing) return;
        setHasStroke(true);
        const ctx = canvasRef.current!.getContext("2d")!;
        const { x, y } = pos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    function end() { setDrawing(false); }
    function clearSig() {
        const c = canvasRef.current!;
        const ctx = c.getContext("2d")!;
        ctx.clearRect(0, 0, c.width, c.height);
        setHasStroke(false);
        if (sigHiddenRef.current) sigHiddenRef.current.value = "";
    }

    // Avant submit : si signature tracée, on set le hidden input
    async function beforeSubmit(e: React.FormEvent<HTMLFormElement>) {
        if (hasStroke && canvasRef.current && sigHiddenRef.current) {
            const dataUrl = canvasRef.current.toDataURL("image/png");
            sigHiddenRef.current.value = dataUrl;
        }
    }

    // ===== Prestations CRUD (UI) =====
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
        <main className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Nouvelle intervention</h1>
                <button type="button" onClick={() => router.back()} className="rounded-xl border px-4 py-2 hover:shadow">
                    Retour
                </button>
            </div>

            <form action={formAction} onSubmitCapture={beforeSubmit} className="grid gap-6 md:grid-cols-12">
                {/* COLONNE PRINCIPALE */}
                <div className="md:col-span-8 space-y-6">
                    {/* Client */}
                    <section className="rounded-2xl border p-4 md:p-6 space-y-4">
                        <h2 className="text-lg font-medium">Client</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm">Nom du client *</label>
                                <input name="client_name" className="w-full border rounded-xl p-2" placeholder="Société / Particulier" required />
                                {state?.errors?.client_name && <p className="text-sm text-red-600 mt-1">{state.errors.client_name.join(", ")}</p>}
                            </div>
                            <div>
                                <label className="text-sm">Email (optionnel)</label>
                                <input name="client_email" type="email" className="w-full border rounded-xl p-2" placeholder="client@email.com" />
                                {state?.errors?.client_email && <p className="text-sm text-red-600 mt-1">{state.errors.client_email.join(", ")}</p>}
                            </div>
                        </div>
                    </section>

                    {/* Prestations */}
                    <section className="rounded-2xl border p-4 md:p-6 space-y-4">
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
                                            type="number" min={0.01} step={0.01}
                                            value={p.qty}
                                            onChange={(e) => updateRow(p.id, { qty: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-sm">PU HT (€) *</label>
                                        <input
                                            className="w-full border rounded-xl p-2"
                                            type="number" min={0} step={0.01}
                                            value={p.unit_price}
                                            onChange={(e) => updateRow(p.id, { unit_price: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-sm">Total</label>
                                        <div className="p-2 rounded-xl border bg-neutral-50 tabular-nums">
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
                    </section>

                    {/* Signature */}
                    <section className="rounded-2xl border p-4 md:p-6 space-y-4">
                        <h2 className="text-lg font-medium">Signature du client (optionnelle)</h2>

                        <div
                            className="rounded-xl border bg-white p-3 select-none touch-none"
                            onMouseLeave={end}
                        >
                            <canvas
                                ref={canvasRef}
                                className="w-full h-[200px] bg-white rounded-md"
                                onMouseDown={start}
                                onMouseMove={move}
                                onMouseUp={end}
                                onTouchStart={start}
                                onTouchMove={move}
                                onTouchEnd={end}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button type="button" onClick={clearSig} className="rounded-xl border px-4 py-2 hover:shadow">
                                Effacer
                            </button>
                            <span className="text-xs text-neutral-500">
                                Si une signature est fournie, la fiche sera <b>verrouillée (LOCKED)</b> à la validation.
                            </span>
                        </div>

                        {/* Hidden pour transmettre la signature si présente */}
                        <input ref={sigHiddenRef} type="hidden" name="signatureDataUrl" />
                    </section>

                    {/* Erreurs globales */}
                    {!state?.ok && state?.message && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                            {state.message}
                        </div>
                    )}
                </div>

                {/* COLONNE RÉCAP / sticky à droite */}
                <aside className="md:col-span-4 space-y-4 md:sticky md:top-4 h-fit">
                    <section className="rounded-2xl border p-4 md:p-6 space-y-2">
                        <h2 className="text-lg font-medium">Récapitulatif</h2>
                        <div className="flex items-center justify-between">
                            <span>Montant HT</span>
                            <span className="font-semibold tabular-nums">{montantHT.toFixed(2)} €</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>TVA ({tvaRate}%)</span>
                            <span className="font-semibold tabular-nums">{montantTVA.toFixed(2)} €</span>
                        </div>
                        <div className="flex items-center justify-between text-xl">
                            <span>Total TTC</span>
                            <span className="font-bold tabular-nums">{montantTTC.toFixed(2)} €</span>
                        </div>
                    </section>

                    <div className="rounded-2xl border p-4 md:p-6 space-y-3">
                        {/* Prestations JSON pour le server action */}
                        <input
                            type="hidden"
                            name="prestations"
                            value={JSON.stringify(prestations.map(({ id, ...rest }) => rest))}
                        />

                        <button
                            disabled={pending}
                            className="w-full rounded-xl border px-6 py-2 hover:shadow disabled:opacity-50"
                        >
                            {pending ? "Enregistrement…" : "Valider l’intervention"}
                        </button>

                        <button
                            type="button"
                            onClick={() => router.push("/tech/interventions")}
                            className="w-full rounded-xl border px-6 py-2 hover:shadow"
                        >
                            Annuler
                        </button>
                    </div>
                </aside>
            </form>
        </main>
    );
}
