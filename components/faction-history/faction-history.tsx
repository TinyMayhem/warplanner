"use client";

import { useMemo, useState } from "react";
import { History, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useWarPlannerStore } from "@/store/war-planner-store";
import type { Alliance, FactionBattleDifficulty, FactionBattleRecord } from "@/lib/types";

type FactionFormState = Omit<FactionBattleRecord, "id" | "workspaceId" | "createdAt" | "updatedAt">;

const difficulties: FactionBattleDifficulty[] = ["Easy", "Medium", "Difficult"];
const battleSummaries = ["Clean win", "Close win", "Hard-fought win", "Close loss", "Heavy loss", "Low activity", "High activity", "One-sided battle", "Even fight", "Unknown"];

export function FactionHistory() {
  const activeWorkspaceId = useWarPlannerStore((state) => state.activeWorkspaceId);
  const allAlliances = useWarPlannerStore((state) => state.alliances);
  const allRecords = useWarPlannerStore((state) => state.factionBattleRecords);
  const deleteRecord = useWarPlannerStore((state) => state.deleteFactionBattleRecord);
  const alliances = useMemo(() => allAlliances.filter((alliance) => alliance.workspaceId === activeWorkspaceId), [activeWorkspaceId, allAlliances]);
  const records = useMemo(() => allRecords.filter((record) => record.workspaceId === activeWorkspaceId), [activeWorkspaceId, allRecords]);
  const [allianceFilter, setAllianceFilter] = useState("All");
  const [difficultyFilter, setDifficultyFilter] = useState<FactionBattleDifficulty | "All">("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const filteredRecords = useMemo(
    () =>
      [...records]
        .filter((record) => allianceFilter === "All" || record.factionAAllianceId === allianceFilter || record.factionBAllianceId === allianceFilter)
        .filter((record) => difficultyFilter === "All" || record.difficulty === difficultyFilter)
        .sort((a, b) => new Date(b.weekOf).getTime() - new Date(a.weekOf).getTime()),
    [allianceFilter, difficultyFilter, records]
  );
  const stats = useMemo(() => buildStats(filteredRecords), [filteredRecords]);

  if (alliances.length < 2) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-bold text-zinc-50">Faction history needs at least two alliances</h3>
        <p className="mt-2 text-sm text-zinc-400">Add alliances first, then record who fought who each week.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="mb-4 flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-md border border-command-copper/50 bg-command-copper/15">
            <History className="size-5 text-command-copper" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-50">Add Faction Battle</h3>
            <p className="text-sm text-zinc-400">Track weekly faction matchups, winners, battle difficulty, and how the fight went.</p>
          </div>
        </div>
        <FactionRecordForm alliances={alliances} />
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Battles" value={stats.count.toString()} />
        <Metric label="Easy" value={stats.easy.toString()} />
        <Metric label="Medium" value={stats.medium.toString()} />
        <Metric label="Difficult" value={stats.difficult.toString()} />
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
          <Select value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value as FactionBattleDifficulty | "All")}>
            <option value="All">All difficulties</option>
            {difficulties.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </Select>
          <Badge tone="copper">{filteredRecords.length} shown</Badge>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="table-scroll overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
            <thead className="bg-command-900 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <Th>Week</Th>
                <Th>Faction A</Th>
                <Th>Faction B</Th>
                <Th>Winner</Th>
                <Th>Difficulty</Th>
                <Th>Battle</Th>
                <Th>Notes</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length ? (
                filteredRecords.map((record) =>
                  editingId === record.id ? (
                    <tr key={record.id} className="border-t border-command-700 bg-command-900/70">
                      <td colSpan={8} className="p-4">
                        <FactionRecordForm alliances={alliances} record={record} onDone={() => setEditingId(null)} />
                      </td>
                    </tr>
                  ) : (
                    <FactionRecordRow key={record.id} record={record} onEdit={() => setEditingId(record.id)} onDelete={() => deleteRecord(record.id)} />
                  )
                )
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-zinc-400">
                    No faction battles match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function FactionRecordForm({ alliances, record, onDone }: { alliances: Alliance[]; record?: FactionBattleRecord; onDone?: () => void }) {
  const addRecord = useWarPlannerStore((state) => state.addFactionBattleRecord);
  const updateRecord = useWarPlannerStore((state) => state.updateFactionBattleRecord);
  const defaultState: FactionFormState = {
    weekOf: new Date().toISOString().slice(0, 10),
    factionAAllianceId: alliances[0].id,
    factionAName: alliances[0].name,
    factionBAllianceId: alliances[1]?.id ?? alliances[0].id,
    factionBName: alliances[1]?.name ?? alliances[0].name,
    winner: "Unknown",
    difficulty: "Medium",
    battleSummary: "",
    notes: ""
  };
  const [form, setForm] = useState<FactionFormState>(record ? stripRecord(record) : defaultState);
  const factionA = alliances.find((alliance) => alliance.id === form.factionAAllianceId) ?? alliances[0];
  const factionB = alliances.find((alliance) => alliance.id === form.factionBAllianceId) ?? alliances.find((alliance) => alliance.id !== factionA.id) ?? alliances[0];

  function update<K extends keyof FactionFormState>(key: K, value: FactionFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const normalized = {
      ...form,
      factionAAllianceId: factionA.id,
      factionAName: factionA.name,
      factionBAllianceId: factionB.id,
      factionBName: factionB.name
    };

    if (record) updateRecord(record.id, normalized);
    else {
      addRecord(normalized);
      setForm(defaultState);
    }

    onDone?.();
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-3">
        <FieldLabel label="Week of">
          <Input type="date" value={form.weekOf} onChange={(event) => update("weekOf", event.target.value)} />
        </FieldLabel>
        <FieldLabel label="Faction A">
          <Select value={form.factionAAllianceId} onChange={(event) => update("factionAAllianceId", event.target.value)}>
            {alliances.map((alliance) => (
              <option key={alliance.id} value={alliance.id}>
                {alliance.name} | Server {alliance.serverNumber}
              </option>
            ))}
          </Select>
        </FieldLabel>
        <FieldLabel label="Faction B">
          <Select value={form.factionBAllianceId} onChange={(event) => update("factionBAllianceId", event.target.value)}>
            {alliances
              .filter((alliance) => alliance.id !== form.factionAAllianceId)
              .map((alliance) => (
                <option key={alliance.id} value={alliance.id}>
                  {alliance.name} | Server {alliance.serverNumber}
                </option>
              ))}
          </Select>
        </FieldLabel>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <FieldLabel label="Winner">
          <Select value={form.winner} onChange={(event) => update("winner", event.target.value as FactionBattleRecord["winner"])}>
            <option value="Unknown">Unknown</option>
            <option value="A">{factionA.name}</option>
            <option value="B">{factionB.name}</option>
            <option value="Draw">Draw</option>
          </Select>
        </FieldLabel>
        <FieldLabel label="Difficulty for winner">
          <Select value={form.difficulty} onChange={(event) => update("difficulty", event.target.value as FactionBattleDifficulty)}>
            {difficulties.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </Select>
        </FieldLabel>
        <FieldLabel label="How the battle went">
          <Select value={form.battleSummary} onChange={(event) => update("battleSummary", event.target.value)}>
            <option value="">Select summary</option>
            {battleSummaries.map((summary) => (
              <option key={summary} value={summary}>
                {summary}
              </option>
            ))}
          </Select>
        </FieldLabel>
      </div>

      <FieldLabel label="Notes">
        <Textarea value={form.notes} placeholder="Weekly notes, turnout, tactics, surprises, or future expectations" onChange={(event) => update("notes", event.target.value)} />
      </FieldLabel>

      <div className="flex flex-wrap gap-2">
        <Button type="submit">
          {record ? <Save className="size-4" /> : <Plus className="size-4" />}
          {record ? "Save Battle" : "Add Battle"}
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

function FactionRecordRow({ record, onEdit, onDelete }: { record: FactionBattleRecord; onEdit: () => void; onDelete: () => void }) {
  return (
    <tr className="border-t border-command-700 align-top hover:bg-command-800/60">
      <Td>{new Date(record.weekOf).toLocaleDateString()}</Td>
      <Td>{record.factionAName}</Td>
      <Td>{record.factionBName}</Td>
      <Td>
        <Badge tone={record.winner === "Unknown" ? "neutral" : record.winner === "Draw" ? "copper" : "green"}>{winnerLabel(record)}</Badge>
      </Td>
      <Td>
        <Badge tone={record.difficulty === "Easy" ? "green" : record.difficulty === "Medium" ? "copper" : "red"}>{record.difficulty}</Badge>
      </Td>
      <Td>
        <p className="max-w-[220px] truncate text-zinc-300">{record.battleSummary || "No summary"}</p>
      </Td>
      <Td>
        <p className="max-w-[260px] truncate text-zinc-400">{record.notes || "No notes"}</p>
      </Td>
      <Td>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="size-10 px-0" title="Edit battle" onClick={onEdit}>
            <Pencil className="size-4" />
          </Button>
          <Button type="button" variant="danger" className="size-10 px-0" title="Delete battle" onClick={onDelete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </Td>
    </tr>
  );
}

function winnerLabel(record: FactionBattleRecord) {
  if (record.winner === "A") return record.factionAName;
  if (record.winner === "B") return record.factionBName;
  return record.winner;
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-command-amber">{label}</span>
      {children}
    </label>
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

function stripRecord(record: FactionBattleRecord): FactionFormState {
  return {
    weekOf: record.weekOf,
    factionAAllianceId: record.factionAAllianceId,
    factionAName: record.factionAName,
    factionBAllianceId: record.factionBAllianceId,
    factionBName: record.factionBName,
    winner: record.winner,
    difficulty: record.difficulty,
    battleSummary: record.battleSummary,
    notes: record.notes
  };
}

function buildStats(records: FactionBattleRecord[]) {
  return {
    count: records.length,
    easy: records.filter((record) => record.difficulty === "Easy").length,
    medium: records.filter((record) => record.difficulty === "Medium").length,
    difficult: records.filter((record) => record.difficulty === "Difficult").length
  };
}
