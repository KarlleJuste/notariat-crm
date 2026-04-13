"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyEUR } from "@/lib/utils";

type EventRow = { name: string; demos: number; converted: number; mrr: number };

export function DashboardCharts({ eventData }: { eventData: EventRow[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Démos bookées par événement</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          {eventData.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun événement.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={eventData}
                margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 10 }}
                  stroke="#94a3b8"
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
                <Bar dataKey="demos" name="Démos" fill="#6366f1" radius={[0, 6, 6, 0]} />
                <Bar dataKey="converted" name="Convertis" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">MRR généré par événement</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          {eventData.every((e) => e.mrr === 0) ? (
            <p className="text-sm text-slate-500">
              Aucun MRR enregistré — les démos converties avec un MRR Stripe apparaîtront ici.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={eventData}
                margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 10 }}
                  stroke="#94a3b8"
                />
                <Tooltip
                  formatter={(v: number) => formatCurrencyEUR(v)}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
                <Bar dataKey="mrr" name="MRR" fill="#4f46e5" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
