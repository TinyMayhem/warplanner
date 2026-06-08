"use client";

import { useState } from "react";
import { Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWarPlannerStore } from "@/store/war-planner-store";
import type { Server } from "@/lib/types";

export function ServerForm({ server, onDone }: { server?: Server; onDone?: () => void }) {
  const addServer = useWarPlannerStore((state) => state.addServer);
  const updateServer = useWarPlannerStore((state) => state.updateServer);
  const [serverNumber, setServerNumber] = useState(server?.serverNumber.toString() ?? "");
  const [notes, setNotes] = useState(server?.notes ?? "");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsedServer = Number(serverNumber);
    if (!Number.isFinite(parsedServer) || parsedServer <= 0) return;

    if (server) updateServer(server.id, { serverNumber: parsedServer, notes });
    else addServer({ serverNumber: parsedServer, notes });
    setServerNumber("");
    setNotes("");
    onDone?.();
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <Input type="number" min={1} placeholder="Server number" value={serverNumber} onChange={(event) => setServerNumber(event.target.value)} />
      <Textarea placeholder="Server notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
      <div className="flex gap-2">
        <Button type="submit">
          {server ? <Save className="size-4" /> : <Plus className="size-4" />}
          {server ? "Save" : "Add Server"}
        </Button>
        {server && (
          <Button type="button" variant="ghost" onClick={onDone}>
            <X className="size-4" />
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
