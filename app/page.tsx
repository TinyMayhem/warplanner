import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard/dashboard";

export default function HomePage() {
  return (
    <AppShell active="Dashboard">
      <Dashboard />
    </AppShell>
  );
}
