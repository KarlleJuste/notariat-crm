import { DEMO_STAGE_ORDER } from "@/lib/constants";

const FIRST_BOOKED_STAGE = "1st demo booked";

/** Colonne Kanban pour un libellé / ID de stage HubSpot. */
export function columnForStage(stage: string | null): string {
  if (!stage) return "Autre";
  const t = stage.trim();
  for (const col of DEMO_STAGE_ORDER) {
    if (t === col) return col;
    if (t.toLowerCase().includes(col.toLowerCase().slice(0, 6))) return col;
  }
  return "Autre";
}

/**
 * Démo considérée comme « réalisée » (passée l’étape « 1st demo booked »).
 * Stade inconnu (« Autre ») → non compté comme réalisé pour le KPI.
 */
export function isDemoRealizedPastBooking(stage: string | null): boolean {
  const col = columnForStage(stage);
  if (col === "Autre") return false;
  return col !== FIRST_BOOKED_STAGE;
}
