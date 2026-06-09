"use client";

import { useMemo, useState } from "react";
import { ArrowRightLeft, Clock, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { calculateWinChance, copperForecast, currentCopperNow, formatCompact, formatNumber, projectedCopper } from "@/lib/calculations";
import { useWarPlannerStore } from "@/store/war-planner-store";
import type { Alliance } from "@/lib/types";

const FORECAST_HOURS = [6, 12, 24, 48, 72];
const PLUNDER_OPTIONS = [3, 6, 9, 12, 15];

export function Forecasting() {
  const activeWorkspaceId = useWarPlannerStore((state) => state.activeWorkspaceId);
  const allAlliances = useWarPlannerStore((state) => state.alliances);
  const alliances = useMemo(() => allAlliances.filter((alliance) => alliance.workspaceId === activeWorkspaceId), [activeWorkspaceId, allAlliances]);
  const [primaryId, setPrimaryId] = useState("");
  const [compareId, setCompareId] = useState("");
  const [targetDateTime, setTargetDateTime] = useState(defaultTargetDateTime);
  const targetHours = useMemo(() => hoursUntil(targetDateTime), [targetDateTime]);
  const primary = alliances.find((alliance) => alliance.id === primaryId) ?? alliances[0];
  const compare = alliances.find((alliance) => alliance.id === compareId) ?? alliances.find((alliance) => alliance.id !== primary?.id);
  const targetLeaders = useMemo(
    () => [...alliances].sort((a, b) => projectedCopper(b, targetHours) - projectedCopper(a, targetHours)).slice(0, 12),
    [alliances, targetHours]
  );
  const leaders = useMemo(
    () => [...alliances].sort((a, b) => projectedCopper(b, 72) - projectedCopper(a, 72)).slice(0, 8),
    [alliances]
  );
  const maxTargetProjected = Math.max(1, ...alliances.map((alliance) => projectedCopper(alliance, targetHours)));
  const maxProjected = Math.max(1, ...alliances.map((alliance) => projectedCopper(alliance, 72)));

  if (!primary) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-bold text-zinc-50">Forecasting needs alliance data</h3>
        <p className="mt-2 text-sm text-zinc-400">Add alliances with copper and copper/hour values before forecasting.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="mb-4 flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-md border border-command-copper/50 bg-command-copper/15">
            <TrendingUp className="size-5 text-command-copper" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-50">Copper Forecasting</h3>
            <p className="text-sm text-zinc-400">Projected Copper = Current Copper + Copper Per Hour x Hours.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <AlliancePicker label="Primary alliance" alliances={alliances} value={primary.id} onChange={setPrimaryId} />
          <AlliancePicker label="Compare alliance" alliances={alliances.filter((alliance) => alliance.id !== primary.id)} value={compare?.id ?? ""} onChange={setCompareId} />
        </div>
      </Card>

      <Card className="p-4">
        <SectionTitle icon={Clock} title="Target Time Ranking" subtitle="Pick the exact date and time you want to check." />
        <div className="mb-4 grid gap-3 md:grid-cols-[minmax(220px,320px)_1fr]">
          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-command-amber">Target date/time</span>
            <Input type="datetime-local" value={targetDateTime} onChange={(event) => setTargetDateTime(event.target.value)} />
          </label>
          <div className="rounded-md border border-command-700 bg-command-900 p-3 text-sm text-zinc-300">
            Forecasting <span className="font-semibold text-command-amber">{formatHours(targetHours)}</span> from now using each alliance&apos;s current copper/hour.
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {targetLeaders.map((alliance, index) => (
            <LeaderRow key={alliance.id} rank={index + 1} alliance={alliance} max={maxTargetProjected} hours={targetHours} />
          ))}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-4">
          <SectionTitle icon={Clock} title={`${primary.name} Forecast`} subtitle={`Current ${formatCompact(currentCopperNow(primary))} | ${formatCompact(primary.copperPerHour)}/hr`} />
          <div className="space-y-3">
            {copperForecast(primary, FORECAST_HOURS).map((point) => (
              <ForecastRow key={point.hour} hour={point.hour} copper={point.copper} gained={point.gained} max={projectedCopper(primary, 72)} />
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <SectionTitle icon={ArrowRightLeft} title="Alliance Comparison" subtitle={compare ? `${primary.name} vs ${compare.name}` : "Select a second alliance to compare."} />
          {compare ? (
            <div className="space-y-3">
              {FORECAST_HOURS.map((hour) => (
                <ComparisonRow key={hour} hour={hour} primary={primary} compare={compare} />
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-command-700 bg-command-950/50 p-3 text-sm text-zinc-500">No comparison alliance available.</p>
          )}
        </Card>
      </div>

      {compare && <MatchupAnalysis primary={primary} compare={compare} hours={targetHours} />}

      <Card className="p-4">
        <SectionTitle icon={TrendingUp} title="72 Hour Forecast Leaders" subtitle="All tracked alliances ranked by projected copper after 72 hours." />
        <div className="grid gap-3 lg:grid-cols-2">
          {leaders.map((alliance, index) => (
            <LeaderRow key={alliance.id} rank={index + 1} alliance={alliance} max={maxProjected} hours={72} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function MatchupAnalysis({ primary, compare, hours }: { primary: Alliance; compare: Alliance; hours: number }) {
  const matchup = calculateWinChance(primary, compare);
  const confidence = matchupConfidence(primary, compare, matchup.chance);
  const primaryProjected = projectedCopper(primary, hours);
  const compareProjected = projectedCopper(compare, hours);
  const copperDifference = primaryProjected - compareProjected;
  const maxProjected = Math.max(primaryProjected, compareProjected, 1);
  const recommendation = matchupRecommendation(matchup.chance, copperDifference);

  return (
    <Card className="p-4">
      <SectionTitle icon={ArrowRightLeft} title="War Matchup Analysis" subtitle={`${primary.name} attacking ${compare.name} at the selected target time.`} />
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-3">
          <div className="rounded-md border border-command-700 bg-command-900 p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-zinc-400">Projected matchup</p>
                <p className="text-2xl font-bold text-zinc-50">{formatNumber(matchup.chance)}%</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={matchup.chance >= 58 ? "green" : matchup.chance >= 44 ? "copper" : "red"}>{matchup.difficulty}</Badge>
                <Badge tone={confidence === "High" ? "green" : confidence === "Medium" ? "copper" : "red"}>{confidence} confidence</Badge>
              </div>
            </div>
            <p className="text-sm text-zinc-300">{recommendation}</p>
          </div>

          <div className="rounded-md border border-command-700 bg-command-900 p-3">
            <p className="mb-2 text-sm font-semibold text-zinc-100">Projected copper at target time</p>
            <div className="space-y-2">
              <LabeledBar label={primary.name} value={primaryProjected} max={maxProjected} />
              <LabeledBar label={compare.name} value={compareProjected} max={maxProjected} />
            </div>
            <p className={`mt-2 text-sm font-semibold ${copperDifference >= 0 ? "text-command-green" : "text-command-red"}`}>
              Difference {formatCompact(copperDifference)}
            </p>
          </div>

          <MatchupNotes matchup={matchup} />
        </div>

        <div className="rounded-md border border-command-700 bg-command-900 p-3">
          <p className="mb-1 text-sm font-semibold text-zinc-100">Copper swing by plunder round</p>
          <p className="mb-3 text-xs text-zinc-500">Uses projected copper at the selected target time.</p>
          <div className="space-y-2">
            {PLUNDER_OPTIONS.map((percent) => (
              <PlunderRow key={percent} percent={percent} primary={primaryProjected} enemy={compareProjected} />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function MatchupNotes({ matchup }: { matchup: ReturnType<typeof calculateWinChance> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-md border border-command-700 bg-command-900 p-3">
        <p className="mb-2 text-sm font-semibold text-command-green">Advantages</p>
        {matchup.strengths.length ? (
          <ul className="space-y-1 text-sm text-zinc-300">
            {matchup.strengths.map((strength) => (
              <li key={strength}>{strength}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">No clear advantage from the current data.</p>
        )}
      </div>
      <div className="rounded-md border border-command-700 bg-command-900 p-3">
        <p className="mb-2 text-sm font-semibold text-command-red">Risks</p>
        {matchup.weaknesses.length ? (
          <ul className="space-y-1 text-sm text-zinc-300">
            {matchup.weaknesses.map((weakness) => (
              <li key={weakness}>{weakness}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">No major risk flagged from the current data.</p>
        )}
      </div>
    </div>
  );
}

function PlunderRow({ percent, primary, enemy }: { percent: number; primary: number; enemy: number }) {
  const gain = enemy * (percent / 100);
  const loss = primary * (percent / 100);
  const afterWin = primary + gain;
  const afterLoss = primary - loss;

  return (
    <div className="grid gap-2 rounded-md border border-command-700 bg-command-950/50 p-3 text-sm md:grid-cols-[4rem_1fr_1fr]">
      <p className="font-bold text-command-amber">{percent}%</p>
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">If we plunder</p>
        <p className="font-semibold text-command-green">+{formatCompact(gain)}</p>
        <p className="text-xs text-zinc-500">Our copper: {formatCompact(afterWin)}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">If they plunder us</p>
        <p className="font-semibold text-command-red">-{formatCompact(loss)}</p>
        <p className="text-xs text-zinc-500">Our copper: {formatCompact(afterLoss)}</p>
      </div>
    </div>
  );
}

function AlliancePicker({ label, alliances, value, onChange }: { label: string; alliances: Alliance[]; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-command-amber">{label}</span>
      <Select value={value} onChange={(event) => onChange(event.target.value)}>
        {alliances.length === 0 && <option value="">No alliance available</option>}
        {alliances.map((alliance) => (
          <option key={alliance.id} value={alliance.id}>
            {alliance.name} | Server {alliance.serverNumber}
          </option>
        ))}
      </Select>
    </label>
  );
}

function ForecastRow({ hour, copper, gained, max }: { hour: number; copper: number; gained: number; max: number }) {
  return (
    <div className="rounded-md border border-command-700 bg-command-900 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-zinc-100">{hour} hours</p>
          <p className="text-xs text-zinc-500">Gain {formatCompact(gained)}</p>
        </div>
        <Badge tone="copper">{formatCompact(copper)}</Badge>
      </div>
      <Bar value={copper} max={max} />
    </div>
  );
}

function ComparisonRow({ hour, primary, compare }: { hour: number; primary: Alliance; compare: Alliance }) {
  const primaryCopper = projectedCopper(primary, hour);
  const compareCopper = projectedCopper(compare, hour);
  const max = Math.max(primaryCopper, compareCopper, 1);
  const difference = primaryCopper - compareCopper;

  return (
    <div className="rounded-md border border-command-700 bg-command-900 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="font-semibold text-zinc-100">{hour} hours</p>
        <Badge tone={difference >= 0 ? "green" : "red"}>{formatCompact(difference)}</Badge>
      </div>
      <div className="space-y-2">
        <LabeledBar label={primary.name} value={primaryCopper} max={max} />
        <LabeledBar label={compare.name} value={compareCopper} max={max} />
      </div>
    </div>
  );
}

function LeaderRow({ rank, alliance, max, hours }: { rank: number; alliance: Alliance; max: number; hours: number }) {
  const projected = projectedCopper(alliance, hours);

  return (
    <div className="rounded-md border border-command-700 bg-command-900 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-zinc-100">
            {rank}. {alliance.name}
          </p>
          <p className="text-xs text-zinc-500">
            Current {formatCompact(currentCopperNow(alliance))} | {formatCompact(alliance.copperPerHour)}/hr
          </p>
        </div>
        <Badge tone={alliance.relation === "enemy" ? "red" : alliance.relation === "ally" ? "green" : "neutral"}>{alliance.relation}</Badge>
      </div>
      <Bar value={projected} max={max} />
      <p className="mt-2 text-sm font-semibold text-command-amber">
        {formatHours(hours)} {formatCompact(projected)}
      </p>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: typeof TrendingUp; title: string; subtitle: string }) {
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
      <div className="mb-1 flex justify-between gap-3 text-xs text-zinc-400">
        <span className="truncate">{label}</span>
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

function defaultTargetDateTime() {
  const date = new Date();
  date.setHours(date.getHours() + 24);
  return toDateTimeLocalValue(date);
}

function toDateTimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function hoursUntil(value: string) {
  const targetTime = new Date(value).getTime();
  if (!Number.isFinite(targetTime)) {
    return 0;
  }
  return Math.max(0, (targetTime - Date.now()) / (1000 * 60 * 60));
}

function formatHours(hours: number) {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }
  return `${(hours / 24).toFixed(1)}d`;
}

function matchupConfidence(primary: Alliance, compare: Alliance, chance: number) {
  const confidenceScore =
    confidenceValue(primary.attendanceConfidence) +
    confidenceValue(primary.activityConfidence) +
    confidenceValue(compare.attendanceConfidence) +
    confidenceValue(compare.activityConfidence);
  const dataConfidence = confidenceScore / 8;
  const decisiveness = Math.abs(chance - 50) / 50;
  const combined = dataConfidence * 0.65 + decisiveness * 0.35;

  if (combined >= 0.7) return "High";
  if (combined >= 0.42) return "Medium";
  return "Low";
}

function confidenceValue(value: Alliance["attendanceConfidence"]) {
  if (value === "High") return 2;
  if (value === "Medium") return 1;
  return 0;
}

function matchupRecommendation(chance: number, copperDifference: number) {
  if (chance >= 72 && copperDifference >= 0) return "Strong target. Stats and copper position both favor this fight.";
  if (chance >= 58) return "Favorable fight. Worth considering, but confirm attendance before committing.";
  if (chance >= 44) return "Close fight. Small attendance or timing changes could swing the result.";
  if (chance >= 30) return "Risky fight. Only take it if the plunder value or strategic reason is worth the risk.";
  return "Avoid unless there is a specific tactical reason. Current data points to a bad matchup.";
}
