"use client";

import { useState, useEffect } from "react";

interface Constructor {
  constructor_id: number;
  name: string;
  nationality: string;
  driver_count: number;
}

interface ConstructorDetail extends Constructor {
  drivers: { driver_id: number; driver_name: string; nationality: string }[];
}

export default function ConstructorsPage() {
  const [constructors, setConstructors] = useState<Constructor[]>([]);
  const [selected, setSelected] = useState<ConstructorDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/constructors")
      .then((r) => r.json())
      .then((data) => {
        setConstructors(data);
        setLoading(false);
      });
  }, []);

  const openDetail = async (id: number) => {
    const res = await fetch(`/api/constructors/${id}`);
    const data = await res.json();
    setSelected(data);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Constructors</h1>

      {loading ? (
        <p className="text-muted text-center py-16">Loading constructors...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {constructors.map((c) => (
            <button
              key={c.constructor_id}
              onClick={() => openDetail(c.constructor_id)}
              className="bg-card border border-border rounded-lg p-5 text-left hover:bg-card-hover hover:border-f1-red/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-semibold">{c.name}</h2>
                <span className="text-xs text-muted bg-border rounded px-2 py-1 shrink-0 ml-2">
                  {c.nationality}
                </span>
              </div>
              <p className="text-sm text-muted mt-3">
                {c.driver_count} driver{c.driver_count !== 1 ? "s" : ""}
              </p>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-card border border-border rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold">{selected.name}</h2>
              <span className="text-sm text-muted">{selected.nationality}</span>
            </div>
            <p className="text-sm text-muted mb-5">
              {selected.drivers.length} driver{selected.drivers.length !== 1 ? "s" : ""}
            </p>

            <div className="space-y-1">
              {selected.drivers.map((d) => (
                <div
                  key={d.driver_id}
                  className="flex items-center justify-between py-2 px-3 rounded bg-background"
                >
                  <span className="text-sm font-medium">{d.driver_name}</span>
                  <span className="text-xs text-muted">{d.nationality}</span>
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
