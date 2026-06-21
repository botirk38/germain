import type { CaseState, OnboardingState } from "./case-types";

export function initialCaseState(): CaseState {
  return {
    id: `case-${Date.now()}`,
    visaType: "",
    destinationCountry: "",
    status: "intake",
    approvalLikelihood: 35,
    recommendations: [],
    applicant: {},
    travel: {},
    financials: {},
    documents: [],
    missingFields: [],
    riskFlags: [],
    formCompletion: 0,
    appointments: [],
    fees: {
      visaFee: 0,
      serviceFee: 0,
      vacFee: 0,
      total: 0,
      paid: false,
    },
    embassyFollowUps: [],
    timeline: [],
  };
}

export function initialOnboardingState(): OnboardingState {
  return {
    collectedFields: {},
    requestedDocuments: [],
    completed: false,
  };
}
