"use client";

import { useActionState } from "react";
import { signInAction } from "./actions";

export default function SignInPage({ searchParams }: any) {
    const [state, formAction] = useActionState(
        signInAction,
        { ok: true, errors: {}, message: undefined }
    );
    const redirectTo = typeof searchParams?.redirectTo === "string" ? searchParams.redirectTo : "";

    return (
        <main className="min-h-dvh grid place-items-center p-6">
            <form action={formAction} className="w-full max-w-sm space-y-4 border p-6 rounded-2xl shadow">
                <h1 className="text-xl font-semibold">Connexion</h1>

                <input type="hidden" name="redirectTo" value={redirectTo} />

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
                <button className="w-full rounded-xl p-2 border hover:shadow">Se connecter</button>

                <p className="text-sm">
                    Pas de compte ? <a className="underline" href="/sign-up">Créer un compte</a>
                </p>
            </form>
        </main>
    );
}

