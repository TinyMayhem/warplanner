"use client";

import { useMemo, useState } from "react";
import { Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useWarPlannerStore } from "@/store/war-planner-store";
import type { Alliance, ConfidenceRating, RelationStatus, ThreatTier } from "@/lib/types";

const threatTiers: ThreatTier[] = ["S", "A", "B", "C", "D", "Unknown"];
const confidenceRatings: ConfidenceRating[] = ["Low", "Medium", "High"];
const relations: RelationStatus[] = ["ally", "enemy", "neutral"];

type FormState = Omit<Alliance, "id" | "lastUpdatedAt" | "workspaceId">;

export function AllianceForm({ alliance, onDone }: { alliance?: Alliance; onDone?: () => void }) {
  const activeWorkspaceId = useWarPlannerStore((state) => state.activeWorkspaceId);
  const allServers = useWarPlannerStore((state) => state.servers);
  const addAlliance = useWarPlannerStore((state) => state.addAlliance);
  const updateAlliance = useWarPlannerStore((state) => state.updateAlliance);
  const servers = allServers.filter((server) => server.workspaceId === activeWorkspaceId);
  const firstServer = servers[0];
  const defaultState = useMemo<FormState>(
    () => ({
      name: "",
      serverId: firstServer?.id ?? "",
      serverNumber: firstServer?.serverNumber ?? 0,
      relation: "neutral",
      notes: "",
      currentCopper: 0,
      copperPerHour: 0,
      topThirtyHeroPower: 0,
      averageTopThirtyHeroPower: 0,
      strongestPlayerPower: 0,
      activityRating: 5,
      attendanceWednesday: 50,
      attendanceSaturday: 50,
      threatTier: "Unknown",
      attendanceConfidence: "Medium",
      activityConfidence: "Medium"
    }),
    [firstServer?.id, firstServer?.serverNumber]
  );
  const [form, setForm] = useState<FormState>(alliance ? stripWorkspace(alliance) : defaultState);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateServer(serverId: string) {
    const server = servers.find((candidate) => candidate.id === serverId);
    if (!server) return;
    setForm((current) => ({ ...current, serverId, serverNumber: server.serverNumber }));
  }

  function numberValue(value: string) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.serverId) return;
    const normalized = { ...form, name: form.name.trim() };
    if (alliance) updateAlliance(alliance.id, normalized);
    else addAlliance(normalized);
    if (!alliance) setForm(defaultState);
    onDone?.();
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-3">
        <FieldLabel label="Alliance name">
          <Input placeholder="Alliance name" value={form.name} onChange={(event) => update("name", event.target.value)} />
        </FieldLabel>
        <FieldLabel label="Server">
          <Select value={form.serverId} onChange={(event) => updateServer(event.target.value)}>
            {servers.map((server) => (
              <option key={server.id} value={server.id}>
                Server {server.serverNumber}
              </option>
            ))}
          </Select>
        </FieldLabel>
        <FieldLabel label="Relationship status">
          <Select value={form.relation} onChange={(event) => update("relation", event.target.value as RelationStatus)}>
            {relations.map((relation) => (
              <option key={relation} value={relation}>
                {relation}
              </option>
            ))}
          </Select>
        </FieldLabel>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumberInput label="Copper" value={form.currentCopper} onChange={(value) => update("currentCopper", value)} numberValue={numberValue} />
        <NumberInput label="Copper/hour" value={form.copperPerHour} onChange={(value) => update("copperPerHour", value)} numberValue={numberValue} />
        <NumberInput label="Top 30 power" value={form.topThirtyHeroPower} onChange={(value) => update("topThirtyHeroPower", value)} numberValue={numberValue} />
        <NumberInput label="Avg top 30 power" value={form.averageTopThirtyHeroPower} onChange={(value) => update("averageTopThirtyHeroPower", value)} numberValue={numberValue} />
        <NumberInput label="Strongest player power" value={form.strongestPlayerPower} onChange={(value) => update("strongestPlayerPower", value)} numberValue={numberValue} />
        <NumberInput label="Activity 1-10" help={<ActivityRatingLegend />} min={1} max={10} value={form.activityRating} onChange={(value) => update("activityRating", value)} numberValue={numberValue} />
        <NumberInput label="Wed attendance %" min={0} max={100} value={form.attendanceWednesday} onChange={(value) => update("attendanceWednesday", value)} numberValue={numberValue} />
        <NumberInput label="Sat attendance %" min={0} max={100} value={form.attendanceSaturday} onChange={(value) => update("attendanceSaturday", value)} numberValue={numberValue} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <FieldLabel label="Threat tier" help={<ThreatTierLegend />}>
          <Select value={form.threatTier} onChange={(event) => update("threatTier", event.target.value as ThreatTier)}>
            {threatTiers.map((tier) => (
              <option key={tier} value={tier}>
                Threat {tier}
              </option>
            ))}
          </Select>
        </FieldLabel>
        <FieldLabel label="Attendance confidence">
          <Select value={form.attendanceConfidence} onChange={(event) => update("attendanceConfidence", event.target.value as ConfidenceRating)}>
            {confidenceRatings.map((rating) => (
              <option key={rating} value={rating}>
                Attendance {rating}
              </option>
            ))}
          </Select>
        </FieldLabel>
        <FieldLabel label="Activity confidence">
          <Select value={form.activityConfidence} onChange={(event) => update("activityConfidence", event.target.value as ConfidenceRating)}>
            {confidenceRatings.map((rating) => (
              <option key={rating} value={rating}>
                Activity {rating}
              </option>
            ))}
          </Select>
        </FieldLabel>
      </div>

      <FieldLabel label="Notes">
        <Textarea placeholder="Alliance notes" value={form.notes} onChange={(event) => update("notes", event.target.value)} />
      </FieldLabel>
      <div className="flex flex-wrap gap-2">
        <Button type="submit">
          {alliance ? <Save className="size-4" /> : <Plus className="size-4" />}
          {alliance ? "Save Alliance" : "Add Alliance"}
        </Button>
        {alliance && (
          <Button type="button" variant="ghost" onClick={onDone}>
            <X className="size-4" />
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function FieldLabel({ label, help, children }: { label: string; help?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-command-amber">
        {label}
        {help}
      </span>
      {children}
    </label>
  );
}

function ThreatTierLegend() {
  const tiers = [
    { tier: "S", meaning: "Extreme threat. Highest priority to watch." },
    { tier: "A", meaning: "Major threat. Strong copper, power, or activity." },
    { tier: "B", meaning: "Serious threat. Capable but not top tier." },
    { tier: "C", meaning: "Moderate threat. Manageable with planning." },
    { tier: "D", meaning: "Low threat. Limited danger or value." },
    { tier: "Unknown", meaning: "Not enough intel yet." }
  ];

  return (
    <InfoPopover label="Threat tier legend" widthClass="w-72">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-command-amber">Threat tier legend</span>
      <span className="grid gap-2">
        {tiers.map((item) => (
          <span key={item.tier} className="grid grid-cols-[3rem_1fr] gap-2 text-xs leading-5">
            <span className="font-bold text-zinc-100">{item.tier}</span>
            <span>{item.meaning}</span>
          </span>
        ))}
      </span>
    </InfoPopover>
  );
}

function InfoPopover({ label, widthClass, children }: { label: string; widthClass: string; children: React.ReactNode }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={label}
        className="grid size-5 place-items-center rounded-full border border-command-copper/60 bg-command-copper/15 text-[11px] font-bold leading-none text-command-amber outline-none transition hover:bg-command-copper/25 focus:bg-command-copper/25"
      >
        i
      </button>
      <span
        className={`pointer-events-none absolute left-0 top-7 z-20 hidden rounded-md border border-command-700 bg-command-900 p-3 text-left normal-case tracking-normal text-zinc-300 shadow-panel group-hover:block group-focus-within:block ${widthClass}`}
      >
        {children}
      </span>
    </span>
  );
}

function ActivityRatingLegend() {
  const levels = [
    { range: "1-2", meaning: "Very low activity. Rarely observed or inconsistent." },
    { range: "3-4", meaning: "Low activity. Some movement, weak follow-through." },
    { range: "5-6", meaning: "Moderate activity. Shows up, but not constantly." },
    { range: "7-8", meaning: "High activity. Reliable response and steady pressure." },
    { range: "9-10", meaning: "Extreme activity. Fast response, strong coordination, frequent pressure." }
  ];

  return (
    <InfoPopover label="Activity rating legend" widthClass="w-80">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-command-amber">Activity rating legend</span>
      <span className="grid gap-2">
        {levels.map((item) => (
          <span key={item.range} className="grid grid-cols-[3rem_1fr] gap-2 text-xs leading-5">
            <span className="font-bold text-zinc-100">{item.range}</span>
            <span>{item.meaning}</span>
          </span>
        ))}
      </span>
    </InfoPopover>
  );
}

function NumberInput({
  label,
  help,
  value,
  min,
  max,
  onChange,
  numberValue
}: {
  label: string;
  help?: React.ReactNode;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  numberValue: (value: string) => number;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-command-amber">
        {label}
        {help}
      </span>
      <Input type="number" min={min} max={max} value={value} onChange={(event) => onChange(numberValue(event.target.value))} />
    </label>
  );
}

function stripWorkspace(alliance: Alliance): FormState {
  return {
    name: alliance.name,
    serverId: alliance.serverId,
    serverNumber: alliance.serverNumber,
    relation: alliance.relation,
    notes: alliance.notes,
    currentCopper: alliance.currentCopper,
    copperPerHour: alliance.copperPerHour,
    topThirtyHeroPower: alliance.topThirtyHeroPower,
    averageTopThirtyHeroPower: alliance.averageTopThirtyHeroPower,
    strongestPlayerPower: alliance.strongestPlayerPower,
    activityRating: alliance.activityRating,
    attendanceWednesday: alliance.attendanceWednesday,
    attendanceSaturday: alliance.attendanceSaturday,
    threatTier: alliance.threatTier,
    attendanceConfidence: alliance.attendanceConfidence,
    activityConfidence: alliance.activityConfidence
  };
}
