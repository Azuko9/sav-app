import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdmin } from "@supabase/supabase-js";

async function getSSR(req: NextRequest) {
  let res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => req.cookies.get(n)?.value,
        set: (n, v, o) => { res.cookies.set({ name: n, value: v, ...o }); },
        remove: (n, o) => { res.cookies.set({ name: n, value: "", ...o }); },
      },
    }
  );
  return { supabase, res };
}

export async function POST(req: NextRequest) {
  const { supabase, res } = await getSSR(req);

  // 1) vérifier session + rôle ADMIN
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return NextResponse.json({ error: "Interdit" }, { status: 403 });

  // 2) créer l’utilisateur TECH
  const { email, password, full_name } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "email et password requis" }, { status: 400 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // serveur only
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: created, error: ce } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: full_name ?? "" },
  });
  if (ce) return NextResponse.json({ error: ce.message }, { status: 400 });

  const uid = created.user.id;
  const { error: ue } = await admin.from("profiles").upsert({ id: uid, full_name: full_name ?? "", role: "TECH" });
  if (ue) return NextResponse.json({ error: ue.message }, { status: 400 });

  return NextResponse.json({ ok: true, userId: uid }, { headers: res.headers });
}

