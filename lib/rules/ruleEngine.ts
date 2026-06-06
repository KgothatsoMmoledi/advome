import { divorceRuleMap } from "./divorceRuleMap";

type StateKey = keyof typeof divorceRuleMap.states;

export function getNextSteps(currentState: StateKey) {
  const state = divorceRuleMap.states[currentState];

  if (!state) {
    return {
      error: "Invalid state",
      currentStage: null,
      nextSteps: [],
      settlementAvailable: true,
    };
  }

  return {
    currentStage: state.label,
    nextSteps: state.next,
    settlementAvailable: true,
  };
}
