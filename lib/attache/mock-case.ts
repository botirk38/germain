import type { AttacheCase } from "./case";

export const initialCase: AttacheCase = {
  id: "att_case_001",
  visaType: "Schengen Tourist Visa",
  destinationCountry: "France",
  status: "intake",
  approvalLikelihood: 35,
  recommendations: [],
  applicant: {},
  travel: {
    purpose: "tourism",
    destinationCity: "Paris",
  },
  financials: {},
  documents: [
    { id: "doc_1", name: "Passport", type: "passport", status: "missing" },
    { id: "doc_2", name: "Bank statement", type: "bank_statement", status: "missing" },
    { id: "doc_3", name: "Employment letter", type: "employment_letter", status: "missing" },
    { id: "doc_4", name: "Travel insurance", type: "insurance", status: "missing" },
    { id: "doc_5", name: "Hotel booking", type: "hotel_booking", status: "missing" },
  ],
  missingFields: ["Arrival date", "Departure date", "Hotel address"],
  riskFlags: [],
  formCompletion: 8,
  embassyFollowUps: [],
  appointments: [],
  fees: { visaFee: 0, serviceFee: 0, vacFee: 0, total: 0, paid: false },
  timeline: [
    {
      title: "Case created",
      description: "Attache started a Schengen Tourist Visa case for France.",
      time: "Now",
    },
  ],
};
