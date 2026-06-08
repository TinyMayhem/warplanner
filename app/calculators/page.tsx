import { AppShell } from "@/components/app-shell";
import { Calculators } from "@/components/calculators/calculators";

export default function CalculatorsPage() {
  return (
    <AppShell active="Calculators">
      <Calculators />
    </AppShell>
  );
}
