import type { Alliance, Server, ThreatTier } from "@/lib/types";

export function projectedCopper(alliance: Pick<Alliance, "currentCopper" | "copperPerHour">, hours: number) {
  return alliance.currentCopper + alliance.copperPerHour * hours;
}

export function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function threatWeight(tier: ThreatTier) {
  const weights: Record<ThreatTier, number> = { S: 6, A: 5, B: 4, C: 3, D: 2, Unknown: 1 };
  return weights[tier];
}

export type CalculatorAlliance = Pick<
  Alliance,
  "currentCopper" | "copperPerHour" | "topThirtyHeroPower" | "attendanceWednesday" | "attendanceSaturday" | "activityRating" | "threatTier"
>;

export type WinChanceResult = {
  chance: number;
  difficulty: "Easy" | "Favorable" | "Even" | "Difficult" | "Very Difficult";
  scores: {
    copper: number;
    power: number;
    attendance: number;
    activity: number;
  };
  strengths: string[];
  weaknesses: string[];
};

export function calculateWinChance(ours: CalculatorAlliance, enemy: CalculatorAlliance): WinChanceResult {
  const scores = {
    copper: matchupScore(ours.currentCopper, enemy.currentCopper),
    power: matchupScore(ours.topThirtyHeroPower, enemy.topThirtyHeroPower),
    attendance: matchupScore(bestAttendance(ours), bestAttendance(enemy)),
    activity: matchupScore(ours.activityRating, enemy.activityRating)
  };
  const chance = clamp(scores.copper * 0.3 + scores.power * 0.3 + scores.attendance * 0.25 + scores.activity * 0.15, 1, 99);

  return {
    chance,
    difficulty: difficultyLabel(chance),
    scores,
    strengths: buildStrengths(scores),
    weaknesses: buildWeaknesses(scores)
  };
}

export function copperAdvantage(ours: CalculatorAlliance, enemy: CalculatorAlliance) {
  const difference = ours.currentCopper - enemy.currentCopper;
  const percentage = enemy.currentCopper <= 0 ? (ours.currentCopper > 0 ? 100 : 0) : (difference / enemy.currentCopper) * 100;

  return {
    difference,
    percentage,
    copperPerHourDifference: ours.copperPerHour - enemy.copperPerHour,
    projections: [1, 6, 12, 24].map((hours) => ({
      hours,
      ours: projectedCopper(ours, hours),
      enemy: projectedCopper(enemy, hours),
      difference: projectedCopper(ours, hours) - projectedCopper(enemy, hours)
    }))
  };
}

export function copperForecast(alliance: Pick<Alliance, "currentCopper" | "copperPerHour">, hours: number[]) {
  return hours.map((hour) => ({
    hour,
    copper: projectedCopper(alliance, hour),
    gained: alliance.copperPerHour * hour
  }));
}

export function targetPriorityScore(alliance: CalculatorAlliance) {
  const value = normalize(alliance.currentCopper, 10_000_000) * 34 + normalize(alliance.copperPerHour, 500_000) * 22;
  const resistance =
    normalize(alliance.topThirtyHeroPower, 1_000_000_000) * 18 +
    normalize(bestAttendance(alliance), 100) * 14 +
    normalize(alliance.activityRating, 10) * 12 +
    normalize(threatWeight(alliance.threatTier), 6) * 10;

  return clamp(value - resistance + 20, 0, 100);
}

export function targetRiskLevel(alliance: CalculatorAlliance) {
  const risk =
    normalize(alliance.topThirtyHeroPower, 1_000_000_000) * 35 +
    normalize(bestAttendance(alliance), 100) * 25 +
    normalize(alliance.activityRating, 10) * 20 +
    normalize(threatWeight(alliance.threatTier), 6) * 20;

  if (risk >= 75) return "Extreme";
  if (risk >= 55) return "High";
  if (risk >= 30) return "Medium";
  return "Low";
}

export function bestAttendance(alliance: Pick<Alliance, "attendanceWednesday" | "attendanceSaturday">) {
  return Math.max(alliance.attendanceWednesday, alliance.attendanceSaturday);
}

export function getServerStats(server: Server, alliances: Alliance[]) {
  const serverAlliances = alliances.filter((alliance) => alliance.serverId === server.id);
  const totalCopper = serverAlliances.reduce((total, alliance) => total + alliance.currentCopper, 0);
  const totalPower = serverAlliances.reduce((total, alliance) => total + alliance.topThirtyHeroPower, 0);
  const topThreats = [...serverAlliances]
    .sort((a, b) => threatWeight(b.threatTier) - threatWeight(a.threatTier) || b.currentCopper - a.currentCopper)
    .slice(0, 3);

  return {
    allianceCount: serverAlliances.length,
    totalCopper,
    averageCopper: average(serverAlliances.map((alliance) => alliance.currentCopper)),
    averagePower: serverAlliances.length ? totalPower / serverAlliances.length : 0,
    topThreats
  };
}

function matchupScore(ours: number, enemy: number) {
  if (ours <= 0 && enemy <= 0) return 50;
  if (enemy <= 0) return 90;
  return clamp((ours / (ours + enemy)) * 100, 5, 95);
}

function difficultyLabel(chance: number): WinChanceResult["difficulty"] {
  if (chance >= 72) return "Easy";
  if (chance >= 58) return "Favorable";
  if (chance >= 44) return "Even";
  if (chance >= 30) return "Difficult";
  return "Very Difficult";
}

function buildStrengths(scores: WinChanceResult["scores"]) {
  const labels = [
    { key: "copper", label: "Copper position" },
    { key: "power", label: "Hero power" },
    { key: "attendance", label: "Attendance" },
    { key: "activity", label: "Activity" }
  ] as const;

  return labels.filter((item) => scores[item.key] >= 55).map((item) => item.label);
}

function buildWeaknesses(scores: WinChanceResult["scores"]) {
  const labels = [
    { key: "copper", label: "Copper position" },
    { key: "power", label: "Hero power" },
    { key: "attendance", label: "Attendance" },
    { key: "activity", label: "Activity" }
  ] as const;

  return labels.filter((item) => scores[item.key] < 45).map((item) => item.label);
}

function normalize(value: number, ceiling: number) {
  if (ceiling <= 0) return 0;
  return Math.min(1, Math.max(0, value / ceiling)) * 100;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
