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

export type TrendPoint = {
  taken_at: string;
  score: number;
  quiz_id: string;
};

export function ScoreTrendChart({ points }: { points: TrendPoint[] }) {
  // Recharts assumes a chronological X axis — reverse so oldest is first.
  const data = [...points]
    .reverse()
    .map((p) => ({
      score: p.score,
      label: new Date(p.taken_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    }));

  return (
    <div
      className="h-64 w-full rounded-3xl border border-stone-200 bg-white p-4"
      data-testid="score-trend-chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e7e5e4" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#a8a29e"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#a8a29e"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip
            cursor={{ stroke: "#a8a29e", strokeDasharray: "3 3" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e7e5e4",
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#1c1917"
            strokeWidth={2}
            dot={{ r: 4, fill: "#1c1917" }}
            activeDot={{ r: 6 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
