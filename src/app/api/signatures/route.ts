// src/app/api/signatures/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) return new NextResponse("Missing path", { status: 400 });

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  // Télécharge le fichier depuis le bucket privé
  const { data, error } = await supabase.storage.from("signatures").download(path);
  if (error || !data) return new NextResponse("Not found", { status: 404 });

  // Renvoie l'image
  return new NextResponse(data, {
    headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=60" },
  });
}
