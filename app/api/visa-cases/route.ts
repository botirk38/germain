import { auth } from "@clerk/nextjs/server";
import { findEnabledVisaOption, visaSelectionSchema } from "@/lib/db/visa-selection";
import { createVisaCase } from "@/lib/db/queries";

export async function POST(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = visaSelectionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid visa selection", issues: parsed.error.issues }, { status: 400 });
  }

  const option = findEnabledVisaOption(parsed.data);
  if (!option) {
    return Response.json({ error: "Visa route is not available yet" }, { status: 400 });
  }

  const view = await createVisaCase({ clerkUserId: userId, clerkOrgId: orgId }, {
    destinationCountry: option.countryName,
    visaType: option.visaType,
    travelPurpose: option.travelPurpose,
  });

  if (!view) {
    return Response.json({ error: "Could not create visa case" }, { status: 500 });
  }

  return Response.json({ visaCaseId: view.visaCase.id });
}
