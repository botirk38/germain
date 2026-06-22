import { defineTool } from "eve/tools";
import { z } from "zod";
import { getVisaCaseView } from "@/lib/db/queries";
import { activeVisaCase } from "../lib/state";

const inputSchema = z.object({
  visa_case_id: z.string().uuid(),
});

const outputSchema = z.object({
  loaded: z.boolean(),
  visa_case_id: z.string().uuid(),
  case_view: z.unknown(),
});

export default defineTool({
  description: "Load the authenticated user's visa case from the database into the current agent session.",
  inputSchema,
  outputSchema,
  async execute({ visa_case_id }, ctx) {
    const userId = ctx.session.auth.current?.attributes.userId;
    const orgId = ctx.session.auth.current?.attributes.orgId;
    if (typeof userId !== "string") {
      throw new Error("No authenticated user found for this Eve session.");
    }

    const caseView = await getVisaCaseView({
      clerkUserId: userId,
      clerkOrgId: typeof orgId === "string" ? orgId : null,
      visaCaseId: visa_case_id,
    });

    if (!caseView) {
      throw new Error("Visa case not found for the authenticated user.");
    }

    activeVisaCase.update(() => ({ visaCaseId: visa_case_id, loadedAt: new Date().toISOString() }));

    return { loaded: true, visa_case_id, case_view: caseView };
  },
  toModelOutput(output) {
    return { type: "json", value: { loaded: output.loaded, visa_case_id: output.visa_case_id } };
  },
});
