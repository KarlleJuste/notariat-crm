/**
 * Compte Supabase Auth unique (partagé par toute l’équipe).
 * Pas affiché à l’utilisateur — seul le mot de passe est demandé à l’écran.
 * Surcharge : NEXT_PUBLIC_PRIMMO_GATE_EMAIL dans .env.local
 */
export const PRIMMO_GATE_EMAIL =
  process.env.NEXT_PUBLIC_PRIMMO_GATE_EMAIL?.trim() || "acces@primmo.internal";
