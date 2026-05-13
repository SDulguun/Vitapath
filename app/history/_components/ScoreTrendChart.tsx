"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
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

const SAGE = "var(--color-sage)";
const SAGE_SOFT = "var(--color-sage-soft)";
const INK_MUTED = "var(--color-ink-muted)";

/** Sage-toned area chart of the user's score over time. Strips Recharts'
 *  default gridlines; the only reference is a faint horizontal line at the
 *  scoring baseline (70). Hides the chart border per brief §2.6. */
export function ScoreTrendChart({ points }: { points: TrendPoint[] }) {
  // Oldest → newest left-to-right.
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
      className="h-64 w-full"
      data-testid="score-trend-chart"
      aria-label="Score trend over time"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="vp-trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SAGE_SOFT} stopOpacity={0.6} />
              <stop offset="100%" stopColor={SAGE_SOFT} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="transparent" />
          <ReferenceLine
            y={70}
            stroke={INK_MUTED}
            strokeDasharray="3 4"
            strokeOpacity={0.35}
            ifOverflow="extendDomain"
          />
          <XAxis
            dataKey="label"
            stroke={INK_MUTED}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            stroke={INK_MUTED}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip
            cursor={{ stroke: INK_MUTED, strokeDasharray: "3 3" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--color-sage-soft)",
              background: "var(--color-surface)",
              fontSize: 12,
              color: "var(--color-ink)",
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke={SAGE}
            strokeWidth={2}
            fill="url(#vp-trend-fill)"
            fillOpacity={1}
            dot={{ r: 3.5, fill: SAGE, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: SAGE, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
