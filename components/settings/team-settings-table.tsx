"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Row = {
  id: string;
  name: string;
  email: string;
  hubspot_owner_id: string | null;
  role: string;
};

export function TeamSettingsTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const missingHubspotOwner = rows.filter((r) => !r.hubspot_owner_id?.trim());

  async function updateRow(
    id: string,
    partial: Partial<Pick<Row, "name" | "email" | "hubspot_owner_id" | "role">>
  ) {
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.from("commercials").update(partial).eq("id", id);
    if (error) setMsg(error.message);
    else router.refresh();
  }

  async function addCommercial(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const hubspot_owner_id =
      String(fd.get("hubspot_owner_id") ?? "").trim() || null;
    if (!name || !email) {
      setMsg("Nom et email obligatoires.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("commercials").insert({
      name,
      email,
      hubspot_owner_id,
      role: "commercial",
    });
    if (error) {
      setMsg(error.message);
      return;
    }
    setAdding(false);
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {msg && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {msg}
        </p>
      )}
      {missingHubspotOwner.length > 0 && (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <p className="font-medium">
            Sans <span className="font-mono">hubspot_owner_id</span>, l’attribution MRR
            (Stripe → HubSpot → commercial) peut échouer pour les deals de :
          </p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5">
            {missingHubspotOwner.map((r) => (
              <li key={r.id}>
                <span className="font-medium">{r.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>HubSpot owner ID</TableHead>
              <TableHead>Rôle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <CommercialRow
                key={r.id}
                row={r}
                onPatch={updateRow}
                highlightMissingHubspotOwner={!r.hubspot_owner_id?.trim()}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      {!adding ? (
        <Button type="button" variant="secondary" onClick={() => setAdding(true)}>
          Ajouter un commercial
        </Button>
      ) : (
        <form
          onSubmit={addCommercial}
          className="max-w-xl space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4"
        >
          <p className="text-sm font-medium text-slate-800">Nouveau commercial</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Nom</Label>
              <Input name="name" required />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" required />
            </div>
          </div>
          <div>
            <Label>HubSpot owner ID (optionnel)</Label>
            <Input name="hubspot_owner_id" placeholder="ex. 123456789" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Créer
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAdding(false)}
            >
              Annuler
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function CommercialRow({
  row,
  onPatch,
  highlightMissingHubspotOwner,
}: {
  row: Row;
  highlightMissingHubspotOwner?: boolean;
  onPatch: (
    id: string,
    p: Partial<Pick<Row, "name" | "email" | "hubspot_owner_id" | "role">>
  ) => void;
}) {
  const [name, setName] = useState(row.name);
  const [email, setEmail] = useState(row.email);
  const [hubId, setHubId] = useState(row.hubspot_owner_id ?? "");
  const [role, setRole] = useState(row.role);

  return (
    <TableRow
      className={
        highlightMissingHubspotOwner ? "bg-amber-50/90 hover:bg-amber-50" : undefined
      }
    >
      <TableCell>
        <Input
          className="h-9 min-w-[140px]"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name.trim() !== row.name) onPatch(row.id, { name: name.trim() });
          }}
        />
      </TableCell>
      <TableCell>
        <Input
          className="h-9 min-w-[180px]"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => {
            if (email.trim() !== row.email) onPatch(row.id, { email: email.trim() });
          }}
        />
      </TableCell>
      <TableCell>
        <Input
          className="h-9 min-w-[160px] font-mono text-xs"
          value={hubId}
          onChange={(e) => setHubId(e.target.value)}
          onBlur={() => {
            const next = hubId.trim();
            const prev = row.hubspot_owner_id ?? "";
            if (next !== prev) onPatch(row.id, { hubspot_owner_id: next || null });
          }}
          placeholder="—"
        />
      </TableCell>
      <TableCell>
        <select
          className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
          value={role}
          onChange={(e) => {
            const v = e.target.value;
            setRole(v);
            onPatch(row.id, { role: v });
          }}
        >
          <option value="commercial">commercial</option>
          <option value="manager">manager</option>
        </select>
      </TableCell>
    </TableRow>
  );
}
