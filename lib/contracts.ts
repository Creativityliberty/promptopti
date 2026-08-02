import { z } from "zod"

export const DestinationSchema = z.enum([
  "Auto",
  "ChatGPT",
  "Claude",
  "Gemini",
  "Codex",
  "Cursor",
  "Midjourney",
])

export const CompileModeSchema = z.enum(["Rapide", "Équilibré", "Expert", "Agentique"])
export const OutputKindSchema = z.enum(["Prompt", "Prompt Pack", "Skill", "Agent", "Workflow"])

export const CompileIntentRequestSchema = z.object({
  intention: z.string().trim().min(10, "L’intention doit contenir au moins 10 caractères").max(20_000),
  destination: DestinationSchema.default("Auto"),
  mode: CompileModeSchema.default("Expert"),
  output: OutputKindSchema.default("Prompt Pack"),
  projectId: z.string().uuid().optional(),
  skillIds: z.array(z.string().min(1)).max(12).optional(),
  mcpToolNames: z.array(z.string().min(1)).max(20).default([]),
})

export const IntentSpecSchema = z.object({
  objective: z.string().min(1),
  audience: z.string().min(1),
  context: z.string(),
  constraints: z.array(z.string()).max(20),
  deliverable: z.string().min(1),
  successCriteria: z.array(z.string().min(1)).min(1).max(12),
  assumptions: z.array(z.string()).max(12),
  missingInformation: z.array(z.string()).max(6),
  language: z.string().min(2),
})

export const PromptVariableSchema = z.object({
  name: z.string().regex(/^\{\{[a-zA-Z0-9_]+\}\}$/),
  description: z.string().min(1),
  defaultValue: z.string().default(""),
  required: z.boolean(),
})

export const PromptPackContentSchema = z.object({
  system: z.string().min(20),
  user: z.string().min(20),
  variables: z.array(PromptVariableSchema).max(20),
  contextRequirements: z.array(z.string()).max(20),
  allowedTools: z.array(z.string()).max(20),
  outputSchema: z.record(z.string(), z.unknown()),
  acceptanceCriteria: z.array(z.string().min(1)).min(1).max(15),
  tests: z.array(z.string().min(1)).min(1).max(15),
  examples: z.array(
    z.object({
      input: z.string(),
      expectedCharacteristics: z.array(z.string()),
    }),
  ).max(3),
})

export const PromptPackSchema = PromptPackContentSchema.extend({
  id: z.string().uuid(),
  missionId: z.string().uuid(),
  version: z.number().int().positive(),
  model: z.string().min(1),
  score: z.number().int().min(0).max(100),
  status: z.enum(["verified", "repaired", "needs_review"]),
  intentSpec: IntentSpecSchema,
  provenance: z.object({
    skillIds: z.array(z.string()),
    mcpToolNames: z.array(z.string()),
    workflowRunId: z.string().nullable(),
    generatedAt: z.string().datetime(),
  }),
})

export const MissionStatusSchema = z.enum([
  "queued",
  "analyzing",
  "compiling",
  "verifying",
  "repairing",
  "completed",
  "failed",
  "cancelled",
])

export const MissionEventSchema = z.object({
  id: z.string().uuid(),
  status: MissionStatusSchema,
  skillId: z.string().nullable(),
  message: z.string(),
  createdAt: z.string().datetime(),
})

export const MissionResponseSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  status: MissionStatusSchema,
  currentSkillId: z.string().nullable(),
  workflowRunId: z.string().nullable(),
  destination: DestinationSchema,
  mode: CompileModeSchema,
  output: OutputKindSchema,
  errorMessage: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  events: z.array(MissionEventSchema),
  promptPack: PromptPackSchema.nullable(),
})

export type CompileIntentRequest = z.infer<typeof CompileIntentRequestSchema>
export type IntentSpec = z.infer<typeof IntentSpecSchema>
export type PromptPackContent = z.infer<typeof PromptPackContentSchema>
export type PromptPack = z.infer<typeof PromptPackSchema>
export type MissionStatus = z.infer<typeof MissionStatusSchema>
export type MissionResponse = z.infer<typeof MissionResponseSchema>

