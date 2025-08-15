"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const supabase = createClient();

        const { error: signInError } =
            await supabase.auth.signInWithPassword({ email, password });
        if (signInError) return setError(signInError.message);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return setError("Utilisateur introuvable");

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        router.replace(profile?.role === "ADMIN" ? "/admin" : "/tech");
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-6">
            <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3">
                <h1 className="text-2xl font-semibold">Connexion</h1>
                <input
                    className="w-full border p-2 rounded"
                    placeholder="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    className="w-full border p-2 rounded"
                    placeholder="mot de passe"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button className="w-full border p-2 rounded">Se connecter</button>
            </form>
        </main>
    );
}
