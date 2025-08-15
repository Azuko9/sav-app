"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RequireRole({ role, children }: { role: "ADMIN" | "TECH"; children: React.ReactNode }) {
    const [ok, setOk] = useState(false);
    const router = useRouter();
    useEffect(() => {
        (async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return router.replace("/login");
            const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
            if (!profile || profile.role !== role) return router.replace(role === "ADMIN" ? "/tech" : "/admin");
            setOk(true);
        })();
    }, [router, role]);
    if (!ok) return null;
    return <>{children}</>;
}
