"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createId } from "@/lib/ids";
import { threatWeight } from "@/lib/calculations";
import { createPlannerPersistStorage, STORAGE_KEY } from "@/lib/storage";
import type { Alliance, AllianceFilters, PlannerState, Server, WarRecord, Workspace, WorkspaceRole } from "@/lib/types";

type StoreActions = {
  setActiveWorkspace: (id: string) => void;
  addWorkspace: (workspace: Pick<Workspace, "name" | "role">) => void;
  updateWorkspace: (id: string, patch: Partial<Pick<Workspace, "name" | "role">>) => void;
  deleteWorkspace: (id: string) => void;
  setFilters: (filters: Partial<AllianceFilters>) => void;
  addServer: (server: Pick<Server, "serverNumber" | "notes">) => void;
  updateServer: (id: string, patch: Partial<Pick<Server, "serverNumber" | "notes">>) => void;
  deleteServer: (id: string) => void;
  addAlliance: (alliance: Omit<Alliance, "id" | "lastUpdatedAt" | "workspaceId">) => void;
  updateAlliance: (id: string, patch: Partial<Omit<Alliance, "id">>) => void;
  deleteAlliance: (id: string) => void;
  addWarRecord: (record: Omit<WarRecord, "id" | "copperDelta" | "workspaceId">) => void;
  updateWarRecord: (id: string, patch: Partial<Omit<WarRecord, "id">>) => void;
  deleteWarRecord: (id: string) => void;
  replacePlannerState: (state: PlannerState) => void;
  filteredAlliances: () => Alliance[];
};

type WarPlannerStore = PlannerState & {
  filters: AllianceFilters;
} & StoreActions;

const now = () => new Date().toISOString();

const defaultWorkspace = {
  id: "workspace_default",
  name: "Command Workspace",
  role: "Owner" as const,
  createdAt: now(),
  updatedAt: now()
};

const initialServers: Server[] = [1001, 1002, 1003, 1004].map((serverNumber) => ({
  id: createId("server"),
  workspaceId: defaultWorkspace.id,
  serverNumber,
  notes: "",
  createdAt: now(),
  updatedAt: now()
}));

const initialState: PlannerState = {
  schemaVersion: 1,
  activeWorkspaceId: defaultWorkspace.id,
  workspaces: [defaultWorkspace],
  servers: initialServers,
  alliances: [],
  warRecords: []
};

const defaultFilters: AllianceFilters = {
  search: "",
  serverId: "All",
  threatTier: "All",
  relation: "All",
  sortKey: "currentCopper",
  sortDirection: "desc"
};

