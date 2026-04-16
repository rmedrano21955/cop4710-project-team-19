"use client";

import { useState, useEffect } from "react";

type Tab = "drivers" | "constructors" | "circuits";

interface Driver {
  driver_id: number;
  forename: string;
  surname: string;
  number: string | null;
  code: string | null;
  dob: string | null;
  nationality: string | null;
}

interface Constructor {
  constructor_id: number;
  name: string;
  nationality: string | null;
}

interface Circuit {
  circuit_id: number;
  name: string;
  location: string | null;
  country: string | null;
}

function Modal({
  title,
  onClose,
  onSave,
  children,
}: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-5">{title}</h2>
        <div className="space-y-3">{children}</div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onSave}
            className="flex-1 py-2 bg-f1-red hover:bg-f1-red-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-border rounded-lg text-sm hover:bg-muted/20 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
      />
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("drivers");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [constructors, setConstructors] = useState<Constructor[]>([]);
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [modal, setModal] = useState<{ type: "new" | "edit"; entity: any } | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const loadData = async (t: Tab) => {
    if (t === "drivers") {
      const res = await fetch("/api/drivers");
      setDrivers(await res.json());
    } else if (t === "constructors") {
      const res = await fetch("/api/constructors");
      setConstructors(await res.json());
    } else {
      const res = await fetch("/api/circuits");
      setCircuits(await res.json());
    }
  };

  useEffect(() => {
    loadData(tab);
  }, [tab]);

  const openNew = () => {
    setForm({});
    setError(null);
    setModal({ type: "new", entity: null });
  };

  const openEdit = (entity: any) => {
    setError(null);
    const mapped: Record<string, string> = {};
    for (const [k, v] of Object.entries(entity)) {
      if (v !== null && v !== undefined) {
        mapped[k] = String(v).replace("T00:00:00.000Z", "");
      }
    }
    setForm(mapped);
    setModal({ type: "edit", entity });
  };

  const handleSave = async () => {
    setError(null);
    try {
      if (modal?.type === "new") {
        const res = await fetch(`/api/${tab}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error || "Failed to create");
          return;
        }
      } else {
        const id =
          tab === "drivers"
            ? modal?.entity.driver_id
            : tab === "constructors"
            ? modal?.entity.constructor_id
            : modal?.entity.circuit_id;

        const res = await fetch(`/api/${tab}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error || "Failed to update");
          return;
        }
      }
      setModal(null);
      loadData(tab);
    } catch (e) {
      setError("Network error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this record?")) return;
    const res = await fetch(`/api/${tab}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error || "Delete failed");
      return;
    }
    loadData(tab);
  };

  const f = (key: string) => form[key] ?? "";
  const set = (key: string) => (v: string) => setForm((p) => ({ ...p, [key]: v }));

  const tabs: Tab[] = ["drivers", "constructors", "circuits"];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin</h1>

      <div className="flex bg-card border border-border rounded-lg overflow-hidden w-fit mb-8">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm capitalize transition-colors ${
              tab === t ? "bg-f1-red text-white" : "hover:bg-card-hover"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted capitalize">{tab}</p>
        <button
          onClick={openNew}
          className="bg-f1-red hover:bg-f1-red-hover text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          + Add New
        </button>
      </div>

      {tab === "drivers" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Nationality</th>
                <th className="py-3 px-3">Code</th>
                <th className="py-3 px-3">Number</th>
                <th className="py-3 px-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.driver_id} className="border-b border-border/50 hover:bg-card/50">
                  <td className="py-2.5 px-3 font-medium">{d.forename} {d.surname}</td>
                  <td className="py-2.5 px-3 text-muted">{d.nationality}</td>
                  <td className="py-2.5 px-3 font-mono">{d.code || "—"}</td>
                  <td className="py-2.5 px-3 font-mono">{d.number || "—"}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(d)}
                        className="text-xs text-muted hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(d.driver_id)}
                        className="text-xs text-f1-red hover:text-f1-red-hover transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "constructors" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Nationality</th>
                <th className="py-3 px-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {constructors.map((c) => (
                <tr key={c.constructor_id} className="border-b border-border/50 hover:bg-card/50">
                  <td className="py-2.5 px-3 font-medium">{c.name}</td>
                  <td className="py-2.5 px-3 text-muted">{c.nationality}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-xs text-muted hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.constructor_id)}
                        className="text-xs text-f1-red hover:text-f1-red-hover transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "circuits" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">City</th>
                <th className="py-3 px-3">Country</th>
                <th className="py-3 px-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {circuits.map((c) => (
                <tr key={c.circuit_id} className="border-b border-border/50 hover:bg-card/50">
                  <td className="py-2.5 px-3 font-medium">{c.name}</td>
                  <td className="py-2.5 px-3 text-muted">{c.location}</td>
                  <td className="py-2.5 px-3 text-muted">{c.country}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-xs text-muted hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.circuit_id)}
                        className="text-xs text-f1-red hover:text-f1-red-hover transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal
          title={`${modal.type === "new" ? "Add" : "Edit"} ${tab.slice(0, -1)}`}
          onClose={() => setModal(null)}
          onSave={handleSave}
        >
          {tab === "drivers" && (
            <>
              <Field label="First Name" value={f("forename")} onChange={set("forename")} />
              <Field label="Last Name" value={f("surname")} onChange={set("surname")} />
              <Field label="Nationality" value={f("nationality")} onChange={set("nationality")} />
              <Field label="Code (3-letter)" value={f("code")} onChange={set("code")} />
              <Field label="Number" value={f("number")} onChange={set("number")} />
              <Field label="Date of Birth" value={f("dob")} onChange={set("dob")} type="date" />
            </>
          )}
          {tab === "constructors" && (
            <>
              <Field label="Team Name" value={f("name")} onChange={set("name")} />
              <Field label="Nationality" value={f("nationality")} onChange={set("nationality")} />
            </>
          )}
          {tab === "circuits" && (
            <>
              <Field label="Circuit Name" value={f("name")} onChange={set("name")} />
              <Field label="City / Location" value={f("location")} onChange={set("location")} />
              <Field label="Country" value={f("country")} onChange={set("country")} />
            </>
          )}
          {error && <p className="text-f1-red text-sm">{error}</p>}
        </Modal>
      )}
    </div>
  );
}
