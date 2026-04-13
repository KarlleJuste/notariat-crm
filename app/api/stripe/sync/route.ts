import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runStripeMrrSync } from "@/lib/sync/stripe-mrr";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("id", user.id)
    .single();

  if (profile?.app_role !== "manager") {
    return NextResponse.json({ error: "Accès réservé aux managers" }, { status: 403 });
  }

  const result = await runStripeMrrSync();
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, unattributedCount: result.unattributedCount },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    unattributedCount: result.unattributedCount,
  });
}
