import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const caseStatusEnum = pgEnum("case_status", [
  "intake_started",
  "intake_completed",
  "route_assessed",
  "checklist_generated",
  "documents_requested",
  "documents_partially_received",
  "documents_received",
  "document_review_in_progress",
  "document_review_failed",
  "document_review_passed",
  "case_strengthening",
  "application_pack_prepared",
  "portal_draft_requested",
  "portal_draft_ready",
  "final_submission_requested",
  "submitted",
  "biometrics_requested",
  "additional_documents_requested",
  "processing",
  "decision_ready",
  "closed",
]);

export const candidateStatusEnum = pgEnum("candidate_status", [
  "getting_started",
  "building_plan",
  "waiting_for_documents",
  "reviewing_documents",
  "strengthening_case",
  "preparing_application",
  "waiting_for_approval",
  "submitted",
  "monitoring_decision",
  "action_needed",
  "completed",
]);

export const employmentStatusEnum = pgEnum("employment_status", [
  "employed",
  "self_employed",
  "student",
  "unemployed",
  "retired",
]);

export const travelPurposeEnum = pgEnum("travel_purpose", [
  "tourism",
  "business",
  "study",
  "work",
  "family_visit",
  "transit",
]);

export const documentTypeEnum = pgEnum("document_type", [
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

export const requirementStatusEnum = pgEnum("document_requirement_status", [
  "requested",
  "satisfied",
  "waived",
  "rejected",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "uploaded",
  "processing",
  "needs_review",
  "verified",
  "rejected",
]);

export const caseTaskStatusEnum = pgEnum("case_task_status", [
  "queued",
  "running",
  "blocked",
  "completed",
  "failed",
  "cancelled",
]);

export const candidateActionStatusEnum = pgEnum("candidate_action_status", [
  "open",
  "completed",
  "cancelled",
]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "not_started",
  "draft_requested",
  "draft_ready",
  "approved_for_submit",
  "submitted",
  "failed",
]);

export const visaCases = pgTable(
  "visa_cases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    clerkOrgId: text("clerk_org_id"),
    internalStatus: caseStatusEnum("internal_status").notNull().default("intake_started"),
    candidateStatus: candidateStatusEnum("candidate_status").notNull().default("getting_started"),
    destinationCountry: text("destination_country").notNull(),
    travelPurpose: travelPurposeEnum("travel_purpose").notNull(),
    referenceNumber: text("reference_number"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    closedAt: timestamp("closed_at"),
  },
  (table) => [
    index("visa_cases_user_updated_idx").on(table.clerkUserId, table.updatedAt),
    index("visa_cases_org_updated_idx").on(table.clerkOrgId, table.updatedAt),
    index("visa_cases_status_idx").on(table.internalStatus),
  ],
);

export const visaCaseIntake = pgTable(
  "visa_case_intake",
  {
    visaCaseId: uuid("visa_case_id")
      .primaryKey()
      .references(() => visaCases.id, { onDelete: "cascade" }),
    applicantFullName: text("applicant_full_name").notNull(),
    applicantNationality: text("applicant_nationality").notNull(),
    applicantResidenceCountry: text("applicant_residence_country").notNull(),
    applicantResidenceCity: text("applicant_residence_city").notNull(),
    applicantEmploymentStatus: employmentStatusEnum("applicant_employment_status").notNull(),
    applicantEmployer: text("applicant_employer"),
    applicantJobTitle: text("applicant_job_title"),
    applicantMonthlyIncome: integer("applicant_monthly_income"),
    destinationCity: text("destination_city"),
    arrivalDate: date("arrival_date").notNull(),
    departureDate: date("departure_date").notNull(),
    familyInHomeCountry: boolean("family_in_home_country").notNull().default(false),
    propertyOwned: boolean("property_owned").notNull().default(false),
    previousRefusals: boolean("previous_refusals").notNull().default(false),
    rawIntake: jsonb("raw_intake").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("visa_case_intake_arrival_idx").on(table.arrivalDate)],
);

export const visaCaseAssessments = pgTable(
  "visa_case_assessments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    visaCaseId: uuid("visa_case_id").notNull().references(() => visaCases.id, { onDelete: "cascade" }),
    visaType: text("visa_type"),
    routeSummary: text("route_summary"),
    approvalLikelihood: integer("approval_likelihood"),
    riskLevel: text("risk_level"),
    riskFlags: jsonb("risk_flags").$type<readonly string[]>().notNull().default([]),
    strengths: jsonb("strengths").$type<readonly string[]>().notNull().default([]),
    weaknesses: jsonb("weaknesses").$type<readonly string[]>().notNull().default([]),
    recommendations: jsonb("recommendations").$type<readonly Record<string, unknown>[]>().notNull().default([]),
    missingFields: jsonb("missing_fields").$type<readonly string[]>().notNull().default([]),
    modelVersion: text("model_version"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("visa_case_assessments_case_idx").on(table.visaCaseId, table.createdAt)],
);

export const caseTasks = pgTable(
  "case_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    visaCaseId: uuid("visa_case_id").notNull().references(() => visaCases.id, { onDelete: "cascade" }),
    taskType: text("task_type").notNull(),
    status: caseTaskStatusEnum("status").notNull().default("queued"),
    title: text("title").notNull(),
    detail: text("detail"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [index("case_tasks_case_status_idx").on(table.visaCaseId, table.status)],
);

export const candidateActions = pgTable(
  "candidate_actions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    visaCaseId: uuid("visa_case_id").notNull().references(() => visaCases.id, { onDelete: "cascade" }),
    actionType: text("action_type").notNull(),
    status: candidateActionStatusEnum("status").notNull().default("open"),
    title: text("title").notNull(),
    description: text("description"),
    ctaLabel: text("cta_label"),
    dueAt: timestamp("due_at"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [index("candidate_actions_case_status_idx").on(table.visaCaseId, table.status)],
);

export const documentRequirements = pgTable(
  "document_requirements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    visaCaseId: uuid("visa_case_id").notNull().references(() => visaCases.id, { onDelete: "cascade" }),
    documentType: documentTypeEnum("document_type").notNull(),
    label: text("label").notNull(),
    reason: text("reason").notNull(),
    guidance: text("guidance"),
    required: boolean("required").notNull().default(true),
    criticality: text("criticality").notNull().default("required"),
    status: requirementStatusEnum("status").notNull().default("requested"),
    subject: text("subject"),
    periodStart: date("period_start"),
    periodEnd: date("period_end"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("document_requirements_case_status_idx").on(table.visaCaseId, table.status)],
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    visaCaseId: uuid("visa_case_id").notNull().references(() => visaCases.id, { onDelete: "cascade" }),
    requirementId: uuid("requirement_id").references(() => documentRequirements.id, { onDelete: "set null" }),
    uploadedByClerkUserId: text("uploaded_by_clerk_user_id").notNull(),
    documentType: documentTypeEnum("document_type").notNull(),
    status: documentStatusEnum("status").notNull().default("uploaded"),
    originalFilename: text("original_filename").notNull(),
    storageKey: text("storage_key"),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    sha256: text("sha256"),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
    reviewedAt: timestamp("reviewed_at"),
    rejectionReason: text("rejection_reason"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  },
  (table) => [
    index("documents_case_status_idx").on(table.visaCaseId, table.status),
    index("documents_requirement_idx").on(table.requirementId),
  ],
);

export const documentReviews = pgTable(
  "document_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
    visaCaseId: uuid("visa_case_id").notNull().references(() => visaCases.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    findings: jsonb("findings").$type<readonly Record<string, unknown>[]>().notNull().default([]),
    extractedFacts: jsonb("extracted_facts").$type<Record<string, unknown>>().notNull().default({}),
    confidence: integer("confidence"),
    reviewedBy: text("reviewed_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("document_reviews_case_idx").on(table.visaCaseId, table.createdAt)],
);

export const applicationPacks = pgTable(
  "application_packs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    visaCaseId: uuid("visa_case_id").notNull().references(() => visaCases.id, { onDelete: "cascade" }),
    formData: jsonb("form_data").$type<Record<string, string>>().notNull().default({}),
    coverLetter: text("cover_letter"),
    itinerary: jsonb("itinerary").$type<Record<string, unknown>>().notNull().default({}),
    proofOfTiesSummary: text("proof_of_ties_summary"),
    financialSummary: text("financial_summary"),
    evidenceSummary: text("evidence_summary"),
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("application_packs_case_idx").on(table.visaCaseId, table.createdAt)],
);

export const caseSubmission = pgTable(
  "case_submission",
  {
    visaCaseId: uuid("visa_case_id")
      .primaryKey()
      .references(() => visaCases.id, { onDelete: "cascade" }),
    portalUrl: text("portal_url"),
    browserUseSessionId: text("browser_use_session_id"),
    liveViewUrl: text("live_view_url"),
    submissionStatus: submissionStatusEnum("submission_status").notNull().default("not_started"),
    submissionResult: jsonb("submission_result").$type<Record<string, unknown>>().notNull().default({}),
    referenceNumber: text("reference_number"),
    submittedAt: timestamp("submitted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("case_submission_browser_session_idx").on(table.browserUseSessionId)],
);

export const caseEvents = pgTable(
  "case_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    visaCaseId: uuid("visa_case_id").notNull().references(() => visaCases.id, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id"),
    eventType: text("event_type").notNull(),
    fromStatus: caseStatusEnum("from_status"),
    toStatus: caseStatusEnum("to_status"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    visibleToCandidate: boolean("visible_to_candidate").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("case_events_case_created_idx").on(table.visaCaseId, table.createdAt)],
);
