"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/layout/user-menu";
import type { AppProfile } from "@/lib/auth";

const commercialNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, managerOnly: true },
  { href: "/events", label: "Événements", icon: CalendarDays },
] as const;

const directoryNav = [
  { href: "/directory", label: "Annuaire", icon: Building2 },
] as const;

export function Sidebar({
  profile,
  userEmail,
}: {
  profile: AppProfile | null;
  userEmail: string | null;
}) {
  const pathname = usePathname();
  const isManager = profile?.app_role === "manager";

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-slate-200 bg-white shadow-sm">
      <div className="flex h-14 items-center border-b border-slate-100 px-5">
        <Link
          href={isManager ? "/dashboard" : "/events"}
          className="text-sm font-semibold tracking-tight text-slate-900"
        >
          CRM Notariat
        </Link>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
        <div>
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Commercial
          </p>
          <ul className="space-y-0.5">
            {commercialNav.map((item) => {
              if ("managerOnly" in item && item.managerOnly && !isManager) return null;
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-80" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        {isManager && (
          <div>
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Paramètres
            </p>
            <ul className="space-y-0.5">
              <li>
                <Link
                  href="/settings/team"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname.startsWith("/settings")
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Settings className="h-4 w-4 shrink-0 opacity-80" />
                  Équipe & HubSpot
                </Link>
              </li>
            </ul>
          </div>
        )}
        <div>
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Annuaire
          </p>
          <ul className="space-y-0.5">
            {directoryNav.map((item) => {
              const active =
                pathname === "/directory" ||
                pathname.startsWith("/directory/");
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-80" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
      <UserMenu email={userEmail} />
    </aside>
  );
}
