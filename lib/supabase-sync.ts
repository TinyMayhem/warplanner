import type { PlannerState } from "@/lib/types";
import { isPlannerState } from "@/lib/storage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type SnapshotRow = {
  sync_key: string;
  planner_state: unknown;
  updated_at: string;
};

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export async function pushPlannerSnapshot(syncKey: string, plannerState: PlannerState) {
  const key = normalizeSyncKey(syncKey);
  const response = await supabaseFetch(`/rest/v1/planner_snapshots?on_conflict=sync_key`, {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify({
      sync_key: key,
      planner_state: plannerState
    })
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const rows = (await response.json()) as SnapshotRow[];
  return rows[0]?.updated_at ?? new Date().toISOString();
}

export async function loadPlannerSnapshot(syncKey: string) {
  const key = normalizeSyncKey(syncKey);
  const response = await supabaseFetch(`/rest/v1/planner_snapshots?sync_key=eq.${encodeURIComponent(key)}&select=planner_state,updated_at`, {
    method: "GET"
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const rows = (await response.json()) as SnapshotRow[];
  const row = rows[0];
  if (!row) {
    throw new Error("No Supabase snapshot exists for that sync key.");
  }
  if (!isPlannerState(row.planner_state)) {
    throw new Error("Supabase snapshot is not a valid planner backup.");
  }

  return {
    plannerState: row.planner_state,
    updatedAt: row.updated_at
  };
}

function normalizeSyncKey(syncKey: string) {
  const key = syncKey.trim();
  if (key.length < 6) {
    throw new Error("Sync key must be at least 6 characters.");
  }
  return key;
}

function supabaseFetch(path: string, init: RequestInit) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });
}
