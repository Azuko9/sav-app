"use client";

import { useActionState } from "react";
import { signUpAction } from "./actions";

export default function SignUpPage() {
    const [state, formAction] = useActionState(
        signUpAction,
        { ok: true, errors: {}, message: undefined }
    );

    return (
        <main className="min-h-dvh grid place-items-center p-6">
            <form action={formAction} className="w-full max-w-sm space-y-4 border p-6 rounded-2xl shadow">
                <h1 className="text-xl font-semibold">Créer un compte</h1>

                <div className="space-y-1">
                    <label className="text-sm">Nom complet (optionnel)</label>
                    <input name="full_name" className="w-full border rounded p-2" />
                    {state?.errors?.full_name && <p className="text-sm text-red-600">{state.errors.full_name.join(", ")}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm">Email</label>
                    <input name="email" type="email" className="w-full border rounded p-2" required />
                    {state?.errors?.email && <p className="text-sm text-red-600">{state.errors.email.join(", ")}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm">Mot de passe</label>
                    <input name="password" type="password" className="w-full border rounded p-2" required />
                    {state?.errors?.password && <p className="text-sm text-red-600">{state.errors.password.join(", ")}</p>}
                </div>

                {!state?.ok && state?.message && <p className="text-sm text-red-600">{state.message}</p>}
                <button className="w-full rounded-xl p-2 border hover:shadow">Créer le compte</button>

                <p className="text-sm">
                    Déjà inscrit ? <a className="underline" href="/sign-in">Se connecter</a>
                </p>
            </form>
        </main>
    );
}
