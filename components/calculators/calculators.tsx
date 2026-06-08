"use client";

import { useMemo, useState } from "react";
import { Calculator, Crosshair, Gauge, Swords, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  bestAttendance,
  calculateWinChance,
  copperAdvantage,
  formatCompact,
  formatNumber,
  targetPriorityScore,
  targetRiskLevel
} from "@/lib/calculations";
import { useWarPlannerStore } from "@/store/war-planner-store";
import type { Alliance } from "@/lib/types";

type OverrideState = Pick<Alliance, "currentCopper" | "copperPerHour" | "topThirtyHeroPower" | "attendanceWednesday" | "attendanceSaturday" | "activityRating" | "threatTier">;

export function Calculators() {
  const activeWorkspaceId = useWarPlannerStore((state) => state.activeWorkspaceId);
  const allAlliances = useWarPlannerStore((state) => state.alliances);
  const alliances = useMemo(() => allAlliances.filter((alliance) => alliance.workspaceId === activeWorkspaceId), [activeWorkspaceId, allAlliances]);
  const [ourId, setOurId] = useState("");
  const [enemyId, setEnemyId] = useState("");
  const ourAlliance = alliances.find((alliance) => alliance.id === ourId) ?? alliances.find((alliance) => alliance.relation === "ally") ?? alliances[0];
  const enemyAlliance = alliances.find((alliance) => alliance.id === enemyId) ?? alliances.find((alliance) => alliance.relation === "enemy") ?? alliances.find((alliance) => alliance.id !== ourAlliance?.id);
  const [ourOverrides, setOurOverrides] = useState<Partial<OverrideState>>({});
  const [enemyOverrides, setEnemyOverrides] = useState<Partial<OverrideState>>({});
  const ours = useMemo(() => mergeOverrides(ourAlliance, ourOverrides), [ourAlliance, ourOverrides]);
  const enemy = useMemo(() => mergeOverrides(enemyAlliance, enemyOverrides), [enemyAlliance, enemyOverrides]);
  const targets = useMemo(
    () =>
      alliances
        .filter((alliance) => alliance.relation !== "ally")
        .map((alliance) => ({ alliance, priority: targetPriorityScore(alliance), risk: targetRiskLevel(alliance) }))
        .sort((a, b) => b.priority - a.priority),
    [alliances]
  );

  if (!ours || !enemy) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-bold text-zinc-50">Calculators need alliance data</h3>
        <p className="mt-2 text-sm text-zinc-400">Add at least two alliances before running Phase 3 analysis.</p>
      </Card>
    );
  }

  const winChance = calculateWinChance(ours, enemy);
  const copper = copperAdvantage(ours, enemy);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <AlliancePicker label="Our alliance" alliances={alliances} selectedId={ourAlliance?.id ?? ""} onChange={setOurId} />
          <AlliancePicker label="Enemy alliance" alliances={alliances} selectedId={enemyAlliance?.id ?? ""} onChange={setEnemyId} />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-4">
          <SectionHeading icon={Swords} title="Win Chance Calculator" subtitle="Weighted by copper, power, attendance, and activity." />
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <OverridePanel title="Our values" values={ours} onChange={setOurOverrides} />
            <OverridePanel title="Enemy values" values={enemy} onChange={setEnemyOverrides} />
          </div>
          <div className="rounded-md border border-command-700 bg-command-900 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-zinc-400">Projected win chance</p>
                <p className="text-4xl font-bold text-zinc-50">{Math.round(winChance.chance)}%</p>
              </div>
              <Badge tone={winChance.chance >= 58 ? "green" : winChance.chance >= 44 ? "copper" : "red"}>{winChance.difficulty}</Badge>
            </div>
            <BreakdownBar label="Copper Score" value={winChance.scores.copper} weight="30%" />
            <BreakdownBar label="Power Score" value={winChance.scores.power} weight="30%" />
            <BreakdownBar label="Attendance Score" value={winChance.scores.attendance} weight="25%" />
            <BreakdownBar label="Activity Score" value={winChance.scores.activity} weight="15%" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ReasonList title="Strengths" items={winChance.strengths} tone="green" fallback="No clear advantage." />
              <ReasonList title="Weaknesses" items={winChance.weaknesses} tone="red" fallback="No clear weakness." />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <SectionHeading icon={TrendingUp} title="Copper Analysis" subtitle="Current gap, income gap, and projected copper by time window." />
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Metric label="Copper difference" value={formatCompact(copper.difference)} />
            <Metric label="Copper advantage" value={`${copper.percentage.toFixed(1)}%`} />
            <Metric label="Copper/hour gap" value={`${formatCompact(copper.copperPerHourDifference)}/hr`} />
          </div>
          <div className="space-y-3">
            {copper.projections.map((projection) => (
              <ProjectionRow key={projection.hours} hours={projection.hours} ours={projection.ours} enemy={projection.enemy} difference={projection.difference} />
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <SectionHeading icon={Crosshair} title="Target Priority Calculator" subtitle="Ranks enemy and neutral alliances by attack value and risk." />
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {targets.length ? (
            targets.map((target, index) => (
              <TargetCard key={target.alliance.id} rank={index + 1} alliance={target.alliance} priority={target.priority} risk={target.risk} />
            ))
          ) : (
            <p className="text-sm text-zinc-400">Mark alliances as enemy or neutral to generate target priorities.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function AlliancePicker({ label, alliances, selectedId, onChange }: { label: string; alliances: Alliance[]; selectedId: string; onChange: (id: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">{label}</span>
      <Select value={selectedId} onChange={(event) => onChange(event.target.value)}>
        {alliances.map((alliance) => (
          <option key={alliance.id} value={alliance.id}>
            {alliance.name} | Server {alliance.serverNumber}
          </option>
        ))}
      </Select>
    </label>
  );
}

function OverridePanel({ title, values, onChange }: { title: string; values: OverrideState; onChange: React.Dispatch<React.SetStateAction<Partial<OverrideState>>> }) {
  return (
    <div className="rounded-md border border-command-700 bg-command-900 p-3">
      <h4 className="mb-3 text-sm font-bold text-zinc-100">{title}</h4>
      <div className="grid gap-2">
        <NumberOverride label="Copper" value={values.currentCopper} onChange={(value) => onChange((current) => ({ ...current, currentCopper: value }))} />
        <NumberOverride label="Copper/hour" value={values.copperPerHour} onChange={(value) => onChange((current) => ({ ...current, copperPerHour: value }))} />
        <NumberOverride label="Hero power" value={values.topThirtyHeroPower} onChange={(value) => onChange((current) => ({ ...current, topThirtyHeroPower: value }))} />
        <NumberOverride label="Attendance %" value={bestAttendance(values)} onChange={(value) => onChange((current) => ({ ...current, attendanceWednesday: value, attendanceSaturday: value }))} />
        <NumberOverride label="Activity" min={1} max={10} value={values.activityRating} onChange={(value) => onChange((current) => ({ ...current, activityRating: value }))} />
      </div>
    </div>
  );
}

function NumberOverride({ label, value, min, max, onChange }: { label: string; value: number; min?: number; max?: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-zinc-500">{label}</span>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const parsed = Number(event.target.value);
          onChange(Number.isFinite(parsed) ? parsed : 0);
        }}
      />
    </label>
  );
}

function BreakdownBar({ label, value, weight }: { label: string; value: number; weight: string }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between gap-3 text-sm">
        <span className="text-zinc-300">{label}</span>
        <span className="text-command-amber">{Math.round(value)} | {weight}</span>
      </div>
      <Bar value={value} max={100} />
    </div>
  );
}

function ProjectionRow({ hours, ours, enemy, difference }: { hours: number; ours: number; enemy: number; difference: number }) {
  const max = Math.max(ours, enemy, 1);

  return (
    <div className="rounded-md border border-command-700 bg-command-900 p-3">
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-semibold text-zinc-100">{hours} hour{hours === 1 ? "" : "s"}</span>
        <span className={difference >= 0 ? "text-command-green" : "text-command-red"}>{formatCompact(difference)}</span>
      </div>
      <div className="space-y-2">
        <LabeledBar label="Ours" value={ours} max={max} />
        <LabeledBar label="Enemy" value={enemy} max={max} />
      </div>
    </div>
  );
}

function TargetCard({ rank, alliance, priority, risk }: { rank: number; alliance: Alliance; priority: number; risk: string }) {
  return (
    <div className="rounded-md border border-command-700 bg-command-900 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-zinc-50">{rank}. {alliance.name}</p>
          <p className="text-xs text-zinc-500">Server {alliance.serverNumber} | Threat {alliance.threatTier}</p>
        </div>
        <Badge tone={risk === "Low" ? "green" : risk === "Medium" ? "copper" : "red"}>{risk}</Badge>
      </div>
      <Bar value={priority} max={100} />
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-zinc-400">
        <span>{formatCompact(alliance.currentCopper)} copper</span>
        <span>{formatCompact(alliance.copperPerHour)}/hr</span>
        <span>{formatNumber(bestAttendance(alliance))}% attend</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-command-amber">Priority {Math.round(priority)}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-command-700 bg-command-900 p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-zinc-50">{value}</p>
    </div>
  );
}

function ReasonList({ title, items, tone, fallback }: { title: string; items: string[]; tone: "green" | "red"; fallback: string }) {
  return (
    <div className="rounded-md border border-command-700 bg-command-950 p-3">
      <p className="mb-2 text-sm font-bold text-zinc-100">{title}</p>
      <div className="flex flex-wrap gap-2">
        {(items.length ? items : [fallback]).map((item) => (
          <Badge key={item} tone={items.length ? tone : "neutral"}>{item}</Badge>
        ))}
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, subtitle }: { icon: typeof Calculator; title: string; subtitle: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-md border border-command-copper/50 bg-command-copper/15">
        <Icon className="size-5 text-command-copper" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-zinc-50">{title}</h3>
        <p className="text-sm text-zinc-400">{subtitle}</p>
      </div>
    </div>
  );
}

function LabeledBar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-zinc-400">
        <span>{label}</span>
        <span>{formatCompact(value)}</span>
      </div>
      <Bar value={value} max={max} />
    </div>
  );
}

function Bar({ value, max }: { value: number; max: number }) {
  const width = max <= 0 ? 0 : Math.max(3, Math.min(100, (value / max) * 100));
  return (
    <div className="h-2 overflow-hidden rounded-sm bg-command-800">
      <div className="h-full rounded-sm bg-command-copper" style={{ width: `${width}%` }} />
    </div>
  );
}

function mergeOverrides(alliance: Alliance | undefined, overrides: Partial<OverrideState>) {
  if (!alliance) return undefined;
  return {
    currentCopper: alliance.currentCopper,
    copperPerHour: alliance.copperPerHour,
    topThirtyHeroPower: alliance.topThirtyHeroPower,
    attendanceWednesday: alliance.attendanceWednesday,
    attendanceSaturday: alliance.attendanceSaturday,
    activityRating: alliance.activityRating,
    threatTier: alliance.threatTier,
    ...overrides
  };
}
