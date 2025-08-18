// src/app/tech/interventions/page.tsx
import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function TechInterventionsPage({
    searchParams,
}: { searchParams?: { created?: string } }) {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/sign-in");

    const created = searchParams?.created === "1";

    return (
        <main className="p-6 max-w-4xl mx-auto space-y-6">
            <header className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Mes interventions</h1>
                <a
                    href="/tech/interventions/new"
                    className="inline-flex items-center rounded-xl border px-4 py-2 hover:shadow"
                >
                    Nouvelle intervention
                </a>
            </header>

            {created && (
                <div className="rounded-xl border bg-green-50 p-4 text-green-700">
                    Intervention créée avec succès.
                </div>
            )}

            <div className="rounded-xl border p-6 text-sm text-neutral-600">
                (La liste viendra au Jour 5. Pour l’instant, utilise “Nouvelle intervention”.)
            </div>
        </main>
    );
}
