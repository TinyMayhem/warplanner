import { AppShell } from "@/components/app-shell";
import { ServerList } from "@/components/servers/server-list";

export default function ServersPage() {
  return (
    <AppShell active="Servers">
      <ServerList />
    </AppShell>
  );
}
