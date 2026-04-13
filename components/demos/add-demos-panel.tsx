"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export function AddDemosPanel({
  eventId,
  open,
  onOpenChange,
}: {
  eventId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ids = text
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ids.length) {
      setLog("Collez au moins un ID de deal.");
      return;
    }
    setLoading(true);
    setLog(null);
    try {
      const res = await fetch("/api/hubspot/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, deal_ids: ids }),
      });
      const data = (await res.json()) as {
        results?: { id: string; ok: boolean; error?: string }[];
        error?: string;
      };
      if (!res.ok) {
        setLog(data.error ?? "Erreur API");
        setLoading(false);
        return;
      }
      const ok = data.results?.filter((r) => r.ok).length ?? 0;
      const ko = data.results?.filter((r) => !r.ok) ?? [];
      setLog(
        `${ok} deal(s) importé(s).` +
          (ko.length
            ? ` Échecs : ${ko.map((k) => `${k.id} (${k.error})`).join("; ")}`
            : "")
      );
      router.refresh();
    } catch {
      setLog("Erreur réseau");
    }
    setLoading(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Ajouter des démos</SheetTitle>
          <SheetDescription>
            Collez les IDs de deals HubSpot (un par ligne ou séparés par des
            virgules). Seuls ces deals seront récupérés.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-1 flex-col gap-4">
          <div className="space-y-2">
            <Label>HubSpot Deal IDs</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder={"12345678901\n12345678902"}
              className="font-mono text-sm"
            />
          </div>
          {log && (
            <p className="whitespace-pre-wrap text-sm text-slate-600">{log}</p>
          )}
          <div className="mt-auto flex gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Import…" : "Importer"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
