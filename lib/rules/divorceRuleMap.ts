export const divorceRuleMap = {
  startState: "summons",

  states: {
    summons: {
      label: "Divorce Summons",
      next: ["plea", "counterclaim", "default"],
    },

    plea: {
      label: "Plea Filed",
      next: ["reply", "settlement", "discovery"],
    },

    counterclaim: {
      label: "Counterclaim Filed",
      next: ["reply", "settlement"],
    },

    reply: {
      label: "Reply Filed",
      next: ["discovery", "settlement"],
    },

    settlement: {
      label: "Settlement (Available Anytime)",
      alwaysAvailable: true,
      fields: [
        "matrimonialPropertySystem",
        "assets",
        "divisionProposal",
        "pensions",
        "minorChildren",
        "maintenance",
        "familyAdvocateApproval",
      ],
      next: ["preTrial", "finalisation"],
    },

    discovery: {
      label: "Discovery Stage",
      next: ["preTrial"],
    },

    preTrial: {
      label: "Pre-Trial",
      next: ["setDown"],
    },

    setDown: {
      label: "Set Down",
      next: ["trialPrep"],
    },

    trialPrep: {
      label: "Trial Preparation",
      next: ["finalisation"],
    },

    finalisation: {
      label: "Finalisation",
      next: [],
    },

    default: {
      label: "No Response (Default)",
      next: ["finalisation"],
    },
  },
};
