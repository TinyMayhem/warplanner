"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Download, Eye, FileJson, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isPlannerState } from "@/lib/storage";
import { isSupabaseConfigured, loadPlannerSnapshot, pushPlannerSnapshot } from "@/lib/supabase-sync";
import { useWarPlannerStore } from "@/store/war-planner-store";
import type { PlannerState } from "@/lib/types";

export function SettingsPanel() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const schemaVersion = useWarPlannerStore((store) => store.schemaVersion);
  const activeWorkspaceId = useWarPlannerStore((store) => store.activeWorkspaceId);
  const workspaces = useWarPlannerStore((store) => store.workspaces);
  const servers = useWarPlannerStore((store) => store.servers);
  const alliances = useWarPlannerStore((store) => store.alliances);
  const warRecords = useWarPlannerStore((store) => store.warRecords);
  const replacePlannerState = useWarPlannerStore((store) => store.replacePlannerState);
  const setActiveWorkspace = useWarPlannerStore((store) => store.setActiveWorkspace);
  const updateWorkspace = useWarPlannerStore((store) => store.updateWorkspace);
  const deleteWorkspace = useWarPlannerStore((store) => store.deleteWorkspace);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [syncKey, setSyncKey] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  function exportBackup() {
    setError("");
    setMessage("");
    const backup: PlannerState = { schemaVersion, activeWorkspaceId, workspaces, servers, alliances, warRecords };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `last-war-copper-planner-${date}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setMessage("JSON backup exported.");
  }

  async function importBackup(file: File | undefined) {
    setError("");
    setMessage("");
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (!isPlannerState(parsed)) {
        setError("Import failed. File is not a valid planner backup.");
        return;
      }

      replacePlannerState(parsed);
      setMessage("JSON backup restored.");
    } catch {
      setError("Import failed. Could not read JSON file.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function pushToSupabase() {
    setError("");
    setMessage("");
    setIsSyncing(true);

    try {
      const backup: PlannerState = { schemaVersion, activeWorkspaceId, workspaces, servers, alliances, warRecords };
      const updatedAt = await pushPlannerSnapshot(syncKey, backup);
      setMessage(`Supabase snapshot saved. Updated ${new Date(updatedAt).toLocaleString()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Supabase push failed.");
    } finally {
      setIsSyncing(false);
    }
  }

  async function loadFromSupabase() {
    setError("");
    setMessage("");
    setIsSyncing(true);

    try {
      const snapshot = await loadPlannerSnapshot(syncKey);
      replacePlannerState(snapshot.plannerState);
      setMessage(`Supabase snapshot restored. Updated ${new Date(snapshot.updatedAt).toLocaleString()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Supabase load failed.");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="mb-4 flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-md border border-command-copper/50 bg-command-copper/15">
            <FileJson className="size-5 text-command-copper" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-50">Data Import / Export</h3>
            <p className="text-sm text-zinc-400">Export or restore all servers, alliances, war records, and workspace metadata.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Summary label="Servers" value={servers.length.toString()} />
          <Summary label="Alliances" value={alliances.length.toString()} />
          <Summary label="War Records" value={warRecords.length.toString()} />
          <Summary label="Workspaces" value={workspaces.length.toString()} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-lg font-bold text-zinc-50">Export JSON Backup</h3>
          <p className="mt-2 text-sm text-zinc-400">Creates a local JSON file containing all currently tracked planner data.</p>
          <Button type="button" className="mt-4" onClick={exportBackup}>
            <Download className="size-4" />
            Export JSON
          </Button>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-bold text-zinc-50">Import JSON Restore</h3>
          <p className="mt-2 text-sm text-zinc-400">Restores a planner backup. This replaces the current local planner data.</p>
          <input ref={inputRef} className="hidden" type="file" accept="application/json,.json" onChange={(event) => importBackup(event.target.files?.[0])} />
          <Button type="button" variant="secondary" className="mt-4" onClick={() => inputRef.current?.click()}>
            <Upload className="size-4" />
            Import JSON
          </Button>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-lg font-bold text-zinc-50">Supabase Cloud Sync</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Uses a shared sync key to save or load one planner snapshot from Supabase. This is not user authentication.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-command-amber">Sync key</span>
            <Input value={syncKey} placeholder="Example: utw-season-4" onChange={(event) => setSyncKey(event.target.value)} />
          </label>
          <Button type="button" variant="secondary" disabled={!isSupabaseConfigured() || isSyncing} onClick={pushToSupabase}>
            <Upload className="size-4" />
            Push Cloud
          </Button>
          <Button type="button" disabled={!isSupabaseConfigured() || isSyncing} onClick={loadFromSupabase}>
            <Download className="size-4" />
            Load Cloud
          </Button>
        </div>
        {!isSupabaseConfigured() && (
          <p className="mt-3 rounded-md border border-command-700 bg-command-900 p-3 text-sm text-command-amber">
            Supabase env vars are missing. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
          </p>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-bold text-zinc-50">View-Only Sharing</h3>
        <p className="mt-2 text-sm text-zinc-400">
          After pushing cloud data, give someone the same sync key and send them to the shared view. They can view alliance intelligence but cannot edit it.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/shared">
            <Button type="button" variant="secondary">
              <Eye className="size-4" />
              Open Shared View
            </Button>
          </Link>
          {syncKey.trim().length >= 6 && (
            <p className="rounded-md border border-command-700 bg-command-900 px-3 py-2 text-sm text-zinc-300">
              Share code: <span className="font-semibold text-command-amber">{syncKey.trim()}</span>
            </p>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-bold text-zinc-50">Workspace Management</h3>
        <p className="mt-2 text-sm text-zinc-400">Local workspace structure mirrors the future Supabase workspace/member model.</p>
        <div className="mt-4 space-y-3">
          {workspaces.map((workspace) => (
            <div key={workspace.id} className="grid gap-3 rounded-md border border-command-700 bg-command-900 p-3 lg:grid-cols-[1fr_12rem_auto_auto]">
              <label className="grid gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-command-amber">Workspace name</span>
                <input
                  className="h-10 w-full rounded-md border border-command-700 bg-command-950 px-3 text-sm text-zinc-100 outline-none transition focus:border-command-copper"
                  value={workspace.name}
                  onChange={(event) => updateWorkspace(workspace.id, { name: event.target.value })}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-command-amber">Role</span>
                <select
                  className="h-10 w-full rounded-md border border-command-700 bg-command-950 px-3 text-sm text-zinc-100 outline-none transition focus:border-command-copper"
                  value={workspace.role}
                  onChange={(event) => updateWorkspace(workspace.id, { role: event.target.value as PlannerState["workspaces"][number]["role"] })}
                >
                  <option value="Owner">Owner</option>
                  <option value="Admin">Admin</option>
                  <option value="Editor">Editor</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </label>
              <Button type="button" variant={workspace.id === activeWorkspaceId ? "primary" : "secondary"} onClick={() => setActiveWorkspace(workspace.id)}>
                {workspace.id === activeWorkspaceId ? "Active" : "Switch"}
              </Button>
              <Button type="button" variant="danger" className="size-10 px-0" title="Delete workspace" disabled={workspaces.length <= 1} onClick={() => deleteWorkspace(workspace.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {(message || error) && (
        <Card className={`p-4 ${error ? "border-command-red" : "border-command-green"}`}>
          <p className={error ? "text-command-red" : "text-command-green"}>{error || message}</p>
        </Card>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-command-700 bg-command-900 p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-zinc-50">{value}</p>
    </div>
  );
}
