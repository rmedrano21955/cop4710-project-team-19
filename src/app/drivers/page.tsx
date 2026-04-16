"use client";

import { useState, useEffect } from "react";

interface Driver {
  driver_id: number;
  number: string | null;
  code: string | null;
  forename: string;
  surname: string;
  dob: string | null;
  nationality: string;
  headshot_url: string | null;
}

interface DriverDetail extends Driver {
  stats: {
    total_races: number;
    wins: number;
    podiums: number;
    total_points: number;
  };
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [nationalities, setNationalities] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [nationality, setNationality] = useState("");
  const [selected, setSelected] = useState<DriverDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDrivers = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (nationality) params.set("nationality", nationality);
    setLoading(true);
    fetch(`/api/drivers?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setDrivers(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDrivers();
  }, [nationality]);

  useEffect(() => {
    fetch("/api/drivers/nationalities")
      .then((r) => r.json())
      .then(setNationalities);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchDrivers, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const openDetail = async (id: number) => {
    const res = await fetch(`/api/drivers/${id}`);
    const data = await res.json();
    setSelected(data);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Drivers</h1>

      <div className="flex flex-wrap gap-4 mb-8">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-card border border-border rounded-lg px-4 py-2 text-sm w-64"
        />
        <select
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          className="bg-card border border-border rounded-lg px-4 py-2 text-sm"
        >
          <option value="">All Nationalities</option>
          {nationalities.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-muted text-center py-16">Loading drivers...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {drivers.map((d) => (
            <button
              key={d.driver_id}
              onClick={() => openDetail(d.driver_id)}
              className="bg-card border border-border rounded-lg p-4 text-left hover:bg-card-hover hover:border-f1-red/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-border flex items-center justify-center text-muted text-sm overflow-hidden shrink-0">
                  {d.headshot_url ? (
                    <img src={d.headshot_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    d.code || d.surname.slice(0, 3).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{d.forename} {d.surname}</p>
                  <p className="text-sm text-muted">{d.nationality}</p>
                </div>
              </div>
              <div className="flex gap-4 mt-3 text-xs text-muted">
                {d.number && <span>#{d.number}</span>}
                {d.code && <span className="font-mono">{d.code}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {drivers.length === 0 && !loading && (
        <p className="text-muted text-center py-16">No drivers found</p>
      )}

      {selected && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-card border border-border rounded-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-border flex items-center justify-center text-muted overflow-hidden shrink-0">
                {selected.headshot_url ? (
                  <img src={selected.headshot_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{selected.code || "?"}</span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">{selected.forename} {selected.surname}</h2>
                <p className="text-muted">{selected.nationality}</p>
                {selected.dob && (
                  <p className="text-sm text-muted">
                    Born {new Date(selected.dob).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric"
                    })}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Races", value: selected.stats.total_races },
                { label: "Wins", value: selected.stats.wins },
                { label: "Podiums", value: selected.stats.podiums },
                { label: "Points", value: Number(selected.stats.total_points).toFixed(0) },
              ].map((s) => (
                <div key={s.label} className="bg-background rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold font-mono">{s.value}</p>
                  <p className="text-xs text-muted mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelected(null)}
              className="mt-6 w-full py-2 bg-border rounded-lg text-sm hover:bg-muted/20 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
