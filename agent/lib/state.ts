import { defineState } from "eve/context";
import { z } from "zod";

export const documentTypeSchema = z.enum([
  "passport",
  "photo",
  "bank_statement",
  "employment_letter",
  "insurance",
  "hotel_booking",
  "flight_itinerary",
  "invitation_letter",
  "property_deed",
  "marriage_certificate",
  "birth_certificate",
]);

export type ActiveVisaCase = {
  readonly visaCaseId?: string;
  readonly loadedAt?: string;
};

export function initialActiveVisaCase(): ActiveVisaCase {
  return {};
}

export const activeVisaCase = defineState<ActiveVisaCase>("attache.case", initialActiveVisaCase);
