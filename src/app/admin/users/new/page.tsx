"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import RequireRole from "@/components/auth/RequireRole";

export default function NewTechPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault(); setErr(null); setMsg(null); setSaving(true);
        const r = await fetch("/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, full_name: fullName }),
        });
        const j = await r.json(); setSaving(false);
        if (!r.ok) return setErr(j.error || "Erreur");
        setMsg("Technicien créé"); setEmail(""); setPassword(""); setFullName("");
        // router.replace("/admin"); // optionnel
    }

    return (
        <RequireRole role="ADMIN">
            <main className="p-6 max-w-lg space-y-4">
                <h1 className="text-xl font-semibold">Ajouter un technicien</h1>
                <form onSubmit={onSubmit} className="space-y-3">
                    <input className="w-full border p-2 rounded" placeholder="Nom complet"
                        value={fullName} onChange={e => setFullName(e.target.value)} />
                    <input className="w-full border p-2 rounded" placeholder="Email" type="email"
                        value={email} onChange={e => setEmail(e.target.value)} required />
                    <input className="w-full border p-2 rounded" placeholder="Mot de passe" type="password"
                        value={password} onChange={e => setPassword(e.target.value)} required />
                    <button disabled={saving} className="border p-2 rounded">
                        {saving ? "Création..." : "Créer le compte TECH"}
                    </button>
                </form>
                {msg && <p className="text-green-700 text-sm">{msg}</p>}
                {err && <p className="text-red-700 text-sm">{err}</p>}
            </main>
        </RequireRole>
    );
}

