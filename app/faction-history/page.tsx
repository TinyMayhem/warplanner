import { AppShell } from "@/components/app-shell";
import { FactionHistory } from "@/components/faction-history/faction-history";

export default function FactionHistoryPage() {
  return (
    <AppShell active="Faction History">
      <FactionHistory />
    </AppShell>
  );
}
