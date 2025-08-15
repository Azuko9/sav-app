// app/admin/page.tsx (client)
"use client";
import RequireRole from "@/components/auth/RequireRole";
import Link from "next/link";
import SignOutButton from "@/components/auth/SignOutButton";

export default function AdminHome() {
    return (
        <RequireRole role="ADMIN">
            <main className="p-6 space-y-4">
                <h1 className="text-xl font-semibold">Espace ADMIN</h1>
                <Link href="/admin/users/new" className="border p-2 rounded inline-block">Ajouter un technicien</Link>
                <SignOutButton />
            </main>
        </RequireRole>
    );
}

