"use client";

import { useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { currentCopperNow, formatCompact, projectedCopper } from "@/lib/calculations";
import { isSupabaseConfigured, loadPlannerSnapshot } from "@/lib/supabase-sync";
import type { Alliance, PlannerState } from "@/lib/types";

export function SharedAllianceView() {
  const [code, setCode] = useState("");
  const [plannerState, setPlannerState] = useState<PlannerState | null>(null);
  const [workspaceId, setWorkspaceId] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const activeWorkspaceId = workspaceId || plannerState?.activeWorkspaceId || plannerState?.workspaces[0]?.id || "";
  const alliances = useMemo(
    () =>
      (plannerState?.alliances ?? [])
        .filter((alliance) => alliance.workspaceId === activeWorkspaceId)
        .filter((alliance) => !search.trim() || alliance.name.toLowerCase().includes(search.trim().toLowerCase()))
        .sort((a, b) => currentCopperNow(b) - currentCopperNow(a)),
    [activeWorkspaceId, plannerState?.alliances, search]
  );
  const servers = useMemo(() => (plannerState?.servers ?? []).filter((server) => server.workspaceId === activeWorkspaceId), [activeWorkspaceId, plannerState?.servers]);

  async function loadSharedCode() {
    setError("");
    setIsLoading(true);

    try {
      const snapshot = await loadPlannerSnapshot(code);
      setPlannerState(snapshot.plannerState);
      setWorkspaceId(snapshot.plannerState.activeWorkspaceId);
      setUpdatedAt(snapshot.updatedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load shared alliance data.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-command-950 px-4 py-5 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-4">
        <Card className="p-4">
          <div className="mb-4 flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-md border border-command-copper/50 bg-command-copper/15">
              <Eye className="size-5 text-command-copper" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-command-amber">View Only</p>
              <h1 className="text-2xl font-bold text-zinc-50">Shared Alliance Intelligence</h1>
              <p className="text-sm text-zinc-400">Load a shared code to view alliance data. This page has no edit controls.</p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <label className="grid gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-command-amber">Shared code</span>
              <Input value={code} placeholder="Enter shared code" onChange={(event) => setCode(event.target.value)} />
            </label>
            <Button type="button" disabled={!isSupabaseConfigured() || isLoading} onClick={loadSharedCode}>
              <Eye className="size-4" />
              Load View
            </Button>
          </div>

          {!isSupabaseConfigured() && (
            <p className="mt-3 rounded-md border border-command-700 bg-command-900 p-3 text-sm text-command-amber">
              Supabase is not configured for this deployment.
            </p>
          )}
          {error && <p className="mt-3 rounded-md border border-command-red bg-command-900 p-3 text-sm text-command-red">{error}</p>}
        </Card>

        {plannerState && (
          <>
            <Card className="p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr] xl:grid-cols-[1fr_1fr_1fr_auto]">
                <Select value={activeWorkspaceId} onChange={(event) => setWorkspaceId(event.target.value)}>
                  {plannerState.workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </option>
                  ))}
                </Select>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                  <Input className="pl-9" value={search} placeholder="Search alliances" onChange={(event) => setSearch(event.target.value)} />
                </div>
                <Badge tone="copper">{alliances.length} alliances</Badge>
                <Badge tone="neutral">Updated {new Date(updatedAt).toLocaleString()}</Badge>
              </div>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Servers" value={servers.length.toString()} />
              <Metric label="Alliances" value={alliances.length.toString()} />
              <Metric label="Total Copper" value={formatCompact(alliances.reduce((total, alliance) => total + currentCopperNow(alliance), 0))} />
              <Metric label="Total Power" value={formatCompact(alliances.reduce((total, alliance) => total + alliance.topThirtyHeroPower, 0))} />
            </div>

            <Card className="overflow-hidden">
              <div className="table-scroll overflow-x-auto">
                <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
                  <thead className="bg-command-900 text-xs uppercase tracking-[0.14em] text-zinc-500">
                    <tr>
                      <Th>Alliance</Th>
                      <Th>Status</Th>
                      <Th>Threat</Th>
                      <Th>Copper</Th>
                      <Th>Copper/hr</Th>
                      <Th>24h Projection</Th>
                      <Th>Hero Power</Th>
                      <Th>Activity</Th>
                      <Th>Attendance</Th>
                      <Th>Notes</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {alliances.map((alliance) => (
                      <SharedAllianceRow key={alliance.id} alliance={alliance} />
                    ))}
                    {alliances.length === 0 && (
                      <tr>
                        <td colSpan={10} className="p-6 text-center text-zinc-400">
                          No alliance data found for this view.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}

function SharedAllianceRow({ alliance }: { alliance: Alliance }) {
  return (
    <tr className="border-t border-command-700 align-top">
      <Td>
        <p className="font-semibold text-zinc-100">{alliance.name}</p>
        <p className="text-xs text-zinc-500">Server {alliance.serverNumber}</p>
      </Td>
      <Td>
        <Badge tone={alliance.relation === "enemy" ? "red" : alliance.relation === "ally" ? "green" : "neutral"}>{alliance.relation}</Badge>
      </Td>
      <Td>Threat {alliance.threatTier}</Td>
      <Td>{formatCompact(currentCopperNow(alliance))}</Td>
      <Td>{formatCompact(alliance.copperPerHour)}/hr</Td>
      <Td>{formatCompact(projectedCopper(alliance, 24))}</Td>
      <Td>
        <p>{formatCompact(alliance.topThirtyHeroPower)}</p>
        <p className="text-xs text-zinc-500">Avg {formatCompact(alliance.averageTopThirtyHeroPower)}</p>
      </Td>
      <Td>{alliance.activityRating}/10</Td>
      <Td>
        <p>Wed {alliance.attendanceWednesday}%</p>
        <p>Sat {alliance.attendanceSaturday}%</p>
      </Td>
      <Td>
        <p className="max-w-[260px] truncate text-zinc-400">{alliance.notes || "No notes"}</p>
      </Td>
    </tr>
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
