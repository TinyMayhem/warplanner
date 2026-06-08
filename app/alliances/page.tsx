import { AllianceTable } from "@/components/alliances/alliance-table";
import { AllianceToolbar } from "@/components/alliances/alliance-toolbar";
import { AppShell } from "@/components/app-shell";

export default function AlliancesPage() {
  return (
    <AppShell active="Alliances">
      <AllianceToolbar />
      <AllianceTable />
    </AppShell>
  );
}
