import type { CompileIntentRequest, IntentSpec, PromptPackContent } from "@/lib/contracts"
import { generateIntentSpec, generatePromptPack, repairPromptPack, type GenerationMetadata } from "@/lib/ai/compiler"
import { failMission, persistPromptPack, setMissionStatus } from "@/lib/db/repository"
import { verifyPromptPack, type VerificationResult } from "@/lib/verification"

export interface CompileWorkflowInput {
  missionId: string
  ownerId: string
  request: CompileIntentRequest
  skillIds: string[]
}

export async function compileIntentWorkflow(input: CompileWorkflowInput) {
  "use workflow"

  try {
    const intent = await analyzeIntentStep(input)
    const compiled = await compilePackStep(input, intent.value)
    let verification = await verifyPackStep(input, intent.value, compiled.value)
    let content = compiled.value
    let generation = compiled.metadata
    let repaired = false

    if (verification.score < 82) {
      const repair = await repairPackStep(input, intent.value, content, verification.issues)
      content = repair.value
      generation = mergeGenerationMetadata(generation, repair.metadata)
      verification = await verifyPackStep(input, intent.value, content)
      repaired = true
    }

    return await completeMissionStep(input, intent.value, content, generation, verification, repaired)
  } catch (error) {
    await failMissionStep(input.missionId, error instanceof Error ? error.message : "Erreur de workflow inconnue")
    throw error
  }
}

async function analyzeIntentStep(input: CompileWorkflowInput) {
  "use step"
  await setMissionStatus(
    input.missionId,
    "analyzing",
    "intent-decoder",
    "Décodage et structuration de l’intention.",
  )
  return generateIntentSpec(input.request, input.ownerId)
}

async function compilePackStep(input: CompileWorkflowInput, intentSpec: IntentSpec) {
  "use step"
  await setMissionStatus(
    input.missionId,
    "compiling",
    "mission-spec-compiler",
    "Compilation du Prompt Pack structuré.",
  )
  return generatePromptPack(input.request, intentSpec, input.ownerId)
}

async function verifyPackStep(
  input: CompileWorkflowInput,
  intentSpec: IntentSpec,
  content: PromptPackContent,
) {
  "use step"
  await setMissionStatus(
    input.missionId,
    "verifying",
    "verifier",
    "Vérification déterministe des critères et permissions.",
  )
  return verifyPromptPack(content, intentSpec, input.request.mcpToolNames)
}

async function repairPackStep(
  input: CompileWorkflowInput,
  intentSpec: IntentSpec,
  content: PromptPackContent,
  issues: string[],
) {
  "use step"
  await setMissionStatus(
    input.missionId,
    "repairing",
    "repair-loop",
    "Réparation ciblée des écarts vérifiés.",
    { issues },
  )
  return repairPromptPack(input.request, intentSpec, content, issues, input.ownerId)
}

async function completeMissionStep(
  input: CompileWorkflowInput,
  intentSpec: IntentSpec,
  content: PromptPackContent,
  generation: GenerationMetadata,
  verification: VerificationResult,
  repaired: boolean,
) {
  "use step"
  const promptPack = await persistPromptPack({
    missionId: input.missionId,
    model: generation.model,
    score: verification.score,
    status: verification.score >= 82 ? (repaired ? "repaired" : "verified") : "needs_review",
    intentSpec,
    content,
    skillIds: input.skillIds,
    mcpToolNames: input.request.mcpToolNames,
    tokenUsage: generation.usage,
    estimatedCostUsd: generation.estimatedCostUsd,
  })
  await setMissionStatus(input.missionId, "completed", null, "Prompt Pack versionné et persisté.", {
    promptPackId: promptPack.id,
    version: promptPack.version,
    score: promptPack.score,
  })
  return { missionId: input.missionId, promptPackId: promptPack.id, score: promptPack.score }
}

async function failMissionStep(missionId: string, message: string) {
  "use step"
  await failMission(missionId, message)
}

function mergeGenerationMetadata(left: GenerationMetadata, right: GenerationMetadata): GenerationMetadata {
  return {
    model: right.model,
    usage: { initial: left.usage, repair: right.usage },
    estimatedCostUsd: sumCosts(left.estimatedCostUsd, right.estimatedCostUsd),
  }
}

function sumCosts(left: string | null, right: string | null) {
  if (left === null && right === null) return null
  return ((Number(left ?? 0) + Number(right ?? 0))).toFixed(8)
}

