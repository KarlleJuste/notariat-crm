"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Plus, Mail, Phone, Linkedin, StickyNote } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_STATUS_LABELS } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Contact = {
  id: string;
  org_id: string;
  firstname: string;
  lastname: string;
  title: string | null;
  commission: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  notes: string | null;
  contacted_by_commercial_id: string | null;
  contact_status: string;
  last_contacted_at: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  a_contacter: "bg-slate-100 text-slate-600",
  contacte: "bg-blue-100 text-blue-700",
  en_discussion: "bg-amber-100 text-amber-700",
  converti: "bg-emerald-100 text-emerald-700",
  inactif: "bg-red-100 text-red-500",
};

export function ContactsSection({
  orgId,
  contacts,
  commercials,
}: {
  orgId: string;
  contacts: Contact[];
  commercials: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  async function remove(id: string) {
    if (!window.confirm("Supprimer ce contact ?")) return;
    const supabase = createClient();
    await supabase.from("notary_contacts").delete().eq("id", id);
    router.refresh();
  }

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Capture form ref BEFORE any await (currentTarget becomes null after async)
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("notary_contacts").insert({
      org_id: orgId,
      firstname: String(fd.get("firstname") ?? "").trim(),
      lastname: String(fd.get("lastname") ?? "").trim(),
      title: String(fd.get("title") || "").trim() || null,
      commission: String(fd.get("commission") || "").trim() || null,
      email: String(fd.get("email") || "").trim() || null,
      phone: String(fd.get("phone") || "").trim() || null,
      linkedin: String(fd.get("linkedin") || "").trim() || null,
      notes: String(fd.get("notes") || "").trim() || null,
    });
    setSaving(false);
    if (error) {
      alert(`Erreur lors de l'ajout : ${error.message}`);
      return;
    }
    setAdding(false);
    formEl.reset();
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-base">Contacts</CardTitle>
          <p className="mt-0.5 text-xs text-slate-400">
            {contacts.length === 0
              ? "Aucun contact enregistré"
              : `${contacts.length} contact${contacts.length > 1 ? "s" : ""}`}
          </p>
        </div>
        {!adding && (
          <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Ajouter
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Formulaire ajout ── */}
        {adding && (
          <form
            onSubmit={add}
            className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-5 space-y-4"
          >
            <p className="text-sm font-semibold text-slate-700">Nouveau contact</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Prénom *</Label>
                <Input name="firstname" required autoFocus />
              </div>
              <div>
                <Label className="text-xs">Nom *</Label>
                <Input name="lastname" required />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Titre / Poste</Label>
                <Input name="title" placeholder="ex : Notaire associé" />
              </div>
              <div>
                <Label className="text-xs">Commission / Rôle</Label>
                <Input name="commission" placeholder="ex : Président commission formation" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Email</Label>
                <Input name="email" type="email" />
              </div>
              <div>
                <Label className="text-xs">Téléphone</Label>
                <Input name="phone" placeholder="06 …" />
              </div>
            </div>
            <div>
              <Label className="text-xs">LinkedIn (URL)</Label>
              <Input name="linkedin" type="url" placeholder="https://linkedin.com/in/…" />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea name="notes" rows={2} placeholder="Contexte, points clés…" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer"}
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

        {/* ── Liste des contacts ── */}
        {contacts.length === 0 && !adding && (
          <p className="py-4 text-center text-sm text-slate-400">
            Aucun contact. Cliquez sur &quot;Ajouter&quot; pour en créer un.
          </p>
        )}
        <div className="space-y-3">
          {contacts.map((c) => (
            <ContactRow
              key={c.id}
              contact={c}
              commercials={commercials}
              onRemove={() => void remove(c.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ContactRow({
  contact,
  commercials,
  onRemove,
}: {
  contact: Contact;
  commercials: { id: string; name: string }[];
  onRemove: () => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  // champs éditables
  const [firstname, setFirstname] = useState(contact.firstname);
  const [lastname, setLastname] = useState(contact.lastname);
  const [title, setTitle] = useState(contact.title ?? "");
  const [commission, setCommission] = useState(contact.commission ?? "");
  const [email, setEmail] = useState(contact.email ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [linkedin, setLinkedin] = useState(contact.linkedin ?? "");
  const [notes, setNotes] = useState(contact.notes ?? "");
  const [status, setStatus] = useState(contact.contact_status);
  const [owner, setOwner] = useState(contact.contacted_by_commercial_id ?? "none");

  useEffect(() => {
    setFirstname(contact.firstname);
    setLastname(contact.lastname);
    setTitle(contact.title ?? "");
    setCommission(contact.commission ?? "");
    setEmail(contact.email ?? "");
    setPhone(contact.phone ?? "");
    setLinkedin(contact.linkedin ?? "");
    setNotes(contact.notes ?? "");
    setStatus(contact.contact_status);
    setOwner(contact.contacted_by_commercial_id ?? "none");
  }, [contact]);

  async function patch(partial: Record<string, unknown>) {
    const supabase = createClient();
    await supabase
      .from("notary_contacts")
      .update({ ...partial, updated_at: new Date().toISOString() })
      .eq("id", contact.id);
    router.refresh();
  }

  const ownerName =
    owner !== "none"
      ? (commercials.find((c) => c.id === owner)?.name ?? "—")
      : null;

  const statusColor =
    STATUS_COLORS[status] ?? "bg-slate-100 text-slate-600";

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
      {/* ── Header carte ── */}
      <div className="flex items-start justify-between gap-2 p-4">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Prénom</Label>
                  <Input
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                    onBlur={() => {
                      const t = firstname.trim();
                      if (t && t !== contact.firstname) void patch({ firstname: t });
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Nom</Label>
                  <Input
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                    onBlur={() => {
                      const t = lastname.trim();
                      if (t && t !== contact.lastname) void patch({ lastname: t });
                    }}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Titre / Poste</Label>
                  <Input
                    value={title}
                    placeholder="Notaire associé"
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => {
                      const t = title.trim();
                      if (t !== (contact.title ?? "")) void patch({ title: t || null });
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Commission / Rôle</Label>
                  <Input
                    value={commission}
                    placeholder="Président commission formation"
                    onChange={(e) => setCommission(e.target.value)}
                    onBlur={() => {
                      const t = commission.trim();
                      if (t !== (contact.commission ?? ""))
                        void patch({ commission: t || null });
                    }}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => {
                      const t = email.trim();
                      if (t !== (contact.email ?? "")) void patch({ email: t || null });
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Téléphone</Label>
                  <Input
                    value={phone}
                    placeholder="06 …"
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => {
                      const t = phone.trim();
                      if (t !== (contact.phone ?? "")) void patch({ phone: t || null });
                    }}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">LinkedIn (URL)</Label>
                <Input
                  type="url"
                  value={linkedin}
                  placeholder="https://linkedin.com/in/…"
                  onChange={(e) => setLinkedin(e.target.value)}
                  onBlur={() => {
                    const t = linkedin.trim();
                    if (t !== (contact.linkedin ?? ""))
                      void patch({ linkedin: t || null });
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={notes}
                  rows={2}
                  placeholder="Contexte, points clés…"
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() => {
                    const t = notes.trim();
                    if (t !== (contact.notes ?? ""))
                      void patch({ notes: t || null });
                  }}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Nom + badges */}
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-900">
                  {contact.firstname} {contact.lastname}
                </p>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}
                >
                  {CONTACT_STATUS_LABELS[status] ?? status}
                </span>
                {ownerName && (
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                    {ownerName}
                  </span>
                )}
              </div>

              {/* Titre + commission */}
              {(contact.title || contact.commission) && (
                <p className="mt-0.5 text-sm text-slate-500">
                  {[contact.title, contact.commission].filter(Boolean).join(" · ")}
                </p>
              )}

              {/* Coordonnées */}
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-1 text-indigo-600 hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-1 text-indigo-600 hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {contact.phone}
                  </a>
                )}
                {contact.linkedin && (
                  <a
                    href={contact.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-slate-500 hover:text-indigo-600"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                    LinkedIn
                  </a>
                )}
              </div>

              {/* Notes */}
              {contact.notes && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500 italic">
                  <StickyNote className="mt-0.5 h-3 w-3 shrink-0" />
                  {contact.notes}
                </p>
              )}
            </>
          )}
        </div>

        {/* Boutons */}
        <div className="flex shrink-0 gap-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800"
            onClick={() => setEditing((v) => !v)}
            title={editing ? "Fermer" : "Modifier"}
          >
            {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
            onClick={onRemove}
            title="Supprimer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Footer : statut + commercial (toujours visible) ── */}
      {!editing && (
        <div className="grid gap-3 border-t border-slate-100 px-4 py-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Statut</Label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                void patch({ contact_status: v });
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONTACT_STATUS_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Commercial assigné</Label>
            <Select
              value={owner}
              onValueChange={(v) => {
                setOwner(v);
                void patch({ contacted_by_commercial_id: v === "none" ? null : v });
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">
                  —
                </SelectItem>
                {commercials.map((x) => (
                  <SelectItem key={x.id} value={x.id} className="text-xs">
                    {x.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
