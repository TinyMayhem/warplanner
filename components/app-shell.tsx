"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Calculator, Database, History, Plus, Radar, Settings, Shield, Swords, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useWarPlannerStore } from "@/store/war-planner-store";

const navItems = [
  { label: "Dashboard", href: "/", icon: BarChart3 },
  { label: "Servers", href: "/servers", icon: Database },
  { label: "Alliances", href: "/alliances", icon: Shield },
  { label: "Calculators", href: "/calculators", icon: Calculator },
  { label: "War History", href: "/war-history", icon: History },
  { label: "Faction History", href: "/faction-history", icon: Swords },
  { label: "Forecasting", href: "/forecasting", icon: TrendingUp },
  { label: "Settings", href: "/settings", icon: Settings }
];

export function AppShell({ active, children }: { active: string; children: React.ReactNode }) {
  const workspaces = useWarPlannerStore((state) => state.workspaces);
  const activeWorkspaceId = useWarPlannerStore((state) => state.activeWorkspaceId);
  const setActiveWorkspace = useWarPlannerStore((state) => state.setActiveWorkspace);
  const addWorkspace = useWarPlannerStore((state) => state.addWorkspace);
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0];
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  function createWorkspace() {
    if (!newWorkspaceName.trim()) return;
    addWorkspace({ name: newWorkspaceName, role: "Owner" });
    setNewWorkspaceName("");
  }

  return (
    <main className="min-h-screen bg-command-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col lg:flex-row">
        <aside className="border-b border-command-700 bg-command-900/92 px-4 py-4 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md border border-command-copper/50 bg-command-copper/15">
              <Radar className="size-5 text-command-copper" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-command-copper">Copper War</p>
              <h1 className="text-lg font-bold text-zinc-50">Command Planner</h1>
            </div>
          </div>
          <div className="mb-4 rounded-md border border-command-700 bg-command-950/60 p-3">
            <label className="grid gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-command-amber">Workspace</span>
              <Select value={activeWorkspaceId} onChange={(event) => setActiveWorkspace(event.target.value)}>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </Select>
            </label>
            <p className="mt-2 text-xs text-zinc-500">Role: {activeWorkspace?.role ?? "Owner"}</p>
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
              <Input value={newWorkspaceName} placeholder="New workspace" onChange={(event) => setNewWorkspaceName(event.target.value)} />
              <Button type="button" variant="secondary" className="size-10 px-0" title="Add workspace" onClick={createWorkspace}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.label === active;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex h-11 items-center gap-2 rounded-md border px-3 text-sm font-medium transition ${
                    isActive ? "border-command-copper/60 bg-command-copper/15 text-[#f1b06c]" : "border-transparent text-zinc-400 hover:bg-command-800 hover:text-zinc-100"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <section className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mb-5">
            <p className="text-sm uppercase tracking-[0.2em] text-command-amber">Season 4 Intelligence</p>
            <h2 className="text-2xl font-bold text-zinc-50 sm:text-3xl">{active}</h2>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
