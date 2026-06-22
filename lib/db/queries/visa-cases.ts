import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "../index";
import { appendEvent } from "./events";
import { createTask } from "./tasks";

type DbOwner = Pick<typeof schema.visaCases.$inferInsert, "clerkUserId" | "clerkOrgId">;
type OwnedVisaCase = DbOwner & { readonly visaCaseId: typeof schema.visaCases.$inferSelect.id };
type VisaCaseIntakeInput = Pick<
  typeof schema.visaCaseIntake.$inferInsert,
  | "applicantFullName"
  | "applicantNationality"
  | "applicantResidenceCountry"
  | "applicantResidenceCity"
  | "applicantEmploymentStatus"
  | "applicantEmployer"
  | "applicantJobTitle"
  | "applicantMonthlyIncome"
  | "destinationCity"
  | "arrivalDate"
  | "departureDate"
  | "familyInHomeCountry"
  | "propertyOwned"
  | "previousRefusals"
  | "rawIntake"
>;
type VisaCaseCreateInput = Pick<typeof schema.visaCases.$inferInsert, "destinationCountry" | "travelPurpose"> &
  VisaCaseIntakeInput;

export function ownershipWhere(owner: DbOwner, visaCaseId: typeof schema.visaCases.$inferSelect.id) {
  return and(
    eq(schema.visaCases.id, visaCaseId),
    eq(schema.visaCases.clerkUserId, owner.clerkUserId),
  );
}

export async function createVisaCaseFromOnboarding(owner: DbOwner, intake: VisaCaseCreateInput) {
  const db = getDb();
  const now = new Date();

  const [visaCase] = await db
    .insert(schema.visaCases)
    .values({
      clerkUserId: owner.clerkUserId,
      clerkOrgId: owner.clerkOrgId ?? null,
      internalStatus: "intake_completed",
      candidateStatus: "building_plan",
      destinationCountry: intake.destinationCountry,
      travelPurpose: intake.travelPurpose,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await db.insert(schema.visaCaseIntake).values({
    visaCaseId: visaCase.id,
    applicantFullName: intake.applicantFullName,
    applicantNationality: intake.applicantNationality,
    applicantResidenceCountry: intake.applicantResidenceCountry,
    applicantResidenceCity: intake.applicantResidenceCity,
    applicantEmploymentStatus: intake.applicantEmploymentStatus,
    applicantEmployer: intake.applicantEmployer,
    applicantJobTitle: intake.applicantJobTitle,
    applicantMonthlyIncome: intake.applicantMonthlyIncome,
    destinationCity: intake.destinationCity,
    arrivalDate: intake.arrivalDate,
    departureDate: intake.departureDate,
    familyInHomeCountry: intake.familyInHomeCountry,
    propertyOwned: intake.propertyOwned,
    previousRefusals: intake.previousRefusals,
    rawIntake: intake.rawIntake,
    createdAt: now,
    updatedAt: now,
  });

  await appendEvent(owner, visaCase.id, {
    eventType: "case_created",
    toStatus: "intake_completed",
    visibleToCandidate: true,
    payload: {
      destinationCountry: intake.destinationCountry,
      travelPurpose: intake.travelPurpose,
      arrivalDate: intake.arrivalDate,
      departureDate: intake.departureDate,
    },
  });

  await createTask(owner, visaCase.id, {
    taskType: "assess_route",
    title: "Assess visa route",
    detail: "Determine visa route, document burden, and early risk profile.",
  });

  return getVisaCaseProjection({ ...owner, visaCaseId: visaCase.id });
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

export async function getVisaCaseProjection(
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

  return {
    visaCase,
    intake: intake ?? null,
    latestAssessment: latestAssessment ?? null,
    documentRequirements,
    documents,
    candidateActions,
    caseSubmission: caseSubmission ?? null,
    visibleEvents,
  };
}

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
