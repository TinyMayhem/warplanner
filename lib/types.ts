export type RelationStatus = "ally" | "enemy" | "neutral";
export type ThreatTier = "S" | "A" | "B" | "C" | "D" | "Unknown";
export type ConfidenceRating = "Low" | "Medium" | "High";

export type Server = {
  id: string;
  workspaceId: string;
  serverNumber: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type Alliance = {
  id: string;
  workspaceId: string;
  name: string;
  serverId: string;
  serverNumber: number;
  relation: RelationStatus;
  notes: string;
  lastUpdatedAt: string;
  currentCopper: number;
  copperPerHour: number;
  topThirtyHeroPower: number;
  averageTopThirtyHeroPower: number;
  strongestPlayerPower: number;
  activityRating: number;
  attendanceWednesday: number;
  attendanceSaturday: number;
  threatTier: ThreatTier;
  attendanceConfidence: ConfidenceRating;
  activityConfidence: ConfidenceRating;
};

export type WarRecord = {
  id: string;
  workspaceId: string;
  allianceId: string;
  date: string;
  enemyAllianceId?: string;
  enemyAllianceName: string;
  copperBefore: number;
  copperAfter: number;
  copperDelta: number;
  plunderPercent: 0 | 3 | 6 | 9 | 12 | 15;
  result: "win" | "loss";
  battleSummary: string;
  observedAttendance: number;
  observedActivity: number;
  notes: string;
};

export type FactionBattleDifficulty = "Easy" | "Medium" | "Difficult";

export type FactionBattleRecord = {
  id: string;
  workspaceId: string;
  weekOf: string;
  factionAAllianceId: string;
  factionAName: string;
  factionBAllianceId: string;
  factionBName: string;
  winner: "A" | "B" | "Draw" | "Unknown";
  difficulty: FactionBattleDifficulty;
  battleSummary: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceRole = "Owner" | "Admin" | "Editor" | "Viewer";

export type Workspace = {
  id: string;
  name: string;
  role: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
};

export type SortKey = "currentCopper" | "copperPerHour" | "topThirtyHeroPower" | "activityRating" | "attendanceSaturday" | "threatTier";

export type AllianceFilters = {
  search: string;
  serverId: string;
  threatTier: ThreatTier | "All";
  relation: RelationStatus | "All";
  sortKey: SortKey;
  sortDirection: "asc" | "desc";
};

export type PlannerState = {
  schemaVersion: 1;
  activeWorkspaceId: string;
  workspaces: Workspace[];
  servers: Server[];
  alliances: Alliance[];
  warRecords: WarRecord[];
  factionBattleRecords: FactionBattleRecord[];
};
