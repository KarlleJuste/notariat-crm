import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Mot de passe affiché à l’écran ; surcharge PRIMMO_TEAM_PASSWORD */
function teamPassword(): string {
  return process.env.PRIMMO_TEAM_PASSWORD?.trim() || "primmo2026";
}

function gateEmail(): string {
  return process.env.NEXT_PUBLIC_PRIMMO_GATE_EMAIL?.trim() || "acces@primmo.internal";
}

/**
 * Crée le compte technique partagé s’il n’existe pas (après vérif du mot de passe).
 */
export async function POST(req: Request) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const password = (body.password ?? "").trim();
  const expected = teamPassword();

  if (password !== expected) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  const email = gateEmail();

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      const msg = error.message ?? "";
      if (/already registered|already exists|duplicate/i.test(msg)) {
        return NextResponse.json({ ok: true, created: false });
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ ok: true, created: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
