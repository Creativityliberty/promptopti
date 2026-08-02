import { start } from "workflow/api"

import { CompileIntentRequestSchema, type CompileIntentRequest } from "@/lib/contracts"
import { attachWorkflowRun, createMission, failMission } from "@/lib/db/repository"
import { AppError } from "@/lib/errors"
import { resolveSkillIds } from "@/lib/skills/registry"
import { compileIntentWorkflow } from "@/workflows/compile-intent"

export async function startCompilation(ownerId: string, rawRequest: CompileIntentRequest) {
  const parsed = CompileIntentRequestSchema.parse(rawRequest)
  const skillIds = resolveSkillIds(parsed.skillIds)
  const request = { ...parsed, skillIds }
  const mission = await createMission(ownerId, request)

  try {
    const run = await start(compileIntentWorkflow, [
      { missionId: mission.id, ownerId, request, skillIds },
    ])
    await attachWorkflowRun(mission.id, ownerId, run.runId)
    return { missionId: mission.id, workflowRunId: run.runId, status: "queued" as const }
  } catch (error) {
    await failMission(mission.id, error instanceof Error ? error.message : "Impossible de lancer le workflow")
    throw new AppError(
      "Le workflow durable n’a pas pu démarrer.",
      503,
      "WORKFLOW_START_FAILED",
    )
  }
}

