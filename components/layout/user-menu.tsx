"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function UserMenu({ email }: { email: string | null }) {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 border-t border-slate-200/80 p-4">
      <p className="truncate text-xs text-slate-500">{email ?? "—"}</p>
      <Button
        variant="ghost"
        size="sm"
        className="justify-start text-slate-600"
        onClick={() => void logout()}
      >
        <LogOut className="h-4 w-4" />
        Déconnexion
      </Button>
    </div>
  );
}
