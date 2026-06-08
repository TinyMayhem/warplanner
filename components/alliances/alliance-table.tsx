"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { projectedCopper, formatCompact, threatWeight } from "@/lib/calculations";
import { AllianceForm } from "@/components/alliances/alliance-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useWarPlannerStore } from "@/store/war-planner-store";
import type { Alliance, AllianceFilters, RelationStatus, ThreatTier } from "@/lib/types";

const threatTiers: ThreatTier[] = ["S", "A", "B", "C", "D", "Unknown"];
const relations: RelationStatus[] = ["ally", "enemy", "neutral"];

export function AllianceTable() {
  const activeWorkspaceId = useWarPlannerStore((state) => state.activeWorkspaceId);
  const allAlliances = useWarPlannerStore((state) => state.alliances);
  const filters = useWarPlannerStore((state) => state.filters);
  const updateAlliance = useWarPlannerStore((state) => state.updateAlliance);
  const deleteAlliance = useWarPlannerStore((state) => state.deleteAlliance);
  const [editingId, setEditingId] = useState<string | null>(null);
  const workspaceAlliances = useMemo(() => allAlliances.filter((alliance) => alliance.workspaceId === activeWorkspaceId), [activeWorkspaceId, allAlliances]);
  const alliances = useMemo(() => filterAndSortAlliances(workspaceAlliances, filters), [workspaceAlliances, filters]);

  if (alliances.length === 0) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-bold text-zinc-50">No alliances tracked yet</h3>
        <p className="mt-2 text-sm text-zinc-400">Add your first alliance to begin building the intelligence database.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="table-scroll overflow-x-auto">
        <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
          <thead className="bg-command-900 text-xs uppercase tracking-[0.14em] text-zinc-500">
            <tr>
              <Th>Alliance</Th>
              <Th>Status</Th>
              <Th>Copper</Th>
              <Th>Copper/hr</Th>
              <Th>Projection</Th>
              <Th>Power</Th>
              <Th>Activity</Th>
              <Th>Attendance</Th>
              <Th>Threat</Th>
              <Th>Updated</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {alliances.map((alliance) =>
              editingId === alliance.id ? (
                <tr key={alliance.id} className="border-t border-command-700 bg-command-900/70">
                  <td colSpan={11} className="p-4">
                    <AllianceForm alliance={alliance} onDone={() => setEditingId(null)} />
                  </td>
                </tr>
              ) : (
                <AllianceRow
                  key={alliance.id}
                  alliance={alliance}
                  onEdit={() => setEditingId(alliance.id)}
                  onDelete={() => deleteAlliance(alliance.id)}
                  onQuickUpdate={updateAlliance}
                />
              )
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AllianceRow({
  alliance,
  onEdit,
  onDelete,
  onQuickUpdate
}: {
  alliance: Alliance;
  onEdit: () => void;
  onDelete: () => void;
  onQuickUpdate: (id: string, patch: Partial<Omit<Alliance, "id">>) => void;
}) {
  const relationTone = alliance.relation === "ally" ? "green" : alliance.relation === "enemy" ? "red" : "neutral";
  const projectionText = `1h ${formatCompact(projectedCopper(alliance, 1))} | 6h ${formatCompact(projectedCopper(alliance, 6))} | 12h ${formatCompact(projectedCopper(alliance, 12))} | 24h ${formatCompact(projectedCopper(alliance, 24))}`;

  return (
    <tr className="border-t border-command-700 align-top hover:bg-command-800/60">
      <Td>
        <div>
          <p className="font-semibold text-zinc-50">{alliance.name}</p>
          <p className="text-xs text-zinc-500">Server {alliance.serverNumber}</p>
        </div>
      </Td>
      <Td>
        <Select value={alliance.relation} onChange={(event) => onQuickUpdate(alliance.id, { relation: event.target.value as RelationStatus })}>
          {relations.map((relation) => (
            <option key={relation} value={relation}>
              {relation}
            </option>
          ))}
        </Select>
        <Badge tone={relationTone} className="mt-2">
          {alliance.relation}
        </Badge>
      </Td>
      <Td>
        <QuickNumber value={alliance.currentCopper} onChange={(value) => onQuickUpdate(alliance.id, { currentCopper: value })} />
      </Td>
      <Td>
        <QuickNumber value={alliance.copperPerHour} onChange={(value) => onQuickUpdate(alliance.id, { copperPerHour: value })} />
      </Td>
      <Td>
        <p className="max-w-[190px] text-xs leading-5 text-zinc-300">{projectionText}</p>
      </Td>
      <Td>
        <p className="font-semibold text-zinc-100">{formatCompact(alliance.topThirtyHeroPower)}</p>
        <p className="text-xs text-zinc-500">Avg {formatCompact(alliance.averageTopThirtyHeroPower)}</p>
      </Td>
      <Td>
        <QuickNumber min={1} max={10} value={alliance.activityRating} onChange={(value) => onQuickUpdate(alliance.id, { activityRating: value })} />
        <p className="mt-1 text-xs text-zinc-500">{alliance.activityConfidence}</p>
      </Td>
      <Td>
        <p className="text-zinc-100">W {alliance.attendanceWednesday}%</p>
        <p className="text-zinc-100">S {alliance.attendanceSaturday}%</p>
        <p className="text-xs text-zinc-500">{alliance.attendanceConfidence}</p>
      </Td>
      <Td>
        <Select value={alliance.threatTier} onChange={(event) => onQuickUpdate(alliance.id, { threatTier: event.target.value as ThreatTier })}>
          {threatTiers.map((tier) => (
            <option key={tier} value={tier}>
              {tier}
            </option>
          ))}
        </Select>
      </Td>
      <Td>
        <p className="text-xs text-zinc-400">{new Date(alliance.lastUpdatedAt).toLocaleString()}</p>
      </Td>
      <Td>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="size-10 px-0" title="Edit alliance" onClick={onEdit}>
            <Pencil className="size-4" />
          </Button>
          <Button type="button" variant="danger" className="size-10 px-0" title="Delete alliance" onClick={onDelete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </Td>
    </tr>
  );
}

function QuickNumber({ value, min, max, onChange }: { value: number; min?: number; max?: number; onChange: (value: number) => void }) {
  return (
    <Input
      type="number"
      min={min}
      max={max}
      value={value}
      className="w-28"
      onChange={(event) => {
        const parsed = Number(event.target.value);
        onChange(Number.isFinite(parsed) ? parsed : 0);
      }}
    />
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap px-4 py-3 font-semibold">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3">{children}</td>;
}

function filterAndSortAlliances(alliances: Alliance[], filters: AllianceFilters) {
  const search = filters.search.trim().toLowerCase();

  return alliances
    .filter((alliance) => {
      const matchesSearch = !search || alliance.name.toLowerCase().includes(search) || alliance.notes.toLowerCase().includes(search);
      const matchesServer = filters.serverId === "All" || alliance.serverId === filters.serverId;
      const matchesTier = filters.threatTier === "All" || alliance.threatTier === filters.threatTier;
      const matchesRelation = filters.relation === "All" || alliance.relation === filters.relation;
      return matchesSearch && matchesServer && matchesTier && matchesRelation;
    })
    .sort((a, b) => {
      const direction = filters.sortDirection === "asc" ? 1 : -1;
      if (filters.sortKey === "threatTier") return (threatWeight(a.threatTier) - threatWeight(b.threatTier)) * direction;
      return ((a[filters.sortKey] as number) - (b[filters.sortKey] as number)) * direction;
    });
}
