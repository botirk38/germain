import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createVisaCaseFromOnboarding } from "@/lib/db/queries";

const onboardingSchema = z.object({
  applicantFullName: z.string().trim().min(1).max(160),
  applicantNationality: z.string().trim().min(1).max(80),
  applicantResidenceCountry: z.string().trim().min(1).max(80),
  applicantResidenceCity: z.string().trim().min(1).max(80),
  applicantEmploymentStatus: z.enum(["employed", "self_employed", "student", "unemployed", "retired"]),
  applicantEmployer: z.string().trim().min(1).max(160).optional(),
  applicantJobTitle: z.string().trim().min(1).max(120).optional(),
  applicantMonthlyIncome: z.number().min(0).max(1_000_000).optional(),
  destinationCountry: z.string().trim().min(1).max(80),
  destinationCity: z.string().trim().min(1).max(80).optional(),
  travelPurpose: z.enum(["tourism", "business", "study", "work", "family_visit", "transit"]),
  arrivalDate: z.string().date(),
  departureDate: z.string().date(),
  familyInHomeCountry: z.boolean(),
  propertyOwned: z.boolean(),
  previousRefusals: z.boolean(),
}).refine((data) => data.departureDate > data.arrivalDate, {
  message: "departureDate must be after arrivalDate",
  path: ["departureDate"],
});

export async function POST(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid onboarding data", issues: parsed.error.issues }, { status: 400 });
  }

  const projection = await createVisaCaseFromOnboarding(
    { clerkUserId: userId, clerkOrgId: orgId },
    { ...parsed.data, rawIntake: parsed.data },
  );

  if (!projection) {
    return Response.json({ error: "Could not create visa case" }, { status: 500 });
  }

  return Response.json({ visaCaseId: projection.visaCase.id });
}
