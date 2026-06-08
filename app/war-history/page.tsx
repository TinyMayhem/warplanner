import { AppShell } from "@/components/app-shell";
import { WarHistory } from "@/components/war-history/war-history";

export default function WarHistoryPage() {
  return (
    <AppShell active="War History">
      <WarHistory />
    </AppShell>
  );
}