export const useWarPlannerStore = create<WarPlannerStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      filters: defaultFilters,
      setActiveWorkspace(id) {
        set((state) => ({
          activeWorkspaceId: state.workspaces.some((workspace) => workspace.id === id) ? id : state.activeWorkspaceId,
          filters: defaultFilters
        }));
      },
      addWorkspace(workspace) {
        const timestamp = now();
        const id = createId("workspace");
        set((state) => ({
          activeWorkspaceId: id,
          workspaces: [
            ...state.workspaces,
            {
              id,
              name: workspace.name.trim() || "New Workspace",
              role: workspace.role,
              createdAt: timestamp,
              updatedAt: timestamp
            }
          ],
          filters: defaultFilters
        }));
      },
      updateWorkspace(id, patch) {
        set((state) => ({
          workspaces: state.workspaces.map((workspace) =>
            workspace.id === id
              ? {
                  ...workspace,
                  ...patch,
                  name: patch.name?.trim() || workspace.name,
                  role: (patch.role ?? workspace.role) as WorkspaceRole,
                  updatedAt: now()
                }
              : workspace
          )
        }));
      },
      deleteWorkspace(id) {
        set((state) => {
          if (state.workspaces.length <= 1) return state;
          const workspaces = state.workspaces.filter((workspace) => workspace.id !== id);
          const nextActiveWorkspaceId = state.activeWorkspaceId === id ? workspaces[0].id : state.activeWorkspaceId;

          return {
            workspaces,
            activeWorkspaceId: nextActiveWorkspaceId,
            servers: state.servers.filter((server) => server.workspaceId !== id),
            alliances: state.alliances.filter((alliance) => alliance.workspaceId !== id),
            warRecords: state.warRecords.filter((record) => record.workspaceId !== id),
            filters: defaultFilters
          };
        });
      },
      setFilters(filters) {
        set((state) => ({ filters: { ...state.filters, ...filters } }));
      },
      addServer(server) {
        const timestamp = now();
        set((state) => ({
          servers: [
            ...state.servers,
            {
              id: createId("server"),
              workspaceId: state.activeWorkspaceId,
              serverNumber: Number(server.serverNumber),
              notes: server.notes,
              createdAt: timestamp,
              updatedAt: timestamp
            }
          ]
        }));
      },
      updateServer(id, patch) {
        set((state) => ({
          servers: state.servers.map((server) =>
            server.id === id ? { ...server, ...patch, serverNumber: Number(patch.serverNumber ?? server.serverNumber), updatedAt: now() } : server
          ),
          alliances: state.alliances.map((alliance) => {
            if (alliance.serverId !== id || patch.serverNumber === undefined) return alliance;
            return { ...alliance, serverNumber: Number(patch.serverNumber), lastUpdatedAt: now() };
          })
        }));
      },
      deleteServer(id) {
        set((state) => ({
          servers: state.servers.filter((server) => server.id !== id),
          alliances: state.alliances.filter((alliance) => alliance.serverId !== id)
        }));
      },
      addAlliance(alliance) {
        set((state) => ({
          alliances: [
            ...state.alliances,
            {
              ...alliance,
              id: createId("alliance"),
              workspaceId: state.activeWorkspaceId,
              lastUpdatedAt: now()
            }
          ]
        }));
      },
      updateAlliance(id, patch) {
        set((state) => ({
          alliances: state.alliances.map((alliance) =>
            alliance.id === id
              ? {
                  ...alliance,
                  ...patch,
                  lastUpdatedAt: now()
                }
              : alliance
          )
        }));
      },
      deleteAlliance(id) {
        set((state) => ({
          alliances: state.alliances.filter((alliance) => alliance.id !== id),
          warRecords: state.warRecords.filter((record) => record.allianceId !== id)
        }));
      },
      addWarRecord(record) {
        set((state) => ({
          warRecords: [
            ...state.warRecords,
            {
              ...record,
              id: createId("war"),
              workspaceId: state.activeWorkspaceId,
              copperDelta: record.copperAfter - record.copperBefore
            }
          ]
        }));
      },
      updateWarRecord(id, patch) {
        set((state) => ({
          warRecords: state.warRecords.map((record) => {
            if (record.id !== id) return record;
            const next = { ...record, ...patch };
            return { ...next, copperDelta: next.copperAfter - next.copperBefore };
          })
        }));
      },
      deleteWarRecord(id) {
        set((state) => ({
          warRecords: state.warRecords.filter((record) => record.id !== id)
        }));
      },
      replacePlannerState(nextState) {
        set(() => ({
          ...normalizePlannerState(nextState),
          filters: defaultFilters
        }));
      },
      filteredAlliances() {
        const { alliances, filters, activeWorkspaceId } = get();
        const search = filters.search.trim().toLowerCase();

        return alliances
          .filter((alliance) => {
            const matchesWorkspace = alliance.workspaceId === activeWorkspaceId;
            const matchesSearch = !search || alliance.name.toLowerCase().includes(search) || alliance.notes.toLowerCase().includes(search);
            const matchesServer = filters.serverId === "All" || alliance.serverId === filters.serverId;
            const matchesTier = filters.threatTier === "All" || alliance.threatTier === filters.threatTier;
            const matchesRelation = filters.relation === "All" || alliance.relation === filters.relation;
            return matchesWorkspace && matchesSearch && matchesServer && matchesTier && matchesRelation;
          })
          .sort((a, b) => {
            const direction = filters.sortDirection === "asc" ? 1 : -1;
            if (filters.sortKey === "threatTier") return (threatWeight(a.threatTier) - threatWeight(b.threatTier)) * direction;
            return ((a[filters.sortKey] as number) - (b[filters.sortKey] as number)) * direction;
          });
      }
    }),
    {
      name: STORAGE_KEY,
      storage: createPlannerPersistStorage<PlannerState>(),
      merge: (persisted, current) => ({
        ...current,
        ...normalizePlannerState(persisted)
      }),
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        activeWorkspaceId: state.activeWorkspaceId,
        workspaces: state.workspaces,
        servers: state.servers,
        alliances: state.alliances,
        warRecords: state.warRecords
      })
    }
  )
);

function normalizePlannerState(value: unknown): PlannerState {
  const state = value as Partial<PlannerState> | undefined;
  const workspaces =
    state?.workspaces && state.workspaces.length
      ? state.workspaces.map((workspace) => ({
          ...workspace,
          createdAt: workspace.createdAt ?? now(),
          updatedAt: workspace.updatedAt ?? now()
        }))
      : [defaultWorkspace];
  const activeWorkspaceId = workspaces.some((workspace) => workspace.id === state?.activeWorkspaceId) ? state?.activeWorkspaceId ?? workspaces[0].id : workspaces[0].id;
  const fallbackWorkspaceId = activeWorkspaceId;

  return {
    schemaVersion: 1,
    activeWorkspaceId,
    workspaces,
    servers: (state?.servers ?? []).map((server) => ({
      ...server,
      workspaceId: server.workspaceId ?? fallbackWorkspaceId
    })),
    alliances: (state?.alliances ?? []).map((alliance) => ({
      ...alliance,
      workspaceId: alliance.workspaceId ?? fallbackWorkspaceId
    })),
    warRecords: (state?.warRecords ?? []).map((record) => ({
      ...record,
      workspaceId: record.workspaceId ?? fallbackWorkspaceId
    }))
  };
}
