"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";

interface Driver {
  driver_id: number;
  forename: string;
  surname: string;
  code: string | null;
}

interface Stats {
  driver_id: number;
  races: number;
  wins: number;
  podiums: number;
  total_points: number;
  dnfs: number;
  avg_grid: number;
}

interface CumulativePoint {
  driver_id: number;
  year: number;
  round: number;
  race_name: string;
  race_points: number;
  cumulative_points: number;
}

function StatCard({ label, v1, v2 }: { label: string; v1: string | number; v2: string | number }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <p className="text-xs text-muted uppercase tracking-wider mb-3">{label}</p>
      <div className="flex justify-between items-end">
        <span className="text-2xl font-bold font-mono text-f1-red">{v1}</span>
        <span className="text-2xl font-bold font-mono text-white/80">{v2}</span>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [seasons, setSeasons] = useState<number[]>([]);
  const [d1, setD1] = useState<number | null>(null);
  const [d2, setD2] = useState<number | null>(null);
  const [fromYear, setFromYear] = useState<number | null>(null);
  const [toYear, setToYear] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/drivers")
      .then((r) => r.json())
      .then(setDrivers);
    fetch("/api/seasons")
      .then((r) => r.json())
      .then((data: number[]) => {
        setSeasons(data);
        if (data.length > 0) {
          setToYear(data[0]);
          setFromYear(data[data.length - 1]);
        }
      });
  }, []);

  const fetchComparison = async () => {
    if (!d1 || !d2 || !fromYear || !toYear) return;
    setLoading(true);
    const res = await fetch(
      `/api/compare?d1=${d1}&d2=${d2}&from=${fromYear}&to=${toYear}`
    );
    const data = await res.json();
    setStats(data.stats);

    const cumulative: CumulativePoint[] = data.cumulative;
    const raceKeys = [
      ...new Map(
        cumulative.map((p) => [`${p.year}-${p.round}`, `${p.year} R${p.round}`])
      ).entries(),
    ];

    const byDriver: Record<number, Record<string, number>> = {};
    for (const p of cumulative) {
      const key = `${p.year}-${p.round}`;
      if (!byDriver[p.driver_id]) byDriver[p.driver_id] = {};
      byDriver[p.driver_id][key] = Number(p.cumulative_points);
    }

    const merged = raceKeys.map(([key, label]) => {
      const entry: any = { race: label };
      if (d1 && byDriver[d1]) entry.d1 = byDriver[d1][key] ?? null;
      if (d2 && byDriver[d2]) entry.d2 = byDriver[d2][key] ?? null;
      return entry;
    });

    setChartData(merged);
    setLoading(false);
  };

  const d1Driver = drivers.find((d) => d.driver_id === d1);
  const d2Driver = drivers.find((d) => d.driver_id === d2);
  const s1 = stats.find((s) => s.driver_id === d1);
  const s2 = stats.find((s) => s.driver_id === d2);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Head-to-Head Compare</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={d1 ?? ""}
          onChange={(e) => setD1(e.target.value ? parseInt(e.target.value) : null)}
          className="bg-card border border-border rounded-lg px-4 py-2 text-sm flex-1 min-w-[180px]"
        >
          <option value="">Driver 1</option>
          {drivers.map((d) => (
            <option key={d.driver_id} value={d.driver_id}>
              {d.forename} {d.surname}
            </option>
          ))}
        </select>

        <select
          value={d2 ?? ""}
          onChange={(e) => setD2(e.target.value ? parseInt(e.target.value) : null)}
          className="bg-card border border-border rounded-lg px-4 py-2 text-sm flex-1 min-w-[180px]"
        >
          <option value="">Driver 2</option>
          {drivers.map((d) => (
            <option key={d.driver_id} value={d.driver_id}>
              {d.forename} {d.surname}
            </option>
          ))}
        </select>

        <select
          value={fromYear ?? ""}
          onChange={(e) => setFromYear(parseInt(e.target.value))}
          className="bg-card border border-border rounded-lg px-4 py-2 text-sm"
        >
          {[...seasons].reverse().map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select
          value={toYear ?? ""}
          onChange={(e) => setToYear(parseInt(e.target.value))}
          className="bg-card border border-border rounded-lg px-4 py-2 text-sm"
        >
          {seasons.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <button
          onClick={fetchComparison}
          disabled={!d1 || !d2 || !fromYear || !toYear}
          className="bg-f1-red hover:bg-f1-red-hover text-white rounded-lg px-6 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Compare
        </button>
      </div>

      {loading && <p className="text-muted text-center py-16">Loading comparison...</p>}

      {!loading && stats.length > 0 && s1 && s2 && (
        <div>
          <div className="flex justify-between text-sm text-muted mb-4 px-1">
            <span className="text-f1-red font-semibold">
              {d1Driver?.forename} {d1Driver?.surname}
            </span>
            <span className="font-semibold">
              {d2Driver?.forename} {d2Driver?.surname}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            <StatCard label="Wins" v1={s1.wins} v2={s2.wins} />
            <StatCard label="Podiums" v1={s1.podiums} v2={s2.podiums} />
            <StatCard label="Points" v1={Number(s1.total_points).toFixed(0)} v2={Number(s2.total_points).toFixed(0)} />
            <StatCard label="DNFs" v1={s1.dnfs} v2={s2.dnfs} />
            <StatCard label="Avg Grid" v1={s1.avg_grid} v2={s2.avg_grid} />
          </div>

          {chartData.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h2 className="text-sm font-semibold text-muted mb-4 uppercase tracking-wider">
                Cumulative Points
              </h2>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis
                    dataKey="race"
                    tick={{ fontSize: 10, fill: "#888" }}
                    interval={Math.floor(chartData.length / 10)}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#888" }} />
                  <Tooltip
                    contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8 }}
                    labelStyle={{ color: "#888", fontSize: 11 }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="d1"
                    name={`${d1Driver?.forename} ${d1Driver?.surname}`}
                    stroke="#e10600"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="d2"
                    name={`${d2Driver?.forename} ${d2Driver?.surname}`}
                    stroke="#ffffff"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {!loading && d1 && d2 && stats.length === 0 && (
        <p className="text-muted text-center py-16">
          No data found for this combination
        </p>
      )}

      {!d1 && !d2 && (
        <p className="text-muted text-center py-16">
          Select two drivers and a year range to compare
        </p>
      )}
    </div>
  );
}
