"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PRIMMO_GATE_EMAIL } from "@/lib/primmo-gate";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const pwd = password.trim();
    if (!pwd) {
      setError("Saisissez le mot de passe.");
      return;
    }

    setLoading(true);
    try {
      const ensure = await fetch("/api/auth/ensure-gate-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      const ensureJson = (await ensure.json()) as { error?: string };

      if (!ensure.ok) {
        setLoading(false);
        setError(ensureJson.error ?? "Accès refusé");
        return;
      }

      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({
        email: PRIMMO_GATE_EMAIL,
        password: pwd,
      });

      if (err) {
        setLoading(false);
        setError(err.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessayez.");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md border-slate-200 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Accès Primmo
          </CardTitle>
          <CardDescription>
            Entrez le mot de passe équipe pour ouvrir le CRM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion…" : "Entrer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
