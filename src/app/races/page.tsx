"use client";

import { useState, useEffect } from "react";

interface Race {
  race_id: number;
  year: number;
  round: number;
  name: string;
  date: string;
  circuit_name: string;
  country: string;
}

interface Result {
  position: number;
  position_text: string;
  driver_name: string;
  driver_id: number;
  constructor_name: string;
  grid: number;
  points: number;
  fastest_lap_time: string | null;
  laps: number;
  status: string;
}

export default function RacesPage() {
  const [seasons, setSeasons] = useState<number[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/seasons")
      .then((r) => r.json())
      .then(setSeasons);
  }, []);

  useEffect(() => {
    if (!selectedSeason) return;
    setSelectedRace(null);
    setResults([]);
    fetch(`/api/races?season=${selectedSeason}`)
      .then((r) => r.json())
      .then(setRaces);
  }, [selectedSeason]);

  useEffect(() => {
    if (!selectedRace) return;
    setLoading(true);
    fetch(`/api/races/${selectedRace.race_id}/results`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data);
        setLoading(false);
      });
  }, [selectedRace]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Race Results</h1>

      <div className="flex flex-wrap gap-4 mb-8">
        <select
          value={selectedSeason ?? ""}
          onChange={(e) => setSelectedSeason(e.target.value ? parseInt(e.target.value) : null)}
          className="bg-card border border-border rounded-lg px-4 py-2 text-sm"
        >
          <option value="">Select Season</option>
          {seasons.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select
          value={selectedRace?.race_id ?? ""}
          onChange={(e) => {
            const race = races.find((r) => r.race_id === parseInt(e.target.value));
            setSelectedRace(race || null);
          }}
          disabled={!selectedSeason}
          className="bg-card border border-border rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          <option value="">Select Race</option>
          {races.map((r) => (
            <option key={r.race_id} value={r.race_id}>
              Round {r.round} — {r.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedSeason && (
        <p className="text-muted text-center py-16">Select a season to view races</p>
      )}

      {selectedSeason && !selectedRace && races.length > 0 && (
        <p className="text-muted text-center py-16">Select a race to view results</p>
      )}

      {loading && <p className="text-muted text-center py-16">Loading results...</p>}

      {selectedRace && results.length > 0 && !loading && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {selectedRace.name} — {selectedRace.circuit_name}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="py-3 px-3 w-12">Pos</th>
                  <th className="py-3 px-3">Driver</th>
                  <th className="py-3 px-3">Constructor</th>
                  <th className="py-3 px-3 text-right">Grid</th>
                  <th className="py-3 px-3 text-right">Points</th>
                  <th className="py-3 px-3 text-right">Fastest Lap</th>
                  <th className="py-3 px-3 text-right">Laps</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.position} className="border-b border-border/50 hover:bg-card/50">
                    <td className="py-2.5 px-3 font-mono">{r.position_text}</td>
                    <td className="py-2.5 px-3 font-medium">{r.driver_name}</td>
                    <td className="py-2.5 px-3 text-muted">{r.constructor_name}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{r.grid}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{r.points}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-muted">
                      {r.fastest_lap_time || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">{r.laps}</td>
                    <td className="py-2.5 px-3 text-muted">
                      {r.status === "Finished" ? (
                        <span className="text-green-500">Finished</span>
                      ) : (
                        <span className="text-f1-red">{r.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
