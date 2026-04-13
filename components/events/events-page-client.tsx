"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventFormSheet } from "@/components/events/event-form-sheet";

type Commercial = { id: string; name: string };

export function EventsPageClient({ commercials }: { commercials: Commercial[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2 shadow-sm">
        <Plus className="h-4 w-4" />
        Nouvel événement
      </Button>
      <EventFormSheet
        open={open}
        onOpenChange={setOpen}
        commercials={commercials}
      />
    </>
  );
}
