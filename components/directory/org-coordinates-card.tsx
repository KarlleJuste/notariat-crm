"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type OrgCoords = {
  id: string;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  departments: string[] | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  description: string | null;
};

export function OrgCoordinatesCard({ org }: { org: OrgCoords }) {
  const router = useRouter();
  const [address, setAddress] = useState(org.address ?? "");
  const [postalCode, setPostalCode] = useState(org.postal_code ?? "");
  const [city, setCity] = useState(org.city ?? "");
  const [website, setWebsite] = useState(org.website ?? "");
  const [email, setEmail] = useState(org.email ?? "");
  const [phone, setPhone] = useState(org.phone ?? "");
  const [description, setDescription] = useState(org.description ?? "");
  const [saved, setSaved] = useState(false);

  const flashSaved = useCallback(() => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }, []);

  async function save(partial: Record<string, unknown>) {
    const supabase = createClient();
    const { error } = await supabase
      .from("notary_orgs")
      .update({ ...partial, updated_at: new Date().toISOString() })
      .eq("id", org.id);
    if (!error) {
      flashSaved();
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">Coordonnées</CardTitle>
        {saved && (
          <span className="text-xs font-medium text-emerald-600" aria-live="polite">
            ✓ Sauvegardé
          </span>
        )}
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Adresse</Label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onBlur={() =>
              void save({ address: address.trim() || null })
            }
            placeholder="Numéro, rue…"
          />
        </div>
        <div className="space-y-2">
          <Label>Code postal</Label>
          <Input
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            onBlur={() =>
              void save({ postal_code: postalCode.trim() || null })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Ville</Label>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onBlur={() => void save({ city: city.trim() || null })}
          />
        </div>
        {org.departments && org.departments.length > 0 && (
          <div className="space-y-2 sm:col-span-2">
            <Label>Département(s)</Label>
            <p className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-800">
              {org.departments.join(" · ")}
            </p>
          </div>
        )}
        <div className="space-y-2">
          <Label>Site web</Label>
          <Input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            onBlur={() => void save({ website: website.trim() || null })}
            placeholder="https://…"
          />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => void save({ email: email.trim() || null })}
          />
        </div>
        <div className="space-y-2">
          <Label>Téléphone</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => void save({ phone: phone.trim() || null })}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() =>
              void save({ description: description.trim() || null })
            }
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
