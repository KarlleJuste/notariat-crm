"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, Plus, Pencil, Trash2, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { AddDemosPanel } from "@/components/demos/add-demos-panel";
import {
  EventFormSheet,
  type EditingEventPayload,
} from "@/components/events/event-form-sheet";

type Commercial = { id: string; name: string };

const DELETE_DELAY_MS = 6000;

export function EventDetailActions({
  eventId,
  event,
  commercials,
  assignedCommercialIds,
}: {
  eventId: string;
  event: EditingEventPayload;
  commercials: Commercial[];
  assignedCommercialIds: string[];
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteScheduled, setDeleteScheduled] = useState(false);
  const [exporting, setExporting] = useState(false);
  const cancelDeleteRef = useRef(false);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function exportCsv() {
    setExporting(true);
    try {
      const res = await fetch(`/api/demos/export-csv?event_id=${eventId}`);
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        toast.error(data.error ?? "Erreur export");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      a.href = url;
      a.download = match?.[1] ?? "demos.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("CSV téléchargé.");
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setExporting(false);
    }
  }

  async function refreshHubspot() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/hubspot/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });
      const data = (await res.json().catch(() => null)) as
        | { error?: string; updates?: { ok: boolean; error?: string }[] }
        | null;
      if (!res.ok) {
        toast.error(data?.error ?? `Erreur ${res.status}`);
        return;
      }
      const updates = data?.updates ?? [];
      if (updates.length === 0) {
        toast.message("Aucune démo à synchroniser pour cet événement.");
        router.refresh();
        return;
      }
      const failed = updates.filter((u) => !u.ok);
      if (failed.length > 0) {
        const firstErr = failed.find((u) => u.error)?.error;
        toast.warning(
          firstErr
            ? `HubSpot : ${failed.length} démo(s) en échec — ${firstErr}`
            : `HubSpot : ${failed.length} démo(s) en échec. Les autres ont été mises à jour.`
        );
      } else {
        toast.success("Données HubSpot mises à jour.");
      }
      router.refresh();
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setRefreshing(false);
    }
  }

  function clearDeleteTimer() {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
  }

  function deleteEvent() {
    const ok = window.confirm(
      "Supprimer cet événement ? Toutes les démos liées seront définitivement supprimées après le délai de sécurité."
    );
    if (!ok) return;

    cancelDeleteRef.current = false;
    clearDeleteTimer();
    setDeleteScheduled(true);

    toast.message(
      "Suppression dans 6 secondes… Les démos seront effacées. Cliquez sur Annuler pour garder l’événement.",
      {
        duration: DELETE_DELAY_MS,
        action: {
          label: "Annuler",
          onClick: () => {
            cancelDeleteRef.current = true;
            clearDeleteTimer();
            setDeleteScheduled(false);
            toast.success("Suppression annulée.");
          },
        },
      }
    );

    deleteTimerRef.current = setTimeout(async () => {
      deleteTimerRef.current = null;
      if (cancelDeleteRef.current) {
        setDeleteScheduled(false);
        return;
      }
      const supabase = createClient();
      const { error } = await supabase.from("events").delete().eq("id", eventId);
      setDeleteScheduled(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Événement supprimé.");
      router.push("/events");
      router.refresh();
    }, DELETE_DELAY_MS);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        className="gap-2"
        onClick={() => setEditOpen(true)}
        disabled={deleteScheduled}
      >
        <Pencil className="h-4 w-4" />
        Modifier
      </Button>
      <Button
        variant="destructive"
        className="gap-2"
        disabled={deleteScheduled}
        onClick={() => void deleteEvent()}
      >
        <Trash2 className="h-4 w-4" />
        {deleteScheduled ? "Suppression…" : "Supprimer"}
      </Button>
      <Button
        variant="secondary"
        className="gap-2"
        onClick={() => setAddOpen(true)}
        disabled={deleteScheduled}
      >
        <Plus className="h-4 w-4" />
        Ajouter des démos
      </Button>
      <Button
        variant="secondary"
        className="gap-2"
        disabled={exporting || deleteScheduled}
        onClick={() => void exportCsv()}
      >
        <Download className={`h-4 w-4 ${exporting ? "animate-pulse" : ""}`} />
        {exporting ? "Export…" : "Exporter CSV"}
      </Button>
      <Button
        variant="secondary"
        className="gap-2"
        disabled={refreshing || deleteScheduled}
        onClick={() => void refreshHubspot()}
      >
        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        Rafraîchir depuis HubSpot
      </Button>
      <EventFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        commercials={commercials}
        editingEvent={event}
        initialCommercialIds={assignedCommercialIds}
      />
      <AddDemosPanel eventId={eventId} open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
