"use client";

import { ArrowDownAZ, ArrowUpAZ, Search } from "lucide-react";
import { AllianceForm } from "@/components/alliances/alliance-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useWarPlannerStore } from "@/store/war-planner-store";
import type { RelationStatus, SortKey, ThreatTier } from "@/lib/types";

const threatTiers: Array<ThreatTier | "All"> = ["All", "S", "A", "B", "C", "D", "Unknown"];
const relations: Array<RelationStatus | "All"> = ["All", "ally", "enemy", "neutral"];
const sortOptions: Array<{ label: string; value: SortKey }> = [
  { label: "Copper", value: "currentCopper" },
  { label: "Copper/hour", value: "copperPerHour" },
  { label: "Hero power", value: "topThirtyHeroPower" },
  { label: "Activity", value: "activityRating" },
  { label: "Attendance", value: "attendanceSaturday" },
  { label: "Threat", value: "threatTier" }
];

export function AllianceToolbar() {
  const activeWorkspaceId = useWarPlannerStore((state) => state.activeWorkspaceId);
  const allServers = useWarPlannerStore((state) => state.servers);
  const filters = useWarPlannerStore((state) => state.filters);
  const setFilters = useWarPlannerStore((state) => state.setFilters);
  const servers = allServers.filter((server) => server.workspaceId === activeWorkspaceId);

  return (
    <section className="space-y-4">
      <Card className="p-4">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-zinc-50">Alliance Database</h3>
          <p className="text-sm text-zinc-400">Create, search, filter, sort, and quick edit tracked alliances.</p>
        </div>
        <AllianceForm />
      </Card>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
            <Input className="pl-9" placeholder="Search alliances" value={filters.search} onChange={(event) => setFilters({ search: event.target.value })} />
          </div>
          <Select value={filters.serverId} onChange={(event) => setFilters({ serverId: event.target.value })}>
            <option value="All">All servers</option>
            {servers.map((server) => (
              <option key={server.id} value={server.id}>
                Server {server.serverNumber}
              </option>
            ))}
          </Select>
          <Select value={filters.threatTier} onChange={(event) => setFilters({ threatTier: event.target.value as ThreatTier | "All" })}>
            {threatTiers.map((tier) => (
              <option key={tier} value={tier}>
                {tier === "All" ? "All tiers" : `Threat ${tier}`}
              </option>
            ))}
          </Select>
          <Select value={filters.relation} onChange={(event) => setFilters({ relation: event.target.value as RelationStatus | "All" })}>
            {relations.map((relation) => (
              <option key={relation} value={relation}>
                {relation === "All" ? "All statuses" : relation}
              </option>
            ))}
          </Select>
          <Select value={filters.sortKey} onChange={(event) => setFilters({ sortKey: event.target.value as SortKey })}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                Sort: {option.label}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="secondary"
            className="size-10 px-0"
            title="Toggle sort direction"
            onClick={() => setFilters({ sortDirection: filters.sortDirection === "asc" ? "desc" : "asc" })}
          >
            {filters.sortDirection === "asc" ? <ArrowUpAZ className="size-4" /> : <ArrowDownAZ className="size-4" />}
          </Button>
        </div>
      </Card>
    </section>
  );
}
