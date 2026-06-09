"use client";

import { useMemo } from "react";
import { Activity, Crosshair, Gauge, RadioTower, ShieldAlert, Swords, TrendingUp, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { average, currentCopperNow, formatCompact, projectedCopper, threatWeight } from "@/lib/calculations";
import { useWarPlannerStore } from "@/store/war-planner-store";
import type { Alliance } from "@/lib/types";

export function Dashboard() {
  const activeWorkspaceId = useWarPlannerStore((state) => state.activeWorkspaceId);
  const allAlliances = useWarPlannerStore((state) => state.alliances);
  const allServers = useWarPlannerStore((state) => state.servers);
  const allWarRecords = useWarPlannerStore((state) => state.warRecords);
  const alliances = useMemo(() => allAlliances.filter((alliance) => alliance.workspaceId === activeWorkspaceId), [activeWorkspaceId, allAlliances]);
  const servers = useMemo(() => allServers.filter((server) => server.workspaceId === activeWorkspaceId), [activeWorkspaceId, allServers]);
  const warRecords = useMemo(() => allWarRecords.filter((record) => record.workspaceId === activeWorkspaceId), [activeWorkspaceId, allWarRecords]);
  const dashboard = useMemo(() => buildDashboard(alliances), [alliances]);

  return (
    <div className="space-y-4">
      <OverviewGrid alliances={alliances} serverCount={servers.length} dashboard={dashboard} />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-zinc-50">Threat Radar</h3>
              <p className="text-sm text-zinc-400">Ranked by copper, growth, power, attendance, activity, and tier.</p>
            </div>
            <Badge tone="red">{dashboard.mostDangerous.length} active</Badge>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <RankedPanel title="Top Copper Threats" alliances={dashboard.topCopperThreats} metric={(alliance) => formatCompact(currentCopperNow(alliance))} max={dashboard.maxCopper} value={(alliance) => currentCopperNow(alliance)} />
            <RankedPanel title="Top Power Threats" alliances={dashboard.topPowerThreats} metric={(alliance) => formatCompact(alliance.topThirtyHeroPower)} max={dashboard.maxPower} value={(alliance) => alliance.topThirtyHeroPower} />
            <RankedPanel title="Fastest Growing Alliances" alliances={dashboard.fastestGrowing} metric={(alliance) => `${formatCompact(alliance.copperPerHour)}/hr`} max={dashboard.maxCopperPerHour} value={(alliance) => alliance.copperPerHour} />
            <RankedPanel title="Most Dangerous Alliances" alliances={dashboard.mostDangerous} metric={(alliance) => `Score ${Math.round(dangerScore(alliance))}`} max={dashboard.maxDangerScore} value={dangerScore} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-zinc-50">Target Opportunities</h3>
            <p className="text-sm text-zinc-400">High copper value with lower resistance signals.</p>
          </div>
          <div className="space-y-3">
            {dashboard.bestTargets.length ? (
              dashboard.bestTargets.map((alliance, index) => (
                <TargetRow key={alliance.id} alliance={alliance} rank={index + 1} max={dashboard.maxOpportunityScore} />
              ))
            ) : (
              <EmptyState label="No enemy or neutral targets tracked yet." />
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-4 xl:col-span-2">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-zinc-50">Copper Forecast Snapshot</h3>
            <p className="text-sm text-zinc-400">Current copper compared with 24 hour projected copper.</p>
          </div>
          <div className="space-y-3">
            {dashboard.forecastLeaders.length ? (
              dashboard.forecastLeaders.map((alliance) => (
                <ForecastRow key={alliance.id} alliance={alliance} max={dashboard.maxProjectedCopper24} />
              ))
            ) : (
              <EmptyState label="Add alliances to begin forecasting." />
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-zinc-50">Recent War Activity</h3>
            <p className="text-sm text-zinc-400">Latest war records or intelligence updates.</p>
          </div>
          <div className="space-y-3">
            {warRecords.length ? (
              warRecords.slice(0, 5).map((record) => (
                <div key={record.id} className="rounded-md border border-command-700 bg-command-900 p-3">
                  <p className="font-semibold text-zinc-100">{record.enemyAllianceName}</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {record.result} | {formatCompact(record.copperDelta)} copper
                  </p>
                </div>
              ))
            ) : dashboard.recentIntel.length ? (
              dashboard.recentIntel.map((alliance) => (
                <div key={alliance.id} className="rounded-md border border-command-700 bg-command-900 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-zinc-100">{alliance.name}</p>
                    <Badge tone={alliance.relation === "enemy" ? "red" : alliance.relation === "ally" ? "green" : "neutral"}>{alliance.relation}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{new Date(alliance.lastUpdatedAt).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <EmptyState label="No recent activity yet." />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function OverviewGrid({
  alliances,
  serverCount,
  dashboard
}: {
  alliances: Alliance[];
  serverCount: number;
  dashboard: ReturnType<typeof buildDashboard>;
}) {
  const cards = [
    { label: "Alliances", value: alliances.length.toString(), detail: `${serverCount} servers`, icon: Users },
    { label: "Total Copper", value: formatCompact(dashboard.totalCopper), detail: `${formatCompact(dashboard.averageCopper)} avg`, icon: RadioTower },
    { label: "Highest Copper", value: dashboard.highestCopper?.name ?? "None", detail: dashboard.highestCopper ? formatCompact(currentCopperNow(dashboard.highestCopper)) : "No data", icon: ShieldAlert },
    { label: "Fastest Growth", value: dashboard.highestCopperPerHour?.name ?? "None", detail: dashboard.highestCopperPerHour ? `${formatCompact(dashboard.highestCopperPerHour.copperPerHour)}/hr` : "No data", icon: TrendingUp },
    { label: "Highest Power", value: dashboard.highestPower?.name ?? "None", detail: dashboard.highestPower ? formatCompact(dashboard.highestPower.topThirtyHeroPower) : "No data", icon: Swords },
    { label: "Best Attendance", value: dashboard.highestAttendance?.name ?? "None", detail: dashboard.highestAttendance ? `${dashboard.highestAttendance.attendanceSaturday}% Saturday` : "No data", icon: Gauge },
    { label: "Top Activity", value: dashboard.highestActivity?.name ?? "None", detail: dashboard.highestActivity ? `${dashboard.highestActivity.activityRating}/10 activity` : "No data", icon: Activity },
    { label: "Enemy Copper", value: formatCompact(dashboard.enemyCopper), detail: `${dashboard.enemyCount} enemy alliances`, icon: Crosshair }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{card.label}</p>
              <Icon className="size-4 text-command-copper" />
            </div>
            <p className="truncate text-xl font-bold text-zinc-50">{card.value}</p>
            <p className="mt-1 truncate text-sm text-zinc-400">{card.detail}</p>
          </Card>
        );
      })}
    </div>
  );
}

function RankedPanel({
  title,
  alliances,
  metric,
  max,
  value
}: {
  title: string;
  alliances: Alliance[];
  metric: (alliance: Alliance) => string;
  max: number;
  value: (alliance: Alliance) => number;
}) {
  return (
    <div className="rounded-md border border-command-700 bg-command-900 p-3">
      <h4 className="mb-3 text-sm font-bold text-zinc-100">{title}</h4>
      <div className="space-y-3">
        {alliances.length ? (
          alliances.map((alliance, index) => (
            <div key={alliance.id}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-zinc-200">
                  {index + 1}. {alliance.name}
                </span>
                <span className="shrink-0 font-semibold text-command-amber">{metric(alliance)}</span>
              </div>
              <Bar value={value(alliance)} max={max} />
            </div>
          ))
        ) : (
          <EmptyState label="No data yet." />
        )}
      </div>
    </div>
  );
}

function TargetRow({ alliance, rank, max }: { alliance: Alliance; rank: number; max: number }) {
  const score = opportunityScore(alliance);
  const risk = dangerScore(alliance);
  const riskLabel = risk >= 78 ? "Extreme" : risk >= 58 ? "High" : risk >= 36 ? "Medium" : "Low";

  return (
    <div className="rounded-md border border-command-700 bg-command-900 p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-zinc-100">
            {rank}. {alliance.name}
          </p>
          <p className="text-xs text-zinc-500">Server {alliance.serverNumber}</p>
        </div>
        <Badge tone={riskLabel === "Extreme" || riskLabel === "High" ? "red" : riskLabel === "Medium" ? "copper" : "green"}>{riskLabel}</Badge>
      </div>
      <Bar value={score} max={max} />
      <div className="mt-2 flex justify-between text-xs text-zinc-400">
        <span>{formatCompact(currentCopperNow(alliance))} copper</span>
        <span>Priority {Math.round(score)}</span>
      </div>
    </div>
  );
}

function ForecastRow({ alliance, max }: { alliance: Alliance; max: number }) {
  const projected = projectedCopper(alliance, 24);
  const current = currentCopperNow(alliance);

  return (
    <div className="rounded-md border border-command-700 bg-command-900 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-zinc-100">{alliance.name}</p>
          <p className="text-xs text-zinc-500">Now {formatCompact(current)} | 24h {formatCompact(projected)}</p>
        </div>
        <Badge tone="copper">+{formatCompact(projected - current)}</Badge>
      </div>
      <Bar value={projected} max={max} />
    </div>
  );
}

function Bar({ value, max }: { value: number; max: number }) {
  const width = max <= 0 ? 0 : Math.max(4, Math.min(100, (value / max) * 100));
  return (
    <div className="h-2 overflow-hidden rounded-sm bg-command-800">
      <div className="h-full rounded-sm bg-command-copper" style={{ width: `${width}%` }} />
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="rounded-md border border-dashed border-command-700 bg-command-950/50 p-3 text-sm text-zinc-500">{label}</p>;
}

function buildDashboard(alliances: Alliance[]) {
  const byCopper = rankBy(alliances, (alliance) => currentCopperNow(alliance));
  const byGrowth = rankBy(alliances, (alliance) => alliance.copperPerHour);
  const byPower = rankBy(alliances, (alliance) => alliance.topThirtyHeroPower);
  const byAttendance = rankBy(alliances, (alliance) => Math.max(alliance.attendanceWednesday, alliance.attendanceSaturday));
  const byActivity = rankBy(alliances, (alliance) => alliance.activityRating);
  const mostDangerous = rankBy(alliances, dangerScore);
  const bestTargets = rankBy(
    alliances.filter((alliance) => alliance.relation !== "ally"),
    opportunityScore
  );
  const forecastLeaders = rankBy(alliances, (alliance) => projectedCopper(alliance, 24));
  const recentIntel = [...alliances].sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime()).slice(0, 5);
  const enemyAlliances = alliances.filter((alliance) => alliance.relation === "enemy");

  return {
    totalCopper: alliances.reduce((total, alliance) => total + currentCopperNow(alliance), 0),
    averageCopper: average(alliances.map((alliance) => currentCopperNow(alliance))),
    enemyCopper: enemyAlliances.reduce((total, alliance) => total + currentCopperNow(alliance), 0),
    enemyCount: enemyAlliances.length,
    highestCopper: byCopper[0],
    highestCopperPerHour: byGrowth[0],
    highestPower: byPower[0],
    highestAttendance: byAttendance[0],
    highestActivity: byActivity[0],
    topCopperThreats: byCopper.slice(0, 5),
    topPowerThreats: byPower.slice(0, 5),
    fastestGrowing: byGrowth.slice(0, 5),
    mostDangerous: mostDangerous.slice(0, 5),
    bestTargets: bestTargets.slice(0, 6),
    forecastLeaders: forecastLeaders.slice(0, 6),
    recentIntel,
    maxCopper: Math.max(0, ...alliances.map((alliance) => currentCopperNow(alliance))),
    maxCopperPerHour: Math.max(0, ...alliances.map((alliance) => alliance.copperPerHour)),
    maxPower: Math.max(0, ...alliances.map((alliance) => alliance.topThirtyHeroPower)),
    maxDangerScore: Math.max(0, ...alliances.map(dangerScore)),
    maxOpportunityScore: Math.max(0, ...alliances.map(opportunityScore)),
    maxProjectedCopper24: Math.max(0, ...alliances.map((alliance) => projectedCopper(alliance, 24)))
  };
}

function rankBy(alliances: Alliance[], score: (alliance: Alliance) => number) {
  return [...alliances].sort((a, b) => score(b) - score(a));
}

function dangerScore(alliance: Alliance) {
  return (
    normalize(currentCopperNow(alliance), 10_000_000) * 25 +
    normalize(alliance.copperPerHour, 500_000) * 20 +
    normalize(alliance.topThirtyHeroPower, 1_000_000_000) * 22 +
    normalize(Math.max(alliance.attendanceWednesday, alliance.attendanceSaturday), 100) * 15 +
    normalize(alliance.activityRating, 10) * 10 +
    normalize(threatWeight(alliance.threatTier), 6) * 8
  );
}

function opportunityScore(alliance: Alliance) {
  const value = normalize(currentCopperNow(alliance), 10_000_000) * 34 + normalize(alliance.copperPerHour, 500_000) * 22;
  const resistance = normalize(alliance.topThirtyHeroPower, 1_000_000_000) * 18 + normalize(Math.max(alliance.attendanceWednesday, alliance.attendanceSaturday), 100) * 14 + normalize(alliance.activityRating, 10) * 12;
  const relationBonus = alliance.relation === "enemy" ? 12 : 4;
  return Math.max(0, value - resistance + relationBonus);
}

function normalize(value: number, ceiling: number) {
  if (ceiling <= 0) return 0;
  return Math.min(1, Math.max(0, value / ceiling));
}
