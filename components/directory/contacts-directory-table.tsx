"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTACT_STATUS_LABELS } from "@/lib/constants";

export type ContactRow = {
  id: string;
  org_id: string;
  firstname: string;
  lastname: string;
  title: string | null;
  commission: string | null;
  email: string | null;
  phone: string | null;
  contact_status: string;
  last_contacted_at: string | null;
  contacted_by_commercial_id: string | null;
};

export function ContactsDirectoryTable({
  rows,
  orgs,
  commercials,
}: {
  rows: ContactRow[];
  orgs: { id: string; name: string }[];
  commercials: { id: string; name: string }[];
}) {
  if (rows.length === 0) {
    return (
      <p className="h-28 py-8 text-center text-slate-500">Aucun contact.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Prénom</TableHead>
          <TableHead>Nom</TableHead>
          <TableHead>Organisation</TableHead>
          <TableHead>Titre</TableHead>
          <TableHead>Commission / rôle</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Téléphone</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Commercial</TableHead>
          <TableHead>Dernier contact</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <EditableContactRow
            key={r.id}
            contact={r}
            orgs={orgs}
            commercials={commercials}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function EditableContactRow({
  contact,
  orgs,
  commercials,
}: {
  contact: ContactRow;
  orgs: { id: string; name: string }[];
  commercials: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [firstname, setFirstname] = useState(contact.firstname);
  const [lastname, setLastname] = useState(contact.lastname);
  const [title, setTitle] = useState(contact.title ?? "");
  const [commission, setCommission] = useState(contact.commission ?? "");
  const [email, setEmail] = useState(contact.email ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [status, setStatus] = useState(contact.contact_status);
  const [orgId, setOrgId] = useState(contact.org_id);
  const [owner, setOwner] = useState(
    contact.contacted_by_commercial_id ?? "none"
  );
  const [lastAt, setLastAt] = useState(
    contact.last_contacted_at?.slice(0, 10) ?? ""
  );

  useEffect(() => {
    setFirstname(contact.firstname);
    setLastname(contact.lastname);
    setTitle(contact.title ?? "");
    setCommission(contact.commission ?? "");
    setEmail(contact.email ?? "");
    setPhone(contact.phone ?? "");
    setStatus(contact.contact_status);
    setOrgId(contact.org_id);
    setOwner(contact.contacted_by_commercial_id ?? "none");
    setLastAt(contact.last_contacted_at?.slice(0, 10) ?? "");
  }, [contact]);

  async function patch(partial: Record<string, unknown>) {
    const supabase = createClient();
    await supabase
      .from("notary_contacts")
      .update({ ...partial, updated_at: new Date().toISOString() })
      .eq("id", contact.id);
    router.refresh();
  }

  return (
    <TableRow>
      <TableCell className="min-w-[120px]">
        <Input
          className="h-8"
          value={firstname}
          onChange={(e) => setFirstname(e.target.value)}
          onBlur={() => {
            const t = firstname.trim();
            if (t !== contact.firstname) void patch({ firstname: t });
          }}
        />
      </TableCell>
      <TableCell className="min-w-[120px]">
        <Input
          className="h-8"
          value={lastname}
          onChange={(e) => setLastname(e.target.value)}
          onBlur={() => {
            const t = lastname.trim();
            if (t !== contact.lastname) void patch({ lastname: t });
          }}
        />
      </TableCell>
      <TableCell className="min-w-[200px]">
        <Select
          value={orgId}
          onValueChange={(v) => {
            setOrgId(v);
            void patch({ org_id: v });
          }}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[280px]">
            {orgs.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Link
          href={`/directory/${orgId}`}
          className="mt-1 inline-block text-xs text-indigo-600 hover:underline"
        >
          Fiche org.
        </Link>
      </TableCell>
      <TableCell className="min-w-[140px]">
        <Input
          className="h-8"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            const t = title.trim();
            const prev = contact.title ?? "";
            if (t !== prev) void patch({ title: t || null });
          }}
        />
      </TableCell>
      <TableCell className="min-w-[120px]">
        <Input
          className="h-8"
          value={commission}
          onChange={(e) => setCommission(e.target.value)}
          onBlur={() => {
            const t = commission.trim();
            const prev = contact.commission ?? "";
            if (t !== prev) void patch({ commission: t || null });
          }}
          placeholder="—"
        />
      </TableCell>
      <TableCell className="min-w-[160px]">
        <Input
          type="email"
          className="h-8"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => {
            const t = email.trim();
            const prev = contact.email ?? "";
            if (t !== prev) void patch({ email: t || null });
          }}
          placeholder="—"
        />
      </TableCell>
      <TableCell className="min-w-[120px]">
        <Input
          className="h-8"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => {
            const t = phone.trim();
            const prev = contact.phone ?? "";
            if (t !== prev) void patch({ phone: t || null });
          }}
          placeholder="—"
        />
      </TableCell>
      <TableCell>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            void patch({ contact_status: v });
          }}
        >
          <SelectTrigger className="h-8 w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CONTACT_STATUS_LABELS).map(([k, label]) => (
              <SelectItem key={k} value={k}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={owner}
          onValueChange={(v) => {
            setOwner(v);
            void patch({
              contacted_by_commercial_id: v === "none" ? null : v,
            });
          }}
        >
          <SelectTrigger className="h-8 w-[160px]">
            <SelectValue />
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
      </TableCell>
      <TableCell className="min-w-[140px]">
        <Label className="sr-only">Dernier contact</Label>
        <Input
          type="date"
          className="h-8"
          value={lastAt}
          onChange={(e) => setLastAt(e.target.value)}
          onBlur={() =>
            void patch({
              last_contacted_at: lastAt ? `${lastAt}T12:00:00Z` : null,
            })
          }
        />
      </TableCell>
    </TableRow>
  );
}
