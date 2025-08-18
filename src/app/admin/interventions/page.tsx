import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminInterventionsPage() {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/sign-in");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profile?.role !== "ADMIN") redirect("/tech/interventions");

    return <main className="p-6">Zone ADMIN — (liste jour 5)</main>;
}
