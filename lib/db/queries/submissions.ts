import { getDb, schema } from "../index";
import { getVisaCase } from "./visa-cases";

type DbOwner = Pick<typeof schema.visaCases.$inferInsert, "clerkUserId" | "clerkOrgId">;
type OwnedVisaCase = DbOwner & { readonly visaCaseId: typeof schema.visaCases.$inferSelect.id };

export async function upsertSubmission(
  owner: OwnedVisaCase,
  data: Partial<typeof schema.caseSubmission.$inferInsert>,
) {
  const visaCase = await getVisaCase(owner);
  if (!visaCase) return null;

  const db = getDb();
  const [submission] = await db
    .insert(schema.caseSubmission)
    .values({
      visaCaseId: visaCase.id,
      ...data,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.caseSubmission.visaCaseId,
      set: { ...data, updatedAt: new Date() },
    })
    .returning();

  return submission;
}
