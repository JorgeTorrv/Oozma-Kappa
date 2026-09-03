"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/page";

const PALETTE = [
  "#1d4ed8",
  "#0891b2",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#dc2626",
  "#4f46e5",
  "#0d9488",
];

const axis = { fontSize: 11, fill: "#64748b" } as const;

function ChartShell({
  title,
  description,
  empty,
  children,
}: {
  title: string;
  description?: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {empty ? (
          <EmptyState
            title="Sin datos suficientes"
            description="Aún no hay movimientos para graficar."
            className="border-0 py-8"
          />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {children as React.ReactElement}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function BarChartCard({
  title,
  description,
  data,
  xKey,
  yKey,
  color = PALETTE[0],
}: {
  title: string;
  description?: string;
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  color?: string;
}) {
  return (
    <ChartShell title={title} description={description} empty={data.length === 0}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey={xKey} tick={axis} tickLine={false} axisLine={false} />
        <YAxis tick={axis} tickLine={false} axisLine={false} width={44} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
        />
        <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ChartShell>
  );
}

export function LineChartCard({
  title,
  description,
  data,
  xKey,
  yKey,
}: {
  title: string;
  description?: string;
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
}) {
  const empty = data.every((d) => Number(d[yKey]) === 0);
  return (
    <ChartShell title={title} description={description} empty={empty}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey={xKey} tick={axis} tickLine={false} axisLine={false} />
        <YAxis tick={axis} tickLine={false} axisLine={false} width={44} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
        />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={PALETTE[1]}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartShell>
  );
}

export function PieChartCard({
  title,
  description,
  data,
  nameKey,
  valueKey,
}: {
  title: string;
  description?: string;
  data: Record<string, string | number>[];
  nameKey: string;
  valueKey: string;
}) {
  return (
    <ChartShell title={title} description={description} empty={data.length === 0}>
      <PieChart>
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
        />
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={(e: { name?: string }) => e.name ?? ""}
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
      </PieChart>
    </ChartShell>
  );
}
