import { pgTable, text, timestamp, boolean, integer, jsonb, uuid } from "drizzle-orm/pg-core";

export const cases = pgTable("cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  orgId: text("org_id"),
  status: text("status").notNull().default("intake"),
  visaType: text("visa_type"),
  destinationCountry: text("destination_country"),
  referenceNumber: text("reference_number"),
  approvalLikelihood: integer("approval_likelihood").default(35),
  caseData: jsonb("case_data").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull().references(() => cases.id),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  storageKey: text("storage_key"),
  status: text("status").notNull().default("uploaded"),
  extractedData: jsonb("extracted_data").$type<Record<string, string>>(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(),
  orgId: text("org_id"),
  fullName: text("full_name"),
  nationality: text("nationality"),
  residenceCountry: text("residence_country"),
  residenceCity: text("residence_city"),
  employmentStatus: text("employment_status"),
  employer: text("employer"),
  jobTitle: text("job_title"),
  monthlyIncome: integer("monthly_income"),
  onboarded: boolean("onboarded").default(false),
  profileData: jsonb("profile_data").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const browserSessions = pgTable("browser_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull().references(() => cases.id),
  sessionId: text("session_id").notNull(),
  liveViewUrl: text("live_view_url"),
  status: text("status").notNull().default("created"),
  formData: jsonb("form_data").$type<Record<string, string>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});
