import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "../index";
import { appendEvent } from "./events";
import { createTask } from "./tasks";

type DbOwner = Pick<typeof schema.visaCases.$inferInsert, "clerkUserId" | "clerkOrgId">;
type OwnedVisaCase = DbOwner & { readonly visaCaseId: typeof schema.visaCases.$inferSelect.id };
type VisaCaseCreateInput = Pick<
  typeof schema.visaCases.$inferInsert,
  "destinationCountry" | "visaType" | "travelPurpose"
>;

export function ownershipWhere(owner: DbOwner, visaCaseId: typeof schema.visaCases.$inferSelect.id) {
  return and(
    eq(schema.visaCases.id, visaCaseId),
    eq(schema.visaCases.clerkUserId, owner.clerkUserId),
  );
}

export async function createVisaCase(owner: DbOwner, input: VisaCaseCreateInput) {
  const db = getDb();
  const now = new Date();

  const [visaCase] = await db
    .insert(schema.visaCases)
    .values({
      clerkUserId: owner.clerkUserId,
      clerkOrgId: owner.clerkOrgId ?? null,
      internalStatus: "intake_started",
      candidateStatus: "building_plan",
      destinationCountry: input.destinationCountry,
      visaType: input.visaType,
      travelPurpose: input.travelPurpose,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await appendEvent(owner, visaCase.id, {
    eventType: "case_created",
    toStatus: "intake_started",
    visibleToCandidate: true,
    payload: {
      destinationCountry: input.destinationCountry,
      visaType: input.visaType,
      travelPurpose: input.travelPurpose,
    },
  });

  await createTask(owner, visaCase.id, {
    taskType: "assess_route",
    title: "Build visa plan",
    detail: "Determine document burden, timeline, and early risk profile.",
  });

  return getVisaCaseView({ ...owner, visaCaseId: visaCase.id });
}

export async function getVisaCase(owner: OwnedVisaCase) {
  const db = getDb();
  const [visaCase] = await db
    .select()
    .from(schema.visaCases)
    .where(ownershipWhere(owner, owner.visaCaseId))
    .limit(1);

  return visaCase ?? null;
}

export async function getVisaCaseView(
  owner: OwnedVisaCase,
) {
  const db = getDb();
  const visaCase = await getVisaCase(owner);
  if (!visaCase) return null;

  const [intake] = await db
    .select()
    .from(schema.visaCaseIntake)
    .where(eq(schema.visaCaseIntake.visaCaseId, visaCase.id))
    .limit(1);

  const [latestAssessment] = await db
    .select()
    .from(schema.visaCaseAssessments)
    .where(eq(schema.visaCaseAssessments.visaCaseId, visaCase.id))
    .orderBy(desc(schema.visaCaseAssessments.createdAt))
    .limit(1);

  const documentRequirements = await db
    .select()
    .from(schema.documentRequirements)
    .where(eq(schema.documentRequirements.visaCaseId, visaCase.id))
    .orderBy(schema.documentRequirements.createdAt);

  const documents = await db
    .select()
    .from(schema.documents)
    .where(eq(schema.documents.visaCaseId, visaCase.id))
    .orderBy(schema.documents.uploadedAt);

  const candidateActions = await db
    .select()
    .from(schema.candidateActions)
    .where(eq(schema.candidateActions.visaCaseId, visaCase.id))
    .orderBy(schema.candidateActions.createdAt);

  const [caseSubmission] = await db
    .select()
    .from(schema.caseSubmission)
    .where(eq(schema.caseSubmission.visaCaseId, visaCase.id))
    .limit(1);

  const visibleEvents = await db
    .select()
    .from(schema.caseEvents)
    .where(and(eq(schema.caseEvents.visaCaseId, visaCase.id), eq(schema.caseEvents.visibleToCandidate, true)))
    .orderBy(schema.caseEvents.createdAt);

  const coreDocuments = await db
    .select()
    .from(schema.userDocuments)
    .where(eq(schema.userDocuments.clerkUserId, owner.clerkUserId))
    .orderBy(schema.userDocuments.uploadedAt);

  return {
    visaCase,
    intake: intake ?? null,
    latestAssessment: latestAssessment ?? null,
    documentRequirements,
    documents,
    candidateActions,
    caseSubmission: caseSubmission ?? null,
    visibleEvents,
    coreDocuments,
  };
}

export type VisaCaseView = NonNullable<Awaited<ReturnType<typeof getVisaCaseView>>>;

export async function listVisaCases(owner: DbOwner) {
  const db = getDb();
  return db
    .select()
    .from(schema.visaCases)
    .where(eq(schema.visaCases.clerkUserId, owner.clerkUserId))
    .orderBy(desc(schema.visaCases.updatedAt));
}

export async function updateVisaCase(
  owner: OwnedVisaCase,
  data: Partial<typeof schema.visaCases.$inferInsert>,
) {
  const db = getDb();
  const [updated] = await db
    .update(schema.visaCases)
    .set({ ...data, updatedAt: new Date() })
    .where(ownershipWhere(owner, owner.visaCaseId))
    .returning();

  return updated ?? null;
}

export async function updateVisaCaseIntake(
  owner: OwnedVisaCase,
  data: Partial<typeof schema.visaCaseIntake.$inferInsert>,
) {
  const visaCase = await getVisaCase(owner);
  if (!visaCase) return null;

  const db = getDb();
  const [updated] = await db
    .update(schema.visaCaseIntake)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.visaCaseIntake.visaCaseId, visaCase.id))
    .returning();

  return updated ?? null;
}

export async function createAssessment(
  owner: OwnedVisaCase,
  data: Omit<typeof schema.visaCaseAssessments.$inferInsert, "id" | "visaCaseId" | "createdAt">,
) {
  const visaCase = await getVisaCase(owner);
  if (!visaCase) return null;

  const db = getDb();
  const [assessment] = await db
    .insert(schema.visaCaseAssessments)
    .values({ visaCaseId: visaCase.id, ...data })
    .returning();

  await updateVisaCase(owner, {
    internalStatus: "route_assessed",
    candidateStatus: "building_plan",
  });
  await appendEvent(owner, visaCase.id, {
    eventType: "case_assessed",
    fromStatus: visaCase.internalStatus,
    toStatus: "route_assessed",
    payload: { approvalLikelihood: assessment.approvalLikelihood, visaType: assessment.visaType },
  });

  return assessment;
}
