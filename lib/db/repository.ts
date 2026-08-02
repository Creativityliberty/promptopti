import { and, desc, eq } from "drizzle-orm"

import {
  CompileIntentRequestSchema,
  type CompileIntentRequest,
  type IntentSpec,
  type MissionResponse,
  type MissionStatus,
  type PromptPackContent,
  PromptPackSchema,
} from "@/lib/contracts"
import { AppError } from "@/lib/errors"
import { getDatabase } from "./client"
import { missionEvents, missions, projects, promptPackVersions } from "./schema"

export async function ensureOwnedProject(ownerId: string, projectId?: string) {
  const db = getDatabase()

  if (projectId) {
    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)),
    })
    if (!project) throw new AppError("Projet introuvable.", 404, "PROJECT_NOT_FOUND")
    return project
  }

  const existing = await db.query.projects.findFirst({
    where: eq(projects.ownerId, ownerId),
    orderBy: [desc(projects.updatedAt)],
  })
  if (existing) return existing

  const [created] = await db
    .insert(projects)
    .values({ ownerId, name: "Mon espace Nümtema" })
    .returning()
  return created
}

export async function createMission(ownerId: string, rawInput: CompileIntentRequest) {
  const input = CompileIntentRequestSchema.parse(rawInput)
  const project = await ensureOwnedProject(ownerId, input.projectId)
  const db = getDatabase()
  const [mission] = await db
    .insert(missions)
    .values({
      ownerId,
      projectId: project.id,
      intention: input.intention,
      destination: input.destination,
      mode: input.mode,
      output: input.output,
      status: "queued",
      currentSkillId: null,
      skillIds: input.skillIds ?? [],
      mcpToolNames: input.mcpToolNames,
    })
    .returning()

  await db.insert(missionEvents).values({
    missionId: mission.id,
    status: "queued",
    skillId: null,
    message: "Mission persistée avant exécution.",
  })

  return mission
}

export async function attachWorkflowRun(missionId: string, ownerId: string, workflowRunId: string) {
  const db = getDatabase()
  const [mission] = await db
    .update(missions)
    .set({ workflowRunId, updatedAt: new Date() })
    .where(and(eq(missions.id, missionId), eq(missions.ownerId, ownerId)))
    .returning({ id: missions.id })
  if (!mission) throw new AppError("Mission introuvable.", 404, "MISSION_NOT_FOUND")
}

export async function setMissionStatus(
  missionId: string,
  status: MissionStatus,
  skillId: string | null,
  message: string,
  metadata: Record<string, unknown> = {},
) {
  const db = getDatabase()
  await db
    .update(missions)
    .set({ status, currentSkillId: skillId, updatedAt: new Date() })
    .where(eq(missions.id, missionId))
  await db.insert(missionEvents).values({ missionId, status, skillId, message, metadata })
}

export async function failMission(missionId: string, message: string) {
  const safeMessage = message.slice(0, 1_000)
  const db = getDatabase()
  await db
    .update(missions)
    .set({ status: "failed", currentSkillId: null, errorMessage: safeMessage, updatedAt: new Date() })
    .where(eq(missions.id, missionId))
  await db.insert(missionEvents).values({
    missionId,
    status: "failed",
    skillId: null,
    message: "La compilation a échoué.",
  })
}

export interface PersistPromptPackInput {
  missionId: string
  model: string
  score: number
  status: "verified" | "repaired" | "needs_review"
  intentSpec: IntentSpec
  content: PromptPackContent
  skillIds: string[]
  mcpToolNames: string[]
  tokenUsage: Record<string, unknown>
  estimatedCostUsd: string | null
}

export async function persistPromptPack(input: PersistPromptPackInput) {
  const db = getDatabase()
  const mission = await db.query.missions.findFirst({ where: eq(missions.id, input.missionId) })
  if (!mission) throw new AppError("Mission introuvable.", 404, "MISSION_NOT_FOUND")

  const latest = await db.query.promptPackVersions.findFirst({
    where: eq(promptPackVersions.missionId, input.missionId),
    orderBy: [desc(promptPackVersions.version)],
  })
  const version = (latest?.version ?? 0) + 1
  const provenance = {
    skillIds: input.skillIds,
    mcpToolNames: input.mcpToolNames,
    workflowRunId: mission.workflowRunId,
    generatedAt: new Date().toISOString(),
  }

  const [created] = await db
    .insert(promptPackVersions)
    .values({
      missionId: input.missionId,
      version,
      model: input.model,
      score: input.score,
      status: input.status,
      intentSpec: input.intentSpec,
      content: input.content,
      provenance,
      tokenUsage: input.tokenUsage,
      estimatedCostUsd: input.estimatedCostUsd,
    })
    .returning()

  return PromptPackSchema.parse({
    id: created.id,
    missionId: created.missionId,
    version: created.version,
    model: created.model,
    score: created.score,
    status: created.status,
    intentSpec: created.intentSpec,
    provenance: created.provenance,
    ...created.content,
  })
}

export async function getMissionForOwner(missionId: string, ownerId: string): Promise<MissionResponse> {
  const db = getDatabase()
  const mission = await db.query.missions.findFirst({
    where: and(eq(missions.id, missionId), eq(missions.ownerId, ownerId)),
  })
  if (!mission) throw new AppError("Mission introuvable.", 404, "MISSION_NOT_FOUND")

  const [events, latest] = await Promise.all([
    db.query.missionEvents.findMany({
      where: eq(missionEvents.missionId, missionId),
      orderBy: [missionEvents.createdAt],
    }),
    db.query.promptPackVersions.findFirst({
      where: eq(promptPackVersions.missionId, missionId),
      orderBy: [desc(promptPackVersions.version)],
    }),
  ])

  const promptPack = latest
    ? PromptPackSchema.parse({
        id: latest.id,
        missionId: latest.missionId,
        version: latest.version,
        model: latest.model,
        score: latest.score,
        status: latest.status,
        intentSpec: latest.intentSpec,
        provenance: latest.provenance,
        ...latest.content,
      })
    : null

  return {
    id: mission.id,
    projectId: mission.projectId,
    status: mission.status as MissionStatus,
    currentSkillId: mission.currentSkillId,
    workflowRunId: mission.workflowRunId,
    destination: mission.destination as MissionResponse["destination"],
    mode: mission.mode as MissionResponse["mode"],
    output: mission.output as MissionResponse["output"],
    errorMessage: mission.errorMessage,
    createdAt: mission.createdAt.toISOString(),
    updatedAt: mission.updatedAt.toISOString(),
    events: events.map((event) => ({
      id: event.id,
      status: event.status as MissionStatus,
      skillId: event.skillId,
      message: event.message,
      createdAt: event.createdAt.toISOString(),
    })),
    promptPack,
  }
}

export async function listMissionsForOwner(ownerId: string, limit = 20) {
  const db = getDatabase()
  const rows = await db.query.missions.findMany({
    where: eq(missions.ownerId, ownerId),
    orderBy: [desc(missions.createdAt)],
    limit: Math.min(Math.max(limit, 1), 50),
  })
  return rows.map((mission) => ({
    id: mission.id,
    projectId: mission.projectId,
    intention: mission.intention,
    destination: mission.destination,
    status: mission.status,
    currentSkillId: mission.currentSkillId,
    createdAt: mission.createdAt.toISOString(),
    updatedAt: mission.updatedAt.toISOString(),
  }))
}

