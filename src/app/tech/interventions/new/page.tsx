"use client";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SignaturePad from "react-signature-canvas";

export default function NewInterventionPage() {
    const [clientName, setClientName] = useState("");
    const [prestations, setPrestations] = useState("");
    const [montantHT, setMontantHT] = useState<number>(0);
    const [tvaRate, setTvaRate] = useState<number>(20);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const sigRef = useRef<SignaturePad>(null);

    async function dataURLtoFile(dataURL: string, filename: string) {
        const res = await fetch(dataURL);
        const blob = await res.blob();
        return new File([blob], filename, { type: blob.type || "image/png" });
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const supabase = createClient();

        let signature_url: string | undefined;
        let signed_at: string | undefined;

        // 1) Upload signature si présente
        if (sigRef.current && !sigRef.current.isEmpty()) {
            const dataURL = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
            const file = await dataURLtoFile(dataURL, `sig-${crypto.randomUUID()}.png`);
            const path = `sig_${Date.now()}.png`;
            const { error: upErr } = await supabase.storage.from("signatures").upload(path, file);
            if (upErr) { setError(upErr.message); setLoading(false); return; }

            const { data } = supabase.storage.from("signatures").getPublicUrl(path);
            signature_url = data.publicUrl;
            signed_at = new Date().toISOString();
        }

        // 2) Insert fiche
        const { error: insErr } = await supabase
            .from("interventions")
            .insert({
                client: clientName,
                prestations,
                montant_ht: montantHT,
                tva_rate: tvaRate,
                signature_url,
                signed_at
                // tech_id est default auth.uid() via RLS
            });

        setLoading(false);
        if (insErr) { setError(insErr.message); return; }

        // 3) Reset / redirection simple
        window.location.href = "/tech"; // ou route de ton choix
    }

    function clearSig() { sigRef.current?.clear(); }

    const montantTVA = Math.round((Number(montantHT) * Number(tvaRate) / 100) * 100) / 100;
    const montantTTC = Math.round((Number(montantHT) + montantTVA) * 100) / 100;

    return (
        <main className="p-4 max-w-xl mx-auto space-y-4">
            <h1 className="text-xl font-semibold">Nouvelle intervention</h1>
            <form onSubmit={onSubmit} className="space-y-3">
                <input className="w-full border p-2 rounded" placeholder="Client"
                    value={clientName} onChange={(e) => setClientName(e.target.value)} required />
                <textarea className="w-full border p-2 rounded" placeholder="Prestations"
                    value={prestations} onChange={(e) => setPrestations(e.target.value)} required />
                <div className="grid grid-cols-2 gap-3">
                    <input type="number" step="0.01" className="border p-2 rounded" placeholder="Montant HT"
                        value={montantHT} onChange={(e) => setMontantHT(parseFloat(e.target.value) || 0)} required />
                    <input type="number" step="0.01" className="border p-2 rounded" placeholder="TVA %"
                        value={tvaRate} onChange={(e) => setTvaRate(parseFloat(e.target.value) || 0)} required />
                </div>

                <div className="text-sm">
                    <div>TVA: {montantTVA.toFixed(2)} €</div>
                    <div>TTC: {montantTTC.toFixed(2)} €</div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm">Signature client</label>
                    <div className="border rounded">
                        <SignaturePad ref={sigRef} canvasProps={{ className: "w-full h-40" }} />
                    </div>
                    <button type="button" onClick={clearSig} className="border px-3 py-1 rounded">Effacer</button>
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button disabled={loading} className="w-full border p-2 rounded">
                    {loading ? "Enregistrement..." : "Enregistrer la fiche"}
                </button>
            </form>
        </main>
    );
}
