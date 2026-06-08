import { createId } from "@/lib/ids";
import type { Alliance, PlannerState, RelationStatus, Server, ThreatTier, ConfidenceRating } from "@/lib/types";

type ImportResult = {
  plannerState: PlannerState;
  serversAdded: number;
  alliancesAdded: number;
  rowsSkipped: number;
};

type CsvRow = Record<string, string>;

const relationValues: RelationStatus[] = ["ally", "enemy", "neutral"];
const threatValues: ThreatTier[] = ["S", "A", "B", "C", "D", "Unknown"];
const confidenceValues: ConfidenceRating[] = ["Low", "Medium", "High"];

export async function importAllianceSpreadsheet(file: File, state: PlannerState): Promise<ImportResult> {
  const text = await file.text();
  const rows = parseDelimitedRows(text);
  return applyRows(rows, state);
}

function applyRows(rows: CsvRow[], state: PlannerState): ImportResult {
  const timestamp = new Date().toISOString();
  const activeWorkspaceId = state.activeWorkspaceId;
  const servers = [...state.servers];
  const alliances = [...state.alliances];
  const serversByNumber = new Map(
    servers.filter((server) => server.workspaceId === activeWorkspaceId).map((server) => [server.serverNumber, server])
  );
  let serversAdded = 0;
  let alliancesAdded = 0;
  let rowsSkipped = 0;

  for (const row of rows) {
    const serverNumber = toNumber(read(row, ["server", "server number", "server_number", "server #", "server id"]));
    if (!serverNumber) {
      rowsSkipped += 1;
      continue;
    }

    let server = serversByNumber.get(serverNumber);
    if (!server) {
      server = createServer(activeWorkspaceId, serverNumber, timestamp);
      servers.push(server);
      serversByNumber.set(serverNumber, server);
      serversAdded += 1;
    }

    const name = read(row, ["alliance", "alliance name", "name", "tag"]);
    if (!name) continue;

    alliances.push(createAlliance(row, server, activeWorkspaceId, timestamp, name));
    alliancesAdded += 1;
  }

  return {
    plannerState: {
      ...state,
      servers,
      alliances
    },
    serversAdded,
    alliancesAdded,
    rowsSkipped
  };
}

function createServer(workspaceId: string, serverNumber: number, timestamp: string): Server {
  return {
    id: createId("server"),
    workspaceId,
    serverNumber,
    notes: "",
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function createAlliance(row: CsvRow, server: Server, workspaceId: string, timestamp: string, name: string): Alliance {
  return {
    id: createId("alliance"),
    workspaceId,
    name,
    serverId: server.id,
    serverNumber: server.serverNumber,
    relation: toRelation(read(row, ["status", "relation", "relationship", "ally/enemy/neutral"])),
    notes: read(row, ["notes", "note", "comments"]),
    lastUpdatedAt: timestamp,
    currentCopper: toNumber(read(row, ["current copper", "copper", "copper current"])),
    copperPerHour: toNumber(read(row, ["copper/hour", "copper per hour", "copper hourly", "cph"])),
    topThirtyHeroPower: toNumber(read(row, ["top 30 total hero power", "top 30 power", "hero power", "total hero power"])),
    averageTopThirtyHeroPower: toNumber(read(row, ["average top 30 hero power", "avg top 30 power", "average hero power", "avg hero power"])),
    strongestPlayerPower: toNumber(read(row, ["strongest player power", "strongest power", "top player power"])),
    activityRating: clamp(toNumber(read(row, ["activity", "activity rating", "activity 1-10"])) || 5, 1, 10),
    attendanceWednesday: clamp(toNumber(read(row, ["attendance wednesday", "wed attendance", "wednesday attendance", "attendance wed"])) || 50, 0, 100),
    attendanceSaturday: clamp(toNumber(read(row, ["attendance saturday", "sat attendance", "saturday attendance", "attendance sat"])) || 50, 0, 100),
    threatTier: toThreatTier(read(row, ["threat", "threat tier", "tier"])),
    attendanceConfidence: toConfidence(read(row, ["attendance confidence", "att confidence"])),
    activityConfidence: toConfidence(read(row, ["activity confidence", "act confidence"]))
  };
}

function parseDelimitedRows(text: string) {
  const delimiter = text.includes("\t") ? "\t" : ",";
  const table = parseDelimited(text.replace(/^\uFEFF/, ""), delimiter);
  const headers = (table[0] ?? []).map(normalizeHeader);

  return table.slice(1).flatMap((cells) => {
    if (cells.every((cell) => !cell.trim())) return [];
    const row: CsvRow = {};
    headers.forEach((header, index) => {
      if (header) row[header] = cells[index]?.trim() ?? "";
    });
    return [row];
  });
}

function parseDelimited(text: string, delimiter: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows;
}

function read(row: CsvRow, names: string[]) {
  for (const name of names) {
    const value = row[normalizeHeader(name)];
    if (value) return value.trim();
  }
  return "";
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function toNumber(value: string) {
  const parsed = Number(value.replace(/,/g, "").replace(/%/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toRelation(value: string): RelationStatus {
  const normalized = value.trim().toLowerCase();
  return relationValues.includes(normalized as RelationStatus) ? (normalized as RelationStatus) : "neutral";
}

function toThreatTier(value: string): ThreatTier {
  const normalized = value.trim().toUpperCase();
  if (normalized === "UNKNOWN" || !normalized) return "Unknown";
  return threatValues.includes(normalized as ThreatTier) ? (normalized as ThreatTier) : "Unknown";
}

function toConfidence(value: string): ConfidenceRating {
  const normalized = value.trim().toLowerCase();
  const match = confidenceValues.find((rating) => rating.toLowerCase() === normalized);
  return match ?? "Medium";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
