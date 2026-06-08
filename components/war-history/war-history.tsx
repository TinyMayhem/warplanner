"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCompact, formatNumber } from "@/lib/calculations";
import { useWarPlannerStore } from "@/store/war-planner-store";
import type { Alliance, WarRecord } from "@/lib/types";

type WarFormState = Omit<WarRecord, "id" | "copperDelta" | "workspaceId">;

export function WarHistory() {
  const activeWorkspaceId = useWarPlannerStore((state) => state.activeWorkspaceId);
  const allAlliances = useWarPlannerStore((state) => state.alliances);
  const allWarRecords = useWarPlannerStore((state) => state.warRecords);
  const deleteWarRecord = useWarPlannerStore((state) => state.deleteWarRecord);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [allianceFilter, setAllianceFilter] = useState("All");
  const [resultFilter, setResultFilter] = useState<"All" | "win" | "loss">("All");
  const alliances = useMemo(() => allAlliances.filter((alliance) => alliance.workspaceId === activeWorkspaceId), [activeWorkspaceId, allAlliances]);
  const warRecords = useMemo(() => allWarRecords.filter((record) => record.workspaceId === activeWorkspaceId), [activeWorkspaceId, allWarRecords]);
  const filteredRecords = useMemo(
    () =>
      [...warRecords]
        .filter((record) => allianceFilter === "All" || record.allianceId === allianceFilter)
        .filter((record) => resultFilter === "All" || record.result === resultFilter)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [allianceFilter, resultFilter, warRecords]
  );
  const stats = useMemo(() => buildWarStats(filteredRecords), [filteredRecords]);

  if (alliances.length === 0) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-bold text-zinc-50">War history needs alliances first</h3>
        <p className="mt-2 text-sm text-zinc-400">Add alliances before logging war records.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="mb-4 flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-md border border-command-copper/50 bg-command-copper/15">
            <CalendarClock className="size-5 text-command-copper" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-50">Add War Record</h3>
            <p className="text-sm text-zinc-400">Log copper movement, result, observed attendance, activity, and notes.</p>
          </div>
        </div>
        <WarRecordForm alliances={alliances} />
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Records" value={stats.count.toString()} />
        <Metric label="Wins" value={stats.wins.toString()} />
        <Metric label="Losses" value={stats.losses.toString()} />
        <Metric label="Net Copper" value={formatCompact(stats.netCopper)} />
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Select value={allianceFilter} onChange={(event) => setAllianceFilter(event.target.value)}>
            <option value="All">All alliances</option>
            {alliances.map((alliance) => (
              <option key={alliance.id} value={alliance.id}>
                {alliance.name} | Server {alliance.serverNumber}
              </option>
            ))}
          </Select>
          <Select value={resultFilter} onChange={(event) => setResultFilter(event.target.value as "All" | "win" | "loss")}>
            <option value="All">All results</option>
            <option value="win">Wins</option>
            <option value="loss">Losses</option>
          </Select>
          <Badge tone="copper">{filteredRecords.length} shown</Badge>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="table-scroll overflow-x-auto">
          <table className="w-full min-w-[1060px] border-collapse text-left text-sm">
            <thead className="bg-command-900 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <Th>Date</Th>
                <Th>Alliance</Th>
                <Th>Opponent</Th>
                <Th>Result</Th>
                <Th>Copper</Th>
                <Th>Attendance</Th>
                <Th>Activity</Th>
                <Th>Notes</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length ? (
                filteredRecords.map((record) =>
                  editingId === record.id ? (
                    <tr key={record.id} className="border-t border-command-700 bg-command-900/70">
                      <td colSpan={9} className="p-4">
                        <WarRecordForm alliances={alliances} record={record} onDone={() => setEditingId(null)} />
                      </td>
                    </tr>
                  ) : (
                    <WarRecordRow
                      key={record.id}
                      record={record}
                      alliance={alliances.find((item) => item.id === record.allianceId)}
                      onEdit={() => setEditingId(record.id)}
                      onDelete={() => deleteWarRecord(record.id)}
                    />
                  )
                )
              ) : (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-zinc-400">
                    No war records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-4 text-lg font-bold text-zinc-50">Timeline</h3>
        <div className="space-y-3">
          {filteredRecords.slice(0, 12).map((record) => (
            <TimelineItem key={record.id} record={record} alliance={alliances.find((item) => item.id === record.allianceId)} />
          ))}
          {filteredRecords.length === 0 && <p className="text-sm text-zinc-400">No timeline entries yet.</p>}
        </div>
      </Card>
    </div>
  );
}

