"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PipelineCommercialPicker({
  commercials,
  currentCommercialId,
}: {
  commercials: { id: string; name: string }[];
  currentCommercialId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setCommercial(id: string) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("commercial", id);
    router.replace(`/pipeline?${p.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Vue pour
      </span>
      <Select value={currentCommercialId} onValueChange={setCommercial}>
        <SelectTrigger className="h-10 w-[220px] bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
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
