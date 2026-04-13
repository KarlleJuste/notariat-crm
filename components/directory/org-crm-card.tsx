"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CRM_ORG_STATUS_LABELS } from "@/lib/constants";
import { Input } from "@/components/ui/input";

type Org = {
  id: string;
  owner_commercial_id: string | null;
  crm_status: string;
  last_contacted_at: string | null;
  owner_notes: string | null;
};

export function OrgCrmCard({
  org,
  commercials,
}: {
  org: Org;
  commercials: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [owner, setOwner] = useState(org.owner_commercial_id ?? "none");
  const [status, setStatus] = useState(org.crm_status);
  const [lastAt, setLastAt] = useState(
    org.last_contacted_at?.slice(0, 10) ?? ""
  );
  const [notes, setNotes] = useState(org.owner_notes ?? "");
  const [saved, setSaved] = useState(false);

  const flashSaved = useCallback(() => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }, []);

  async function persist(partial: Record<string, unknown>) {
    const supabase = createClient();
    await supabase
      .from("notary_orgs")
      .update({ ...partial, updated_at: new Date().toISOString() })
      .eq("id", org.id);
    flashSaved();
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">CRM — propriété du compte</CardTitle>
        {saved && (
          <span className="text-xs font-medium text-emerald-600" aria-live="polite">
            ✓ Sauvegardé
          </span>
        )}
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Commercial responsable</Label>
          <Select
            value={owner}
            onValueChange={(v) => {
              const val = v === "none" ? null : v;
              setOwner(v);
              void persist({
                owner_commercial_id: val,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {commercials.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Statut CRM</Label>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              void persist({ crm_status: v });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CRM_ORG_STATUS_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Dernière prise de contact</Label>
          <Input
            type="date"
            value={lastAt}
            onChange={(e) => setLastAt(e.target.value)}
            onBlur={() =>
              void persist({
                last_contacted_at: lastAt ? `${lastAt}T12:00:00Z` : null,
              })
            }
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Notes internes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => void persist({ owner_notes: notes || null })}
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}
