// src/app/tech/interventions/page.tsx
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";

// Valide les query params (simple, robuste)
const QuerySchema = z.object({
    q: z.string().optional().default(""),
    status: z.enum(["ALL", "DRAFT", "READY", "LOCKED"]).optional().default("ALL"),
    page: z.coerce.number().int().min(1).optional().default(1),
    perPage: z.coerce.number().int().min(5).max(50).optional().default(10),
});

export default async function TechInterventionsPage({
    searchParams,
}: {
    searchParams?: Record<string, string | string[] | undefined>;
}) {
    const supabase = await createSupabaseServer();

    // Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/sign-in");

    // Parse filters
    const parsed = QuerySchema.safeParse({
        q: typeof searchParams?.q === "string" ? searchParams.q : "",
        status: typeof searchParams?.status === "string" ? searchParams.status : "ALL",
        page: typeof searchParams?.page === "string" ? searchParams.page : "1",
        perPage: typeof searchParams?.perPage === "string" ? searchParams.perPage : "10",
    });
    if (!parsed.success) redirect("/tech/interventions");

    const { q, status, page, perPage } = parsed.data;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    // Query: TECH ne voit que ses fiches (RLS assure aussi)
    let query = supabase
        .from("interventions")
        .select(
            "id, created_at, client_name, client_email, montant_ht, montant_tva, montant_ttc, status",
            { count: "exact" }
        )
        .eq("tech_id", user.id)
        .order("created_at", { ascending: false });

    if (q) {
        query = query.or(`client_name.ilike.%${q}%,client_email.ilike.%${q}%`);
    }
    if (status !== "ALL") {
        query = query.eq("status", status);
    }

    const { data: rows, count, error } = await query.range(from, to);
    if (error) {
        return (
            <main className="p-6 max-w-5xl mx-auto">
                <div className="rounded-xl border bg-red-50 p-4 text-red-700">
                    Erreur: {error.message}
                </div>
            </main>
        );
    }

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const created = searchParams?.created === "1";

    return (
        <main className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h1 className="text-2xl font-semibold">Mes interventions</h1>
                <a href="/tech/interventions/new" className="inline-flex items-center rounded-xl border px-4 py-2 hover:shadow">
                    Nouvelle intervention
                </a>
            </header>

            {created && (
                <div className="rounded-xl border bg-green-50 p-4 text-green-700">
                    Intervention enregistrée.
                </div>
            )}

            {/* Barre de recherche */}
            <form action="/tech/interventions" method="get" className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col">
                    <label className="text-sm">Recherche</label>
                    <input
                        name="q"
                        defaultValue={q}
                        placeholder="Client, email…"
                        className="border rounded-xl px-3 py-2"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm">Statut</label>
                    <select name="status" defaultValue={status} className="border rounded-xl px-3 py-2">
                        <option value="ALL">Tous</option>
                        <option value="DRAFT">DRAFT</option>
                        <option value="READY">READY</option>
                        <option value="LOCKED">LOCKED</option>
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-sm">Par page</label>
                    <select name="perPage" defaultValue={String(perPage)} className="border rounded-xl px-3 py-2">
                        {[10, 20, 30, 50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <input type="hidden" name="page" value="1" />
                <button className="border rounded-xl px-4 py-2 hover:shadow">Filtrer</button>
                {(q || status !== "ALL" || perPage !== 10) && (
                    <a href="/tech/interventions" className="text-sm underline">Réinitialiser</a>
                )}
            </form>

            {/* Résumé */}
            <div className="text-sm text-neutral-600">
                {total} résultat{total > 1 ? "s" : ""}{q ? <> • filtre <b>{q}</b></> : null}
                {status !== "ALL" ? <> • statut <b>{status}</b></> : null}
            </div>

            {/* Tableau */}
            <div className="overflow-x-auto rounded-2xl border">
                <table className="min-w-full text-sm">
                    <thead className="bg-neutral-50 text-neutral-600">
                        <tr>
                            <th className="text-left p-3">Date</th>
                            <th className="text-left p-3">Client</th>
                            <th className="text-left p-3">Email</th>
                            <th className="text-right p-3">HT</th>
                            <th className="text-right p-3">TTC</th>
                            <th className="text-left p-3">Statut</th>
                            <th className="text-right p-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(rows ?? []).map((r) => (
                            <tr key={r.id} className="border-t">
                                <td className="p-3 whitespace-nowrap">
                                    {new Date(r.created_at as string).toLocaleString()}
                                </td>
                                <td className="p-3">{r.client_name}</td>
                                <td className="p-3">{r.client_email || "—"}</td>
                                <td className="p-3 text-right tabular-nums">{Number(r.montant_ht).toFixed(2)} €</td>
                                <td className="p-3 text-right tabular-nums">{Number(r.montant_ttc).toFixed(2)} €</td>
                                <td className="p-3">
                                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                                        {r.status}
                                    </span>
                                </td>
                                <td className="p-3 text-right whitespace-nowrap">
                                    <a href={`/tech/interventions/${r.id}`} className="underline">Ouvrir</a>
                                </td>
                            </tr>
                        ))}
                        {(!rows || rows.length === 0) && (
                            <tr>
                                <td className="p-6 text-center text-neutral-500" colSpan={7}>
                                    Aucune intervention.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <nav className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">
                    Page {page} / {totalPages}
                </span>
                <div className="flex gap-2">
                    <a
                        className={`border rounded-xl px-3 py-1.5 ${page <= 1 ? "opacity-50 pointer-events-none" : "hover:shadow"}`}
                        href={`/tech/interventions?${new URLSearchParams({ q, status, perPage: String(perPage), page: String(page - 1) })}`}
                    >
                        ← Précédent
                    </a>
                    <a
                        className={`border rounded-xl px-3 py-1.5 ${page >= totalPages ? "opacity-50 pointer-events-none" : "hover:shadow"}`}
                        href={`/tech/interventions?${new URLSearchParams({ q, status, perPage: String(perPage), page: String(page + 1) })}`}
                    >
                        Suivant →
                    </a>
                </div>
            </nav>
        </main>
    );
}

