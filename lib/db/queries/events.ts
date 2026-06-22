import { getDb, schema } from "../index";

type DbOwner = Pick<typeof schema.visaCases.$inferInsert, "clerkUserId" | "clerkOrgId">;

export async function appendEvent(
  owner: DbOwner,
  visaCaseId: typeof schema.visaCases.$inferSelect.id,
  data: {
    readonly eventType: string;
    readonly fromStatus?: typeof schema.caseStatusEnum.enumValues[number];
    readonly toStatus?: typeof schema.caseStatusEnum.enumValues[number];
    readonly payload?: Record<string, unknown>;
    readonly visibleToCandidate?: boolean;
  },
) {
  const db = getDb();
  const [event] = await db
    .insert(schema.caseEvents)
    .values({
      visaCaseId,
      clerkUserId: owner.clerkUserId,
      eventType: data.eventType,
      fromStatus: data.fromStatus,
      toStatus: data.toStatus,
      payload: data.payload ?? {},
      visibleToCandidate: data.visibleToCandidate ?? false,
    })
    .returning();

  return event;
}
