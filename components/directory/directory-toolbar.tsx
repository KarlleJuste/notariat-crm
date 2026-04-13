"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DirectoryToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const csvHref =
    searchParams.toString().length > 0
      ? `/api/directory/export-csv?${searchParams.toString()}`
      : "/api/directory/export-csv";
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]!];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
      const rows = json.map((r) => ({
        name: String(r["Nom"] ?? r["name"] ?? "").trim(),
        type: String(r["Type"] ?? r["type"] ?? "").trim(),
        short_name: r["Nom court"] != null ? String(r["Nom court"]) : null,
        region: r["Région"] != null ? String(r["Région"]) : null,
        departments: r["Départements"]
          ? String(r["Départements"])
              .split(/[,;]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
        address: r["Adresse"] != null ? String(r["Adresse"]) : null,
        city: r["Ville"] != null ? String(r["Ville"]) : null,
        postal_code:
          r["Code postal"] != null ? String(r["Code postal"]) : null,
        website: r["Site"] != null ? String(r["Site"]) : null,
        email: r["Email"] != null ? String(r["Email"]) : null,
        phone: r["Téléphone"] != null ? String(r["Téléphone"]) : null,
        description:
          r["Description"] != null ? String(r["Description"]) : null,
        legal_status:
          r["Statut juridique"] != null ? String(r["Statut juridique"]) : null,
      }));

      const preview = await fetch("/api/directory/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: rows.filter((x) => x.name && x.type) }),
      }).then((r) => r.json());

      if (preview.error) {
        setMsg(preview.error);
        setBusy(false);
        return;
      }

      const ok = window.confirm(
        `Importer ${preview.count} ligne(s) ? Les organisations existantes (même nom + type) seront mises à jour.`
      );
      if (!ok) {
        setBusy(false);
        return;
      }

      const done = await fetch("/api/directory/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirm: true,
          rows: rows.filter((x) => x.name && x.type),
        }),
      }).then((r) => r.json());

      setMsg(
        `Import terminé : ${done.upserted ?? 0} enregistrement(s).` +
          (done.errors?.length
            ? ` Erreurs : ${done.errors.slice(0, 3).join(" | ")}`
            : "")
      );
      router.refresh();
    } catch {
      setMsg("Erreur lecture fichier");
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" asChild className="gap-2">
        <a href={csvHref} download>
          <FileSpreadsheet className="h-4 w-4" />
          Export CSV
        </a>
      </Button>
      <Button variant="secondary" asChild className="gap-2">
        <a href="/api/directory/export" download>
          <Download className="h-4 w-4" />
          Export Excel
        </a>
      </Button>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
        <Upload className="h-4 w-4" />
        {busy ? "Import…" : "Import Excel"}
        <input
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          disabled={busy}
          onChange={(e) => void onFile(e)}
        />
      </label>
      {msg && <span className="text-xs text-slate-500">{msg}</span>}
    </div>
  );
}
