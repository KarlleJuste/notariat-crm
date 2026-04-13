"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { formatCurrencyEUR } from "@/lib/utils";

type DemoRow = {
  id: string;
  hubspot_deal_id: string;
  deal_name: string | null;
  contact_name: string | null;
  contact_company: string | null;
  contact_email: string | null;
  stage: string | null;
  is_converted: boolean;
  is_churned: boolean;
  stripe_mrr: number | null;
  events: { name: string } | null;
  commercials: { name: string } | null;
};

export function DemoPanel({
  demo,
  onClose,
}: {
  demo: DemoRow | null;
  onClose: () => void;
}) {
  const portal = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID;
  const hubUrl =
    demo && portal
      ? `https://app.hubspot.com/contacts/${portal}/record/0-3/${demo.hubspot_deal_id}`
      : null;

  return (
    <Sheet open={!!demo} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        {demo && (
          <>
            <SheetHeader>
              <SheetTitle>
                {demo.contact_name ?? demo.deal_name ?? "Démo"}
              </SheetTitle>
              <SheetDescription>
                {demo.contact_company ?? "—"} · {demo.contact_email ?? "—"}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase text-slate-400">
                  Stage HubSpot
                </p>
                <p className="mt-1 text-slate-800">{demo.stage ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-400">
                  Événement
                </p>
                <p className="mt-1 text-slate-800">{demo.events?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-400">
                  Commercial
                </p>
                <p className="mt-1 text-slate-800">
                  {demo.commercials?.name ?? "—"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {demo.is_converted ? (
                  <Badge variant="success">Converti</Badge>
                ) : (
                  <Badge variant="secondary">Non converti</Badge>
                )}
                {demo.is_churned && <Badge variant="slate">Churn</Badge>}
              </div>
              {demo.is_converted && (
                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    MRR Stripe
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {demo.stripe_mrr != null
                      ? formatCurrencyEUR(Number(demo.stripe_mrr))
                      : "—"}
                  </p>
                </div>
              )}
              {hubUrl ? (
                <Button asChild variant="secondary" className="w-full">
                  <a href={hubUrl} target="_blank" rel="noreferrer">
                    Ouvrir dans HubSpot
                  </a>
                </Button>
              ) : (
                <p className="font-mono text-xs text-slate-500">
                  Deal ID : {demo.hubspot_deal_id}
                </p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
