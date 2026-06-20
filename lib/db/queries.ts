import { eq } from "drizzle-orm";
import { getDb, schema } from "./index";

export async function getProfile(userId: string) {
  const db = getDb();
  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .limit(1);
  return profile ?? null;
}

export async function upsertProfile(
  userId: string,
  data: Partial<typeof schema.profiles.$inferInsert>
) {
  const db = getDb();
  const existing = await getProfile(userId);
  if (existing) {
    await db
      .update(schema.profiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.profiles.userId, userId));
    return { ...existing, ...data };
  }
  const [inserted] = await db
    .insert(schema.profiles)
    .values({ userId, ...data })
    .returning();
  return inserted;
}

export async function createCase(
  userId: string,
  orgId: string | undefined,
  data: Partial<typeof schema.cases.$inferInsert>
) {
  const db = getDb();
  const [created] = await db
    .insert(schema.cases)
    .values({ userId, orgId, ...data })
    .returning();
  return created;
}

export async function updateCase(
  caseId: string,
  data: Partial<typeof schema.cases.$inferInsert>
) {
  const db = getDb();
  await db
    .update(schema.cases)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.cases.id, caseId));
}

export async function getCasesByUser(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(schema.cases)
    .where(eq(schema.cases.userId, userId))
    .orderBy(schema.cases.updatedAt);
}

export async function addDocument(
  caseId: string,
  userId: string,
  data: Omit<typeof schema.documents.$inferInsert, "caseId" | "userId">
) {
  const db = getDb();
  const [doc] = await db
    .insert(schema.documents)
    .values({ caseId, userId, ...data })
    .returning();
  return doc;
}

export async function getDocumentsByCase(caseId: string) {
  const db = getDb();
  return db
    .select()
    .from(schema.documents)
    .where(eq(schema.documents.caseId, caseId));
}

export async function createBrowserSession(
  caseId: string,
  sessionId: string,
  liveViewUrl: string
) {
  const db = getDb();
  const [session] = await db
    .insert(schema.browserSessions)
    .values({ caseId, sessionId, liveViewUrl })
    .returning();
  return session;
}

export async function updateBrowserSession(
  sessionId: string,
  data: Partial<typeof schema.browserSessions.$inferInsert>
) {
  const db = getDb();
  await db
    .update(schema.browserSessions)
    .set(data)
    .where(eq(schema.browserSessions.sessionId, sessionId));
}
