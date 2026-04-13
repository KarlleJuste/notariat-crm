"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EventsCommercialFilter({
  commercials,
}: {
  commercials: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("commercial") ?? "all";

  function setCommercial(id: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (id === "all") p.delete("commercial");
    else p.set("commercial", id);
    const qs = p.toString();
    router.replace(qs ? `/events?${qs}` : "/events", { scroll: false });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Commercial
      </span>
      <Select value={current} onValueChange={setCommercial}>
        <SelectTrigger className="h-10 w-[200px] bg-white">
          <SelectValue placeholder="Tous" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les commerciaux</SelectItem>
          {commercials.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
