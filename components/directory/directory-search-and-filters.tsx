"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ORG_TYPE_BADGE,
  ORG_TYPE_LABELS,
  ORG_TYPES,
  type OrgType,
} from "@/lib/constants";

const DEBOUNCE_MS = 300;

function parseTypes(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function buildQueryString(q: string, types: string[]): string {
  const p = new URLSearchParams();
  const qq = q.trim();
  if (qq) p.set("q", qq);
  if (types.length) p.set("type", types.join(","));
  return p.toString();
}

export function DirectorySearchAndFilters({
  initialQ,
  initialType,
}: {
  initialQ?: string;
  initialType?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialQ ?? "");

  useEffect(() => {
    setQ(initialQ ?? "");
  }, [initialQ]);

  const selectedTypes = useMemo(
    () => parseTypes(searchParams.get("type") ?? initialType ?? null),
    [searchParams, initialType]
  );

  const replaceUrl = useCallback(
    (nextQ: string, types: string[]) => {
      const qs = buildQueryString(nextQ, types);
      const href = qs ? `${pathname}?${qs}` : pathname;
      const cur =
        pathname +
        (searchParams.toString() ? `?${searchParams.toString()}` : "");
      if (href === cur) return;
      router.replace(href, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      const types = parseTypes(searchParams.get("type") ?? initialType ?? null);
      replaceUrl(q, types);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [q, replaceUrl, searchParams, initialType]);

  function toggleType(t: OrgType) {
    const set = new Set(selectedTypes);
    if (set.has(t)) set.delete(t);
    else set.add(t);
    replaceUrl(q, Array.from(set));
  }

  function clearTypes() {
    replaceUrl(q, []);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Type
        </span>
        <Button
          type="button"
          variant={selectedTypes.length === 0 ? "default" : "secondary"}
          size="sm"
          className="h-8"
          onClick={() => clearTypes()}
        >
          Tous
        </Button>
        {ORG_TYPES.map((t) => {
          const on = selectedTypes.includes(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggleType(t)}
              className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Badge
                variant={on ? ORG_TYPE_BADGE[t] : "secondary"}
                className={`cursor-pointer px-2.5 py-0.5 text-xs transition-opacity ${
                  on ? "" : "opacity-70 hover:opacity-100"
                }`}
              >
                {ORG_TYPE_LABELS[t]}
              </Badge>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[220px] max-w-md flex-1 space-y-1">
          <label htmlFor="dir-search-q" className="text-xs text-slate-500">
            Recherche (mise à jour automatique)
          </label>
          <Input
            id="dir-search-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, sigle, ville…"
            className="h-10"
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}
