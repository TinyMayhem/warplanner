"use client";

import { useMemo, useState } from "react";
import { ArrowRightLeft, Clock, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { copperForecast, formatCompact, projectedCopper } from "@/lib/calculations";
import { useWarPlannerStore } from "@/store/war-planner-store";
import type { Alliance } from "@/lib/types";

const FORECAST_HOURS = [6, 12, 24, 48, 72];

export function Forecasting() {
  const activeWorkspaceId = useWarPlannerStore((state) => state.activeWorkspaceId);
  const allAlliances = useWarPlannerStore((state) => state.alliances);
  const alliances = useMemo(() => allAlliances.filter((alliance) => alliance.workspaceId === activeWorkspaceId), [activeWorkspaceId, allAlliances]);
  const [primaryId, setPrimaryId] = useState("");
  const [compareId, setCompareId] = useState("");
  const primary = alliances.find((alliance) => alliance.id === primaryId) ?? alliances[0];
  const compare = alliances.find((alliance) => alliance.id === compareId) ?? alliances.find((alliance) => alliance.id !== primary?.id);
  const leaders = useMemo(
    () => [...alliances].sort((a, b) => projectedCopper(b, 72) - projectedCopper(a, 72)).slice(0, 8),
    [alliances]
  );
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

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-4">
          <SectionTitle icon={Clock} title={`${primary.name} Forecast`} subtitle={`Current ${formatCompact(primary.currentCopper)} | ${formatCompact(primary.copperPerHour)}/hr`} />
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

      <Card className="p-4">
        <SectionTitle icon={TrendingUp} title="72 Hour Forecast Leaders" subtitle="All tracked alliances ranked by projected copper after 72 hours." />
        <div className="grid gap-3 lg:grid-cols-2">
          {leaders.map((alliance, index) => (
            <LeaderRow key={alliance.id} rank={index + 1} alliance={alliance} max={maxProjected} />
          ))}
        </div>
      </Card>
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

function LeaderRow({ rank, alliance, max }: { rank: number; alliance: Alliance; max: number }) {
  const projected = projectedCopper(alliance, 72);

  return (
    <div className="rounded-md border border-command-700 bg-command-900 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-zinc-100">
            {rank}. {alliance.name}
          </p>
          <p className="text-xs text-zinc-500">
            Current {formatCompact(alliance.currentCopper)} | {formatCompact(alliance.copperPerHour)}/hr
          </p>
        </div>
        <Badge tone={alliance.relation === "enemy" ? "red" : alliance.relation === "ally" ? "green" : "neutral"}>{alliance.relation}</Badge>
      </div>
      <Bar value={projected} max={max} />
      <p className="mt-2 text-sm font-semibold text-command-amber">72h {formatCompact(projected)}</p>
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
