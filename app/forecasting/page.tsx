import { AppShell } from "@/components/app-shell";
import { Forecasting } from "@/components/forecasting/forecasting";

export default function ForecastingPage() {
  return (
    <AppShell active="Forecasting">
      <Forecasting />
    </AppShell>
  );
}
