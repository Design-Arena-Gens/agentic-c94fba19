import { AutomationBuilder } from "@/components/AutomationBuilder";
import { StatusPanel } from "@/components/StatusPanel";

export default function Home() {
  return (
    <div className="grid gap-8">
      <StatusPanel />
      <AutomationBuilder />
    </div>
  );
}
