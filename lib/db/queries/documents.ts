import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../index";
import { appendEvent } from "./events";
import { createCandidateAction } from "./tasks";
import { getVisaCase, getVisaCaseView, updateVisaCase } from "./visa-cases";

type DbOwner = Pick<typeof schema.visaCases.$inferInsert, "clerkUserId" | "clerkOrgId">;
type OwnedVisaCase = DbOwner & { readonly visaCaseId: typeof schema.visaCases.$inferSelect.id };

export function isOwnedStorageKey(owner: DbOwner, storageKey: string): boolean {
  return storageKey.startsWith(`documents/${owner.clerkUserId}/`);
}

function requirementLabel(type: typeof schema.documentTypeEnum.enumValues[number]): string {
  return type
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export async function createDocumentRequirements(
  owner: OwnedVisaCase,
  requirements: readonly {
    readonly documentType: typeof schema.documentTypeEnum.enumValues[number];
    readonly reason: string;
    readonly guidance?: string;
    readonly required?: boolean;
  }[],
) {
  const visaCase = await getVisaCase(owner);
  if (!visaCase) return [];
  if (requirements.length === 0) return [];

  const db = getDb();
  const inserted = await db
    .insert(schema.documentRequirements)
    .values(
      requirements.map((requirement) => ({
        visaCaseId: visaCase.id,
        documentType: requirement.documentType,
        label: requirementLabel(requirement.documentType),
        reason: requirement.reason,
        guidance: requirement.guidance,
        required: requirement.required ?? true,
        criticality: requirement.required === false ? "recommended" : "required",
      })),
    )
    .returning();

  await updateVisaCase(owner, {
    internalStatus: "documents_requested",
    candidateStatus: "waiting_for_documents",
  });
  await appendEvent(owner, visaCase.id, {
    eventType: "documents_requested",
    fromStatus: visaCase.internalStatus,
    toStatus: "documents_requested",
    visibleToCandidate: true,
    payload: { documentTypes: inserted.map((requirement) => requirement.documentType) },
  });
  await createCandidateAction(owner, visaCase.id, {
    actionType: "upload_documents",
    title: "Upload requested documents",
    description: "Attaché needs these documents to continue reviewing your visa case.",
    ctaLabel: "Record documents",
    payload: { requirementIds: inserted.map((requirement) => requirement.id) },
  });

  return inserted;
}

export async function recordDocument(
  owner: OwnedVisaCase,
  document: {
    readonly documentType: typeof schema.documentTypeEnum.enumValues[number];
    readonly originalFilename: string;
    readonly storageKey?: string;
  },
) {
  const projection = await getVisaCaseView(owner);
  if (!projection) return null;
  if (document.storageKey && !isOwnedStorageKey(owner, document.storageKey)) {
    throw new Error("Document storage key does not belong to the authenticated user.");
  }

  const matchingRequirement = projection.documentRequirements.find(
    (requirement) => requirement.documentType === document.documentType && requirement.status === "requested",
  );

  const db = getDb();
  const [created] = await db
    .insert(schema.documents)
    .values({
      visaCaseId: projection.visaCase.id,
      requirementId: matchingRequirement?.id,
      uploadedByClerkUserId: owner.clerkUserId,
      documentType: document.documentType,
      originalFilename: document.originalFilename,
      storageKey: document.storageKey,
      metadata: { metadataOnly: !document.storageKey },
    })
    .returning();

  if (matchingRequirement) {
    await db
      .update(schema.documentRequirements)
      .set({ status: "satisfied", updatedAt: new Date() })
      .where(eq(schema.documentRequirements.id, matchingRequirement.id));
  }

  const remainingRequirements = projection.documentRequirements.filter(
    (requirement) => requirement.id !== matchingRequirement?.id && requirement.status === "requested",
  );
  await updateVisaCase(owner, {
    internalStatus: remainingRequirements.length === 0 ? "documents_received" : "documents_partially_received",
    candidateStatus: remainingRequirements.length === 0 ? "reviewing_documents" : "waiting_for_documents",
  });
  await appendEvent(owner, projection.visaCase.id, {
    eventType: "document_recorded",
    visibleToCandidate: true,
    payload: { documentType: created.documentType, originalFilename: created.originalFilename },
  });

  return created;
}

export async function recordUserDocument(
  owner: DbOwner,
  document: {
    readonly documentType: typeof schema.documentTypeEnum.enumValues[number];
    readonly originalFilename: string;
    readonly storageKey?: string;
  },
) {
  if (document.storageKey && !isOwnedStorageKey(owner, document.storageKey)) {
    throw new Error("Document storage key does not belong to the authenticated user.");
  }

  const db = getDb();
  const [created] = await db
    .insert(schema.userDocuments)
    .values({
      clerkUserId: owner.clerkUserId,
      clerkOrgId: owner.clerkOrgId ?? null,
      documentType: document.documentType,
      originalFilename: document.originalFilename,
      storageKey: document.storageKey,
      metadata: { metadataOnly: !document.storageKey },
    })
    .returning();

  return created;
}

export async function hasUserDocument(
  owner: DbOwner,
  documentType: typeof schema.documentTypeEnum.enumValues[number],
) {
  const db = getDb();
  const [document] = await db
    .select({ id: schema.userDocuments.id })
    .from(schema.userDocuments)
    .where(and(
      eq(schema.userDocuments.clerkUserId, owner.clerkUserId),
      eq(schema.userDocuments.documentType, documentType),
    ))
    .limit(1);

  return Boolean(document);
}
