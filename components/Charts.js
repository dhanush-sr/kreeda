"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const GREENS = ["#005532", "#136f45", "#2d6a48", "#4f9a6f", "#84d8a5", "#b0f1c7"];
const axis = { fontSize: 12, fill: "#6f7a71" };
const tip = { contentStyle: { borderRadius: 12, border: "1px solid #bec9bf", fontSize: 12 } };

export function Bars({ data, x, y, height = 240, unit = "", highlight = 3 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e7eeff" />
        <XAxis dataKey={x} tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} />
        <Tooltip {...tip} cursor={{ fill: "#f0f3ff" }} formatter={(v) => `${v}${unit}`} />
        <Bar dataKey={y} radius={[8, 8, 0, 0]} label={{ position: "top", fontSize: 11, fill: "#005532", fontWeight: 700 }}>
          {data.map((_, i) => (
            <Cell key={i} fill={i < highlight ? GREENS[i] : "#bec9bf"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Trend({ data, height = 260 }) {
  const rows = data.map((d) => ({ ...d, label: d.day.slice(8, 10) + "/" + d.day.slice(5, 7) }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="played" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#136f45" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#136f45" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#e7eeff" />
        <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} interval={3} />
        <YAxis tick={axis} axisLine={false} tickLine={false} />
        <Tooltip {...tip} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="played" name="Played / booked" stroke="#005532" strokeWidth={2} fill="url(#played)" />
        <Area type="monotone" dataKey="no_shows" name="No-shows" stroke="#d97706" strokeWidth={2} fill="#fde68a" fillOpacity={0.4} />
        <Area type="monotone" dataKey="cancelled" name="Cancelled" stroke="#ba1a1a" strokeWidth={2} fill="#ffdad6" fillOpacity={0.4} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, height = 220 }) {
  const colors = { Completed: "#005532", Upcoming: "#84d8a5", "No-show": "#f59e0b", Cancelled: "#ba1a1a" };
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="90%" paddingAngle={2} stroke="none">
            {data.map((d) => (
              <Cell key={d.name} fill={colors[d.name] ?? "#bec9bf"} />
            ))}
          </Pie>
          <Tooltip {...tip} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-on-surface">{total.toLocaleString("en-IN")}</span>
        <span className="text-xs text-outline">bookings</span>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs text-on-surface-variant">
        {data.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[d.name] }} />
            {d.name} · {d.value}
          </span>
        ))}
      </div>
    </div>
  );
}

export function WeekBars({ data, height = 140 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
        <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip {...tip} cursor={{ fill: "#f0f3ff" }} />
        <Bar dataKey="played" name="Played" stackId="a" fill="#136f45" radius={[0, 0, 0, 0]} />
        <Bar dataKey="no_shows" name="No-shows" stackId="a" fill="#f59e0b" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
