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
  result: "win" | "loss";
  observedAttendance: number;
  observedActivity: number;
  notes: string;
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
};