function WarRecordForm({ alliances, record, onDone }: { alliances: Alliance[]; record?: WarRecord; onDone?: () => void }) {
  const addWarRecord = useWarPlannerStore((state) => state.addWarRecord);
  const updateWarRecord = useWarPlannerStore((state) => state.updateWarRecord);
  const firstAlliance = alliances[0];
  const defaultState: WarFormState = {
    allianceId: firstAlliance.id,
    date: new Date().toISOString().slice(0, 10),
    enemyAllianceId: "",
    enemyAllianceName: "",
    copperBefore: 0,
    copperAfter: 0,
    result: "win",
    observedAttendance: 50,
    observedActivity: 5,
    notes: ""
  };
  const [form, setForm] = useState<WarFormState>(record ? stripRecordId(record) : defaultState);

  function update<K extends keyof WarFormState>(key: K, value: WarFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function numberValue(value: string) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const selectedEnemy = alliances.find((alliance) => alliance.id === form.enemyAllianceId);
    const normalized = {
      ...form,
      enemyAllianceId: form.enemyAllianceId || undefined,
      enemyAllianceName: selectedEnemy?.name || form.enemyAllianceName.trim() || "Unknown opponent"
    };

    if (record) updateWarRecord(record.id, normalized);
    else {
      addWarRecord(normalized);
      setForm(defaultState);
    }

    onDone?.();
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-4">
        <FieldLabel label="Our alliance">
          <Select value={form.allianceId} onChange={(event) => update("allianceId", event.target.value)}>
            {alliances.map((alliance) => (
              <option key={alliance.id} value={alliance.id}>
                {alliance.name} | Server {alliance.serverNumber}
              </option>
            ))}
          </Select>
        </FieldLabel>
        <FieldLabel label="War date">
          <Input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} />
        </FieldLabel>
        <FieldLabel label="Enemy alliance">
          <Select value={form.enemyAllianceId ?? ""} onChange={(event) => update("enemyAllianceId", event.target.value)}>
            <option value="">Manual / unknown</option>
            {alliances
              .filter((alliance) => alliance.id !== form.allianceId)
              .map((alliance) => (
                <option key={alliance.id} value={alliance.id}>
                  {alliance.name} | Server {alliance.serverNumber}
                </option>
              ))}
          </Select>
        </FieldLabel>
        <FieldLabel label="Manual enemy name">
          <Input value={form.enemyAllianceName} placeholder="Opponent name" onChange={(event) => update("enemyAllianceName", event.target.value)} />
        </FieldLabel>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <NumberField label="Copper before" value={form.copperBefore} onChange={(value) => update("copperBefore", value)} numberValue={numberValue} />
        <NumberField label="Copper after" value={form.copperAfter} onChange={(value) => update("copperAfter", value)} numberValue={numberValue} />
        <FieldLabel label="Result">
          <Select value={form.result} onChange={(event) => update("result", event.target.value as "win" | "loss")}>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
          </Select>
        </FieldLabel>
        <NumberField label="Observed attendance %" min={0} max={100} value={form.observedAttendance} onChange={(value) => update("observedAttendance", value)} numberValue={numberValue} />
        <NumberField label="Observed activity 1-10" min={1} max={10} value={form.observedActivity} onChange={(value) => update("observedActivity", value)} numberValue={numberValue} />
      </div>

      <FieldLabel label="Notes">
        <Textarea value={form.notes} placeholder="War notes, timing, target behavior, or tactical observations" onChange={(event) => update("notes", event.target.value)} />
      </FieldLabel>

      <div className="flex flex-wrap gap-2">
        <Button type="submit">
          {record ? <Save className="size-4" /> : <Plus className="size-4" />}
          {record ? "Save Record" : "Add War Record"}
        </Button>
        {record && (
          <Button type="button" variant="ghost" onClick={onDone}>
            <X className="size-4" />
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function WarRecordRow({ record, alliance, onEdit, onDelete }: { record: WarRecord; alliance?: Alliance; onEdit: () => void; onDelete: () => void }) {
  const deltaTone = record.copperDelta >= 0 ? "text-command-green" : "text-command-red";

  return (
    <tr className="border-t border-command-700 align-top hover:bg-command-800/60">
      <Td>{new Date(record.date).toLocaleDateString()}</Td>
      <Td>
        <p className="font-semibold text-zinc-100">{alliance?.name ?? "Deleted alliance"}</p>
        {alliance && <p className="text-xs text-zinc-500">Server {alliance.serverNumber}</p>}
      </Td>
      <Td>{record.enemyAllianceName}</Td>
      <Td>
        <Badge tone={record.result === "win" ? "green" : "red"}>{record.result}</Badge>
      </Td>
      <Td>
        <p className={deltaTone}>{formatCompact(record.copperDelta)}</p>
        <p className="text-xs text-zinc-500">
          {formatCompact(record.copperBefore)} to {formatCompact(record.copperAfter)}
        </p>
      </Td>
      <Td>{formatNumber(record.observedAttendance)}%</Td>
      <Td>{record.observedActivity}/10</Td>
      <Td>
        <p className="max-w-[240px] truncate text-zinc-400">{record.notes || "No notes"}</p>
      </Td>
      <Td>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="size-10 px-0" title="Edit record" onClick={onEdit}>
            <Pencil className="size-4" />
          </Button>
          <Button type="button" variant="danger" className="size-10 px-0" title="Delete record" onClick={onDelete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </Td>
    </tr>
  );
}

function TimelineItem({ record, alliance }: { record: WarRecord; alliance?: Alliance }) {
  return (
    <div className="grid gap-3 rounded-md border border-command-700 bg-command-900 p-3 sm:grid-cols-[9rem_1fr_auto]">
      <p className="text-sm font-semibold text-command-amber">{new Date(record.date).toLocaleDateString()}</p>
      <div>
        <p className="font-semibold text-zinc-100">
          {alliance?.name ?? "Deleted alliance"} vs {record.enemyAllianceName}
        </p>
        <p className="mt-1 text-sm text-zinc-400">{record.notes || "No notes recorded."}</p>
      </div>
      <div className="flex items-center gap-2 sm:justify-end">
        <Badge tone={record.result === "win" ? "green" : "red"}>{record.result}</Badge>
        <Badge tone={record.copperDelta >= 0 ? "green" : "red"}>{formatCompact(record.copperDelta)}</Badge>
      </div>
    </div>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-command-amber">{label}</span>
      {children}
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
  numberValue
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  numberValue: (value: string) => number;
}) {
  return (
    <FieldLabel label={label}>
      <Input type="number" min={min} max={max} value={value} onChange={(event) => onChange(numberValue(event.target.value))} />
    </FieldLabel>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-zinc-50">{value}</p>
    </Card>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap px-4 py-3 font-semibold">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3">{children}</td>;
}

function stripRecordId(record: WarRecord): WarFormState {
  return {
    allianceId: record.allianceId,
    date: record.date,
    enemyAllianceId: record.enemyAllianceId ?? "",
    enemyAllianceName: record.enemyAllianceName,
    copperBefore: record.copperBefore,
    copperAfter: record.copperAfter,
    result: record.result,
    observedAttendance: record.observedAttendance,
    observedActivity: record.observedActivity,
    notes: record.notes
  };
}

function buildWarStats(records: WarRecord[]) {
  return {
    count: records.length,
    wins: records.filter((record) => record.result === "win").length,
    losses: records.filter((record) => record.result === "loss").length,
    netCopper: records.reduce((total, record) => total + record.copperDelta, 0)
  };
}
