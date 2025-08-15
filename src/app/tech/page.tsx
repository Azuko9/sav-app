"use client";
import RequireRole from "@/components/auth/RequireRole";
import Link from "next/link";
import SignOutButton from "@/components/auth/SignOutButton";

export default function TechPage() {
    return (
        <RequireRole role="TECH">
            <main className="p-6">
                <h1 className="text-xl font-semibold">Espace TECH</h1>
                <Link href="/tech/interventions/new" className="border p-2 rounded inline-block">saisir fiche</Link>
                <SignOutButton />
            </main>
        </RequireRole>
    );
}
