import { getDb, schema } from "../index";
import { appendEvent } from "./events";

type DbOwner = Pick<typeof schema.visaCases.$inferInsert, "clerkUserId" | "clerkOrgId">;

export async function createTask(
  owner: DbOwner,
  visaCaseId: typeof schema.visaCases.$inferSelect.id,
  data: Pick<typeof schema.caseTasks.$inferInsert, "taskType" | "title"> &
    Partial<typeof schema.caseTasks.$inferInsert>,
) {
  const db = getDb();
  const [task] = await db
    .insert(schema.caseTasks)
    .values({
      visaCaseId,
      taskType: data.taskType,
      title: data.title,
      detail: data.detail,
      payload: data.payload ?? {},
      status: data.status ?? "queued",
    })
    .returning();

  await appendEvent(owner, visaCaseId, {
    eventType: "case_task_created",
    payload: { taskType: task.taskType, title: task.title },
  });

  return task;
}

export async function createCandidateAction(
  owner: DbOwner,
  visaCaseId: typeof schema.visaCases.$inferSelect.id,
  data: Pick<typeof schema.candidateActions.$inferInsert, "actionType" | "title"> &
    Partial<typeof schema.candidateActions.$inferInsert>,
) {
  const db = getDb();
  const [action] = await db
    .insert(schema.candidateActions)
    .values({
      visaCaseId,
      actionType: data.actionType,
      title: data.title,
      description: data.description,
      ctaLabel: data.ctaLabel,
      dueAt: data.dueAt,
      payload: data.payload ?? {},
      status: data.status ?? "open",
    })
    .returning();

  await appendEvent(owner, visaCaseId, {
    eventType: "candidate_action_created",
    visibleToCandidate: true,
    payload: { actionType: action.actionType, title: action.title },
  });

  return action;
}
