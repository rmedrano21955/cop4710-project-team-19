"use client";

import { useState, useEffect } from "react";

interface Standing {
  position: number;
  driver_id?: number;
  constructor_id?: number;
  driver_name?: string;
  constructor_name?: string;
  nationality: string;
  points: number;
  wins: number;
}

const podiumColors: Record<number, string> = {
  1: "border-l-4 border-l-gold",
  2: "border-l-4 border-l-silver",
  3: "border-l-4 border-l-bronze",
};

export default function StandingsPage() {
  const [seasons, setSeasons] = useState<number[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [tab, setTab] = useState<"drivers" | "constructors">("drivers");
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/seasons")
      .then((r) => r.json())
      .then((data) => {
        setSeasons(data);
        if (data.length > 0) setSelectedSeason(data[0]);
      });
  }, []);

  useEffect(() => {
    if (!selectedSeason) return;
    setLoading(true);
    fetch(`/api/standings/${tab}?season=${selectedSeason}`)
      .then((r) => r.json())
      .then((data) => {
        setStandings(data);
        setLoading(false);
      });
  }, [selectedSeason, tab]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Championship Standings</h1>

      <div className="flex flex-wrap items-center gap-4 mb-8">
        <select
          value={selectedSeason ?? ""}
          onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
          className="bg-card border border-border rounded-lg px-4 py-2 text-sm"
        >
          {seasons.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <div className="flex bg-card border border-border rounded-lg overflow-hidden">
          {(["drivers", "constructors"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm capitalize transition-colors ${
                tab === t ? "bg-f1-red text-white" : "hover:bg-card-hover"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-muted text-center py-16">Loading standings...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-3 px-3 w-12">Pos</th>
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Nationality</th>
                <th className="py-3 px-3 text-right">Wins</th>
                <th className="py-3 px-3 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s) => (
                <tr
                  key={s.position}
                  className={`border-b border-border/50 hover:bg-card/50 ${podiumColors[s.position] || ""}`}
                >
                  <td className="py-2.5 px-3 font-mono font-bold">{s.position}</td>
                  <td className="py-2.5 px-3 font-medium">
                    {s.driver_name || s.constructor_name}
                  </td>
                  <td className="py-2.5 px-3 text-muted">{s.nationality}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{s.wins}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    {Number(s.points).toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
