import { generateText, Output } from "ai"

import {
  IntentSpecSchema,
  PromptPackContentSchema,
  type CompileIntentRequest,
  type IntentSpec,
  type PromptPackContent,
} from "@/lib/contracts"

export interface GenerationMetadata {
  model: string
  usage: Record<string, unknown>
  estimatedCostUsd: string | null
}

function fallbackModels() {
  return (process.env.NUMTEMA_FALLBACK_MODELS ?? "anthropic/claude-sonnet-4.6,google/gemini-3.1-pro-preview")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean)
}

function gatewayOptions(ownerId: string, feature: string) {
  return {
    gateway: {
      user: ownerId,
      tags: ["product:numtema-intent-studio", `feature:${feature}`],
      models: fallbackModels(),
      zeroDataRetention: true,
    },
  }
}

function plainRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {}
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
}

function gatewayCost(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return null
  const gateway = (metadata as Record<string, unknown>).gateway
  if (!gateway || typeof gateway !== "object") return null
  const cost = (gateway as Record<string, unknown>).cost
  if (typeof cost === "number") return cost.toFixed(8)
  if (typeof cost === "string") return cost
  return null
}

export async function generateIntentSpec(
  input: CompileIntentRequest,
  ownerId: string,
): Promise<{ value: IntentSpec; metadata: GenerationMetadata }> {
  const model = process.env.NUMTEMA_INTENT_MODEL ?? "openai/gpt-5.4-mini"
  const result = await generateText({
    model,
    output: Output.object({ schema: IntentSpecSchema }),
    system: [
      "Tu es Nümtema Intent Decoder.",
      "Transforme une demande brute en spécification fidèle, concise et exécutable.",
      "N’invente aucun contexte. Place les inconnues importantes dans missingInformation.",
      "Réponds dans la langue de la demande.",
    ].join(" "),
    prompt: JSON.stringify({
      intention: input.intention,
      destination: input.destination,
      mode: input.mode,
      output: input.output,
    }),
    providerOptions: gatewayOptions(ownerId, "intent-spec"),
  })

  return {
    value: IntentSpecSchema.parse(result.output),
    metadata: {
      model,
      usage: plainRecord(result.usage),
      estimatedCostUsd: gatewayCost(result.providerMetadata),
    },
  }
}

export async function generatePromptPack(
  input: CompileIntentRequest,
  intentSpec: IntentSpec,
  ownerId: string,
): Promise<{ value: PromptPackContent; metadata: GenerationMetadata }> {
  const model = process.env.NUMTEMA_PROMPT_MODEL ?? "openai/gpt-5.4"
  const result = await generateText({
    model,
    output: Output.object({ schema: PromptPackContentSchema }),
    system: [
      "Tu es Nümtema Mission Spec Compiler.",
      "Crée un Prompt Pack précis, directement exploitable et vérifiable.",
      "Le prompt système fixe rôle, limites, méthode, outils autorisés et règles anti-hallucination.",
      "Le prompt utilisateur conserve l’intention, expose les variables et le livrable.",
      "Les critères et tests doivent être observables. N’autorise que les outils fournis.",
    ].join(" "),
    prompt: JSON.stringify({
      intentSpec,
      destination: input.destination,
      mode: input.mode,
      output: input.output,
      allowedMcpTools: input.mcpToolNames,
    }),
    providerOptions: gatewayOptions(ownerId, "prompt-pack"),
  })

  return {
    value: PromptPackContentSchema.parse(result.output),
    metadata: {
      model,
      usage: plainRecord(result.usage),
      estimatedCostUsd: gatewayCost(result.providerMetadata),
    },
  }
}

export async function repairPromptPack(
  input: CompileIntentRequest,
  intentSpec: IntentSpec,
  current: PromptPackContent,
  issues: string[],
  ownerId: string,
): Promise<{ value: PromptPackContent; metadata: GenerationMetadata }> {
  const model = process.env.NUMTEMA_PROMPT_MODEL ?? "openai/gpt-5.4"
  const result = await generateText({
    model,
    output: Output.object({ schema: PromptPackContentSchema }),
    system: "Répare uniquement les écarts vérifiés. Préserve les éléments valides et n’ajoute aucun outil non autorisé.",
    prompt: JSON.stringify({ input, intentSpec, current, issues }),
    providerOptions: gatewayOptions(ownerId, "repair-loop"),
  })

  return {
    value: PromptPackContentSchema.parse(result.output),
    metadata: {
      model,
      usage: plainRecord(result.usage),
      estimatedCostUsd: gatewayCost(result.providerMetadata),
    },
  }
}

