"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
    const router = useRouter();

    async function handleSignOut() {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.replace("/login"); // renvoie vers la page de connexion
    }

    return (
        <button
            onClick={handleSignOut}
            className="border p-2 rounded hover:bg-gray-100"
        >
            Se déconnecter
        </button>
    );
}
