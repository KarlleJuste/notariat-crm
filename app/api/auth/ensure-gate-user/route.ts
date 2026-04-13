import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function teamPassword(): string {
  return process.env.PRIMMO_TEAM_PASSWORD?.trim() || "primmo2026";
}

function gateEmail(): string {
  return process.env.NEXT_PUBLIC_PRIMMO_GATE_EMAIL?.trim() || "acces@primmo.internal";
}

/**
 * Crée ou met à jour le compte technique partagé (après vérif du mot de passe).
 * Si l'utilisateur existe déjà, on synchronise son mot de passe pour garantir
 * que signInWithPassword réussira toujours.
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
  const admin = createAdminClient();

  try {
    // Essaie de créer l'utilisateur
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (!createError) {
      // Créé avec succès
      return NextResponse.json({ ok: true, created: true });
    }

    // L'utilisateur existe déjà → on met à jour son mot de passe
    // pour s'assurer que signInWithPassword fonctionnera
    const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const existing = listData?.users?.find((u) => u.email === email);

    if (existing) {
      await admin.auth.admin.updateUserById(existing.id, { password });
      return NextResponse.json({ ok: true, created: false });
    }

    // Utilisateur introuvable et création échouée — on retourne quand même ok
    // et on laisse signInWithPassword trancher
    return NextResponse.json({ ok: true, created: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
