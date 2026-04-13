"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

type Commercial = { id: string; name: string };

export type EditingEventPayload = {
  id: string;
  name: string;
  type: string;
  date: string;
  location: string | null;
  status: string;
  notes: string | null;
};

export function EventFormSheet({
  open,
  onOpenChange,
  commercials,
  editingEvent,
  initialCommercialIds,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  commercials: Commercial[];
  editingEvent?: EditingEventPayload | null;
  initialCommercialIds?: string[];
}) {
  const router = useRouter();
  const isEdit = Boolean(editingEvent);
  const [name, setName] = useState("");
  const [type, setType] = useState<"salon_congres" | "webinar_conference">(
    "salon_congres"
  );
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"a_venir" | "termine" | "annule">(
    "a_venir"
  );
  const [notes, setNotes] = useState("");
  const [selectedComms, setSelectedComms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editingEvent) {
      setName(editingEvent.name);
      setType(
        editingEvent.type === "webinar_conference"
          ? "webinar_conference"
          : "salon_congres"
      );
      setDate(editingEvent.date?.slice(0, 10) ?? "");
      setLocation(editingEvent.location ?? "");
      setStatus(
        editingEvent.status === "termine" || editingEvent.status === "annule"
          ? editingEvent.status
          : "a_venir"
      );
      setNotes(editingEvent.notes ?? "");
      setSelectedComms(initialCommercialIds ?? []);
    } else {
      setName("");
      setType("salon_congres");
      setDate("");
      setLocation("");
      setStatus("a_venir");
      setNotes("");
      setSelectedComms([]);
    }
  }, [open, editingEvent, initialCommercialIds]);

  function resetCreateForm() {
    setName("");
    setDate("");
    setLocation("");
    setNotes("");
    setSelectedComms([]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    if (editingEvent) {
      const { error: upErr } = await supabase
        .from("events")
        .update({
          name,
          type,
          date,
          location: location || null,
          status,
          notes: notes || null,
        })
        .eq("id", editingEvent.id);
      if (upErr) {
        setLoading(false);
        setError(upErr.message);
        return;
      }
      await supabase
        .from("event_commercials")
        .delete()
        .eq("event_id", editingEvent.id);
      if (selectedComms.length) {
        await supabase.from("event_commercials").insert(
          selectedComms.map((cid) => ({
            event_id: editingEvent.id,
            commercial_id: cid,
          }))
        );
      }
    } else {
      const { data: ev, error: err } = await supabase
        .from("events")
        .insert({
          name,
          type,
          date,
          location: location || null,
          status,
          notes: notes || null,
        })
        .select("id")
        .single();
      if (err || !ev) {
        setLoading(false);
        setError(err?.message ?? "Erreur création");
        return;
      }
      if (selectedComms.length) {
        await supabase.from("event_commercials").insert(
          selectedComms.map((cid) => ({
            event_id: ev.id,
            commercial_id: cid,
          }))
        );
      }
    }

    setLoading(false);
    onOpenChange(false);
    if (!editingEvent) resetCreateForm();
    router.refresh();
  }

  function toggleComm(id: string) {
    setSelectedComms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Modifier l'événement" : "Nouvel événement"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Mettez à jour les informations et les commerciaux assignés."
              : "Créez un salon, un congrès ou un webinar."}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-1 flex-col gap-4">
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Salon des maires 2026"
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(v) =>
                setType(v as "salon_congres" | "webinar_conference")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salon_congres">Salon / Congrès</SelectItem>
                <SelectItem value="webinar_conference">
                  Webinar / Conférence en ligne
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Lieu (optionnel)</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Paris, Parc des expos…"
            />
          </div>
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select
              value={status}
              onValueChange={(v) =>
                setStatus(v as "a_venir" | "termine" | "annule")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a_venir">À venir</SelectItem>
                <SelectItem value="termine">Terminé</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Commerciaux assignés</Label>
            <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 p-3">
              {commercials.length === 0 ? (
                <span className="text-sm text-slate-500">
                  Aucun commercial en base.
                </span>
              ) : (
                commercials.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedComms.includes(c.id)}
                      onChange={() => toggleComm(c.id)}
                      className="rounded border-slate-300"
                    />
                    {c.name}
                  </label>
                ))
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="mt-auto flex gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? isEdit
                  ? "Enregistrement…"
                  : "Création…"
                : isEdit
                  ? "Enregistrer"
                  : "Créer"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
