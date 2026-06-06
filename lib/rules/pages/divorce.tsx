import { useState } from "react";
import { getNextSteps } from "../lib/rules/ruleEngine";

export default function DivorcePage() {
  const [currentState, setCurrentState] = useState("summons");

  const result = getNextSteps(currentState as any);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Divorce Navigator</h1>

      <h2>Current Stage:</h2>
      <p>{result.currentStage}</p>

      <h2>Next Steps:</h2>
      {result.nextSteps.map((step: string) => (
        <button
          key={step}
          onClick={() => setCurrentState(step)}
          style={{ margin: "5px", padding: "10px" }}
        >
          {step}
        </button>
      ))}

      <h3 style={{ marginTop: "20px" }}>
        Settlement Available: {result.settlementAvailable ? "Yes" : "No"}
      </h3>
    </div>
  );
}
