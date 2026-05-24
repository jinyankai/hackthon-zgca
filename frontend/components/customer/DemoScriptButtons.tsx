import { MessageSquareText } from "lucide-react";
import { demoScenarios, type DemoScenario } from "@/mocks/demoScript";

export function DemoScriptButtons({ onPick }: { onPick: (scenario: DemoScenario) => void }) {
  return (
    <div className="script-grid">
      {demoScenarios.map((scenario) => (
        <button className="ghost-button" key={scenario.id} onClick={() => onPick(scenario)} title={scenario.customerText}>
          <MessageSquareText size={16} />
          {scenario.title}
        </button>
      ))}
    </div>
  );
}
