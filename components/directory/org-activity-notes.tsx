"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type NoteRow = {
  id: string;
  detail: string | null;
  created_at: string;
};

export function OrgActivityNotes({
  orgId,
  notes,
}: {
  orgId: string;
  notes: NoteRow[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("org_activity").insert({
      org_id: orgId,
      actor_id: user?.id ?? null,
      action: "note",
      detail: body,
    });
    setSaving(false);
    if (error) {
      window.alert(error.message);
      return;
    }
    setText("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notes internes (historique)</CardTitle>
        <p className="text-xs text-slate-500">
          Visible par toute l’équipe connectée. Chaque ajout est horodaté.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={addNote} className="space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Compte-rendu d’appel, prochaine action…"
            rows={3}
          />
          <Button type="submit" size="sm" disabled={saving || !text.trim()}>
            {saving ? "Envoi…" : "Ajouter une note"}
          </Button>
        </form>
        <ul className="space-y-3 border-t border-slate-100 pt-4">
          {notes.length === 0 ? (
            <li className="text-sm text-slate-500">Aucune note pour le moment.</li>
          ) : (
            notes.map((n) => (
              <li
                key={n.id}
                className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm"
              >
                <p className="whitespace-pre-wrap text-slate-800">
                  {n.detail ?? "—"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {format(new Date(n.created_at), "d MMM yyyy à HH:mm", {
                    locale: fr,
                  })}
                </p>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
