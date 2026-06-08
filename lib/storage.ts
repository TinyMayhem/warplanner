import { createJSONStorage } from "zustand/middleware";
import type { PlannerState } from "@/lib/types";

export const STORAGE_KEY = "last-war-copper-planner:v1";

export type PlannerRepository = {
  load: () => PlannerState | null;
  save: (state: PlannerState) => void;
};

export const localPlannerRepository: PlannerRepository = {
  load() {
    if (typeof window === "undefined") return null;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PlannerState;
    } catch {
      return null;
    }
  },
  save(state) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
};

export function createPlannerPersistStorage<T>() {
  return createJSONStorage<T>(() => localStorage);
}

export function isPlannerState(value: unknown): value is PlannerState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PlannerState>;
  return (
    candidate.schemaVersion === 1 &&
    typeof candidate.activeWorkspaceId === "string" &&
    Array.isArray(candidate.workspaces) &&
    Array.isArray(candidate.servers) &&
    Array.isArray(candidate.alliances) &&
    Array.isArray(candidate.warRecords)
  );
}
