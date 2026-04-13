"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrencyEUR } from "@/lib/utils";

type ManagerPoint = { month: string; total: number };
type CommercialPoint = { month: string; mrr: number };

export function MrrLineChartManager({ data }: { data: ManagerPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => formatCurrencyEUR(v)} />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#4f46e5"
          strokeWidth={2}
          dot={false}
          name="Total"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MrrLineChartCommercial({ data }: { data: CommercialPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => formatCurrencyEUR(v)} />
        <Line
          type="monotone"
          dataKey="mrr"
          stroke="#4f46e5"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
