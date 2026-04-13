"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EventNotes({
  eventId,
  initialNotes,
}: {
  eventId: string;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNotes(initialNotes ?? "");
  }, [initialNotes]);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("events")
      .update({ notes: notes || null, updated_at: new Date().toISOString() })
      .eq("id", eventId);
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Debrief / notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label htmlFor="notes">Notes (enregistrement au blur)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => void save()}
          rows={5}
          placeholder="Compte-rendu du salon, actions, suivis…"
        />
        {saving && (
          <p className="text-xs text-slate-500">Enregistrement…</p>
        )}
      </CardContent>
    </Card>
  );
}
