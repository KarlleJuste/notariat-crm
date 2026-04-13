#!/usr/bin/env python3
"""Génère supabase/seed_cannes_2026_demos.sql depuis scripts/cannes_2026_demos.csv"""
import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "scripts" / "cannes_2026_demos.csv"
OUT_PATH = ROOT / "supabase" / "seed_cannes_2026_demos.sql"

EVENT_NAME = "Congrès Notaires Cannes (mars 2026)"


def sql_str(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def main() -> None:
    rows: list[dict[str, str]] = []
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if (r.get("email") or "").strip():
                rows.append(r)

    n = len(rows)
    lines: list[str] = [
        f"-- Événement Cannes mars 2026 + {n} démos (listing commercial)",
        "-- Prérequis : commercials (Karl, Juliette, Quentin) + migrations initiales.",
        "-- hubspot_deal_id = IMPORT-CANNES-* (placeholders). Remplacer par les vrais Record IDs HubSpot,",
        "-- puis « Rafraîchir depuis HubSpot » sur la fiche événement pour stage / deal.",
        "-- MRR Stripe : rempli par sync Stripe (email contact) ou manuellement.",
        "--",
        "-- Mapping colonnes CRM :",
        "--   date_reservation → demos.created_at (midi UTC)",
        "--   date_demo       → demos.close_date",
        "--   stade HubSpot   → demos.stage (après refresh API)",
        "--   MRR             → demos.stripe_mrr (après sync Stripe)",
        "",
        "BEGIN;",
        "",
        f"INSERT INTO events (name, type, date, location, status, notes)",
        f"SELECT {sql_str(EVENT_NAME)}, 'salon_congres', DATE '2026-03-22', 'Cannes', 'termine',",
        f"  {sql_str('Import listing mars 2026. IDs deal factices IMPORT-CANNES-* jusqu’à synchro HubSpot.')}",
        f"WHERE NOT EXISTS (SELECT 1 FROM events WHERE name = {sql_str(EVENT_NAME)});",
        "",
        "INSERT INTO event_commercials (event_id, commercial_id)",
        "SELECT e.id, c.id",
        "FROM events e",
        "CROSS JOIN commercials c",
        f"WHERE e.name = {sql_str(EVENT_NAME)}",
        "  AND c.name IN ('Karl', 'Juliette', 'Quentin')",
        "ON CONFLICT DO NOTHING;",
        "",
        "INSERT INTO demos (",
        "  hubspot_deal_id, event_id, commercial_id,",
        "  contact_email, contact_name, contact_company, deal_name,",
        "  close_date, created_at, stage, raw_data",
        ")",
        "SELECT",
        "  v.hubspot_deal_id,",
        "  e.id,",
        "  c.id,",
        "  v.email,",
        "  v.contact_name,",
        "  NULL::text,",
        "  v.deal_name,",
        "  v.close_date::date,",
        "  v.created_at::timestamptz,",
        "  '1st demo booked',",
        "  v.raw_data::jsonb",
        "FROM (VALUES",
    ]

    value_rows: list[str] = []
    for i, r in enumerate(rows):
        comm = r["commercial"].strip()
        prenom = r["prenom"].strip()
        nom = r["nom"].strip()
        email = r["email"].strip().lower()
        dr = r["date_reservation"].strip()
        dd = r["date_demo"].strip()
        h = hashlib.sha256(f"{i}|{email}|{dd}|{comm}".encode()).hexdigest()[:16]
        hid = f"IMPORT-CANNES-{h}"
        contact_name = f"{prenom} {nom}".strip()
        deal_name = f"{contact_name} — Cannes 2026"
        created_at = f"{dr}T12:00:00Z"
        raw = json.dumps(
            {
                "import": "cannes_mar_2026",
                "date_reservation": dr,
                "date_demo": dd,
                "commercial_label": comm,
            },
            ensure_ascii=False,
        )
        value_rows.append(
            "    ("
            + f"{sql_str(hid)}, {sql_str(comm)}, {sql_str(email)}, {sql_str(contact_name)}, "
            + f"{sql_str(deal_name)}, {sql_str(dd)}, {sql_str(created_at)}, {sql_str(raw)}"
            + ")"
        )

    lines.append(",\n".join(value_rows))
    lines.append(
        ") AS v(hubspot_deal_id, commercial_name, email, contact_name, deal_name, close_date, created_at, raw_data)"
    )
    lines.append("JOIN events e ON e.name = " + sql_str(EVENT_NAME))
    lines.append("JOIN commercials c ON c.name = v.commercial_name")
    lines.append("ON CONFLICT (hubspot_deal_id) DO NOTHING;")
    lines.append("")
    lines.append("COMMIT;")
    lines.append("")

    OUT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT_PATH} ({len(rows)} demos)")


if __name__ == "__main__":
    main()
