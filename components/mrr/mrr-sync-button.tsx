"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function MrrSyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/stripe/sync", { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        unattributedCount?: number;
      };
      if (!res.ok) {
        setMsg(data.error ?? "Erreur sync");
      } else {
        setMsg(
          `Sync OK. Non attribués : ${data.unattributedCount ?? 0}.`
        );
        router.refresh();
      }
    } catch {
      setMsg("Erreur réseau");
    }
    setLoading(false);
  }

  const ok = msg && !msg.startsWith("Erreur");

  return (
    <div className="flex w-full max-w-md flex-col items-stretch gap-2 sm:items-end">
      <Button
        variant="secondary"
        className="gap-2"
        disabled={loading}
        aria-busy={loading}
        onClick={() => void run()}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-indigo-600" aria-hidden />
        ) : (
          <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
        )}
        <span className={cn(loading && "text-slate-600")}>
          {loading ? "Synchronisation…" : "Synchroniser Stripe / conversions"}
        </span>
      </Button>
      <div
        className="min-h-[2.75rem] rounded-lg border px-3 py-2 text-sm sm:text-right"
        role="status"
        aria-live="polite"
      >
        {loading && (
          <span className="text-slate-500">Synchronisation en cours…</span>
        )}
        {!loading && msg && (
          <span className={ok ? "font-medium text-emerald-700" : "font-medium text-red-700"}>
            {msg}
          </span>
        )}
        {!loading && !msg && (
          <span className="text-slate-400">Résultat affiché ici après la sync.</span>
        )}
      </div>
    </div>
  );
}
