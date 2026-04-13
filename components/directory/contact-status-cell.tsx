"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTACT_STATUS_LABELS } from "@/lib/constants";

export function ContactStatusCell({
  contactId,
  value,
}: {
  contactId: string;
  value: string;
}) {
  const router = useRouter();

  async function onChange(nv: string) {
    const supabase = createClient();
    await supabase
      .from("notary_contacts")
      .update({
        contact_status: nv,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contactId);
    router.refresh();
  }

  return (
    <Select value={value} onValueChange={(nv) => void onChange(nv)}>
      <SelectTrigger className="h-8 w-[170px] border-slate-200">
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
  );
}
