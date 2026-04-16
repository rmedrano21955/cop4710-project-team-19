"use client";

import { useState, useEffect } from "react";

interface Circuit {
  circuit_id: number;
  name: string;
  location: string;
  country: string;
}

interface RaceHistory {
  year: number;
  race_name: string;
  winner: string | null;
}

interface CircuitDetail extends Circuit {
  race_history: RaceHistory[];
}

export default function CircuitsPage() {
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, CircuitDetail>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/circuits")
      .then((r) => r.json())
      .then((data) => {
        setCircuits(data);
        setLoading(false);
      });
  }, []);

  const toggleExpand = async (id: number) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!details[id]) {
      const res = await fetch(`/api/circuits/${id}`);
      const data = await res.json();
      setDetails((prev) => ({ ...prev, [id]: data }));
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Circuits</h1>

      {loading ? (
        <p className="text-muted text-center py-16">Loading circuits...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-3 px-3">Circuit</th>
                <th className="py-3 px-3">City</th>
                <th className="py-3 px-3">Country</th>
                <th className="py-3 px-3 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {circuits.map((c) => (
                <>
                  <tr
                    key={c.circuit_id}
                    onClick={() => toggleExpand(c.circuit_id)}
                    className="border-b border-border/50 hover:bg-card/50 cursor-pointer"
                  >
                    <td className="py-3 px-3 font-medium">{c.name}</td>
                    <td className="py-3 px-3 text-muted">{c.location}</td>
                    <td className="py-3 px-3 text-muted">{c.country}</td>
                    <td className="py-3 px-3 text-muted text-center">
                      {expanded === c.circuit_id ? "▲" : "▼"}
                    </td>
                  </tr>
                  {expanded === c.circuit_id && details[c.circuit_id] && (
                    <tr key={`${c.circuit_id}-detail`} className="bg-card/30">
                      <td colSpan={4} className="px-6 py-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-muted border-b border-border/50 mb-2">
                              <th className="py-1.5 pr-6 w-16">Year</th>
                              <th className="py-1.5 pr-6">Race</th>
                              <th className="py-1.5">Winner</th>
                            </tr>
                          </thead>
                          <tbody>
                            {details[c.circuit_id].race_history.map((r) => (
                              <tr key={r.year} className="border-b border-border/30">
                                <td className="py-1.5 pr-6 font-mono text-muted">{r.year}</td>
                                <td className="py-1.5 pr-6">{r.race_name}</td>
                                <td className="py-1.5 font-medium">
                                  {r.winner || <span className="text-muted">—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
