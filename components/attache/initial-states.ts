import type { CaseState } from "./case-types";

export function initialCaseState(): CaseState {
  return {
    id: `case-${Date.now()}`,
    visaType: "",
    destinationCountry: "",
    status: "intake_started",
    candidateStatus: "getting_started",
    approvalLikelihood: 35,
    recommendations: [],
    applicant: {},
    travel: {},
    financials: {},
    documentRequirements: [],
    documents: [],
    candidateActions: [],
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
