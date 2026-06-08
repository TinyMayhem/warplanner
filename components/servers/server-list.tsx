"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { getServerStats, formatCompact } from "@/lib/calculations";
import { useWarPlannerStore } from "@/store/war-planner-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ServerForm } from "@/components/servers/server-form";

export function ServerList() {
  const activeWorkspaceId = useWarPlannerStore((state) => state.activeWorkspaceId);
  const allServers = useWarPlannerStore((state) => state.servers);
  const allAlliances = useWarPlannerStore((state) => state.alliances);
  const deleteServer = useWarPlannerStore((state) => state.deleteServer);
  const [editingId, setEditingId] = useState<string | null>(null);
  const servers = allServers.filter((server) => server.workspaceId === activeWorkspaceId);
  const alliances = allAlliances.filter((alliance) => alliance.workspaceId === activeWorkspaceId);

  return (
    <section className="space-y-4">
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-zinc-50">Server Management</h3>
            <p className="text-sm text-zinc-400">Track server-level copper, power, and threat posture.</p>
          </div>
        </div>
        <ServerForm />
      </Card>

      <div className="grid gap-3">
        {servers.map((server) => {
          const stats = getServerStats(server, alliances);
          const isEditing = editingId === server.id;
          return (
            <Card key={server.id} className="p-4">
              {isEditing ? (
                <ServerForm server={server} onDone={() => setEditingId(null)} />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-zinc-50">Server {server.serverNumber}</h3>
                        <Badge tone="copper">{stats.allianceCount} alliances</Badge>
                      </div>
                      {server.notes && <p className="mt-1 text-sm text-zinc-400">{server.notes}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="secondary" className="size-10 px-0" title="Edit server" onClick={() => setEditingId(server.id)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button type="button" variant="danger" className="size-10 px-0" title="Delete server" onClick={() => deleteServer(server.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Metric label="Total copper" value={formatCompact(stats.totalCopper)} />
                    <Metric label="Avg copper" value={formatCompact(stats.averageCopper)} />
                    <Metric label="Avg power" value={formatCompact(stats.averagePower)} />
                    <Metric label="Top threats" value={stats.topThreats.map((alliance) => alliance.name).join(", ") || "None"} />
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-command-700 bg-command-900 p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  );
}
