"use client";

import React, { useState, useEffect, useMemo } from "react";
import Select from "@/components/Select";

type SortKey = "name" | "name_desc" | "country" | "city";

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

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name",      label: "Name (A–Z)" },
  { value: "name_desc", label: "Name (Z–A)" },
  { value: "country",   label: "Country (A–Z)" },
  { value: "city",      label: "City (A–Z)" },
];

function sortCircuits(list: Circuit[], key: SortKey): Circuit[] {
  return [...list].sort((a, b) => {
    switch (key) {
      case "name":      return a.name.localeCompare(b.name);
      case "name_desc": return b.name.localeCompare(a.name);
      case "country":   return (a.country || "").localeCompare(b.country || "") || a.name.localeCompare(b.name);
      case "city":      return (a.location || "").localeCompare(b.location || "") || a.name.localeCompare(b.name);
    }
  });
}

export default function CircuitsPage() {
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, CircuitDetail>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/circuits")
      .then((r) => r.json())
      .then((data) => { setCircuits(data); setLoading(false); });
  }, []);

  const sorted = useMemo(() => sortCircuits(circuits, sortKey), [circuits, sortKey]);

  const toggleExpand = async (id: number) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!details[id]) {
      const res = await fetch(`/api/circuits/${id}`);
      const data = res.ok ? await res.json() : { race_history: [] };
      setDetails((prev) => ({ ...prev, [id]: data }));
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Circuits</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
        <span className="self-center text-xs text-muted ml-1">
          {sorted.length} circuit{sorted.length !== 1 ? "s" : ""}
        </span>
      </div>

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
              {sorted.map((c) => (
                <React.Fragment key={c.circuit_id}>
                  <tr
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
                    <tr className="bg-card/30">
                      <td colSpan={4} className="px-6 py-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-muted border-b border-border/50">
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
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
