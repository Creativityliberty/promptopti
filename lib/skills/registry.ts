import { z } from "zod"

export const PermissionModeSchema = z.enum(["none", "read", "write", "execute", "network"])

const CommonSkillOutputSchema = z.object({
  summary: z.string(),
  evidence: z.array(z.string()).default([]),
})

export const SkillManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  inputSchema: z.record(z.string(), z.unknown()),
  outputSchema: z.record(z.string(), z.unknown()),
  permissions: z.array(
    z.object({
      capability: z.string(),
      mode: PermissionModeSchema,
      approval: z.enum(["never", "once", "project"]),
    }),
  ),
  compatibleModels: z.array(z.string()),
  tests: z.array(z.string()).min(1),
})

type RuntimeSkill = z.infer<typeof SkillManifestSchema> & {
  runtimeInputSchema: z.ZodType
  runtimeOutputSchema: z.ZodType
}

function manifest(
  data: Omit<RuntimeSkill, "inputSchema" | "outputSchema">,
): RuntimeSkill {
  return {
    ...data,
    inputSchema: z.toJSONSchema(data.runtimeInputSchema) as Record<string, unknown>,
    outputSchema: z.toJSONSchema(data.runtimeOutputSchema) as Record<string, unknown>,
  }
}

const basePermissions = [
  { capability: "project.context", mode: "read" as const, approval: "never" as const },
]

export const SKILL_REGISTRY: RuntimeSkill[] = [
  manifest({
    id: "intent-decoder",
    name: "Intent Decoder",
    version: "1.0.0",
    description: "Décode la demande brute, les implicites et le résultat réellement attendu.",
    runtimeInputSchema: z.object({ intention: z.string(), destination: z.string() }),
    runtimeOutputSchema: z.object({ objective: z.string(), ambiguities: z.array(z.string()) }),
    permissions: basePermissions,
    compatibleModels: ["gateway:text"],
    tests: ["L’objectif est explicite", "Les ambiguïtés ne dépassent pas trois éléments"],
  }),
  manifest({
    id: "intent-decomposer",
    name: "Intent Decomposer",
    version: "1.0.0",
    description: "Décompose l’objectif en livrables, contraintes et critères de réussite.",
    runtimeInputSchema: z.object({ objective: z.string() }),
    runtimeOutputSchema: z.object({ deliverables: z.array(z.string()), criteria: z.array(z.string()) }),
    permissions: basePermissions,
    compatibleModels: ["gateway:text"],
    tests: ["Chaque livrable possède un critère vérifiable"],
  }),
  manifest({
    id: "context-collector",
    name: "Context Collector",
    version: "1.0.0",
    description: "Rassemble uniquement le contexte qui modifie la qualité de la mission.",
    runtimeInputSchema: z.object({ intentSpec: z.record(z.string(), z.unknown()) }),
    runtimeOutputSchema: z.object({ context: z.array(z.string()), missing: z.array(z.string()) }),
    permissions: [
      ...basePermissions,
      { capability: "external.sources", mode: "network", approval: "once" },
    ],
    compatibleModels: ["gateway:text"],
    tests: ["Chaque source externe est attribuée"],
  }),
  manifest({
    id: "mission-spec-compiler",
    name: "Mission Spec Compiler",
    version: "1.0.0",
    description: "Compile l’intention structurée en contrat de mission exécutable.",
    runtimeInputSchema: z.object({ intentSpec: z.record(z.string(), z.unknown()) }),
    runtimeOutputSchema: z.object({ mission: z.record(z.string(), z.unknown()) }),
    permissions: basePermissions,
    compatibleModels: ["gateway:text"],
    tests: ["Le contrat contient entrée, sortie et critères d’acceptation"],
  }),
  manifest({
    id: "skill-router",
    name: "Skill Router",
    version: "1.0.0",
    description: "Sélectionne l’assemblage minimal de Skills nécessaire à la mission.",
    runtimeInputSchema: z.object({ mission: z.record(z.string(), z.unknown()) }),
    runtimeOutputSchema: z.object({ skillIds: z.array(z.string()), reasons: z.array(z.string()) }),
    permissions: basePermissions,
    compatibleModels: ["gateway:text"],
    tests: ["Aucun Skill sans justification"],
  }),
  manifest({
    id: "topology-planner",
    name: "Topology Planner",
    version: "1.0.0",
    description: "Ordonne Skills, outils et validations en workflow minimal.",
    runtimeInputSchema: z.object({ skillIds: z.array(z.string()), tools: z.array(z.string()) }),
    runtimeOutputSchema: z.object({ stages: z.array(z.string()) }),
    permissions: basePermissions,
    compatibleModels: ["gateway:text"],
    tests: ["Le workflow ne contient aucun cycle non borné"],
  }),
  manifest({
    id: "artifact-contract",
    name: "Artifact Contract",
    version: "1.0.0",
    description: "Définit le format, les variables et les garanties du Prompt Pack.",
    runtimeInputSchema: z.object({ mission: z.record(z.string(), z.unknown()) }),
    runtimeOutputSchema: z.object({ contract: z.record(z.string(), z.unknown()) }),
    permissions: basePermissions,
    compatibleModels: ["gateway:text"],
    tests: ["Le schéma de sortie est sérialisable et testable"],
  }),
  manifest({
    id: "verifier",
    name: "Verifier",
    version: "1.0.0",
    description: "Mesure clarté, complétude, sécurité et testabilité du Prompt Pack.",
    runtimeInputSchema: z.object({ promptPack: z.record(z.string(), z.unknown()) }),
    runtimeOutputSchema: z.object({ score: z.number(), issues: z.array(z.string()) }),
    permissions: basePermissions,
    compatibleModels: ["deterministic", "gateway:text"],
    tests: ["Le score est déterministe pour un même Prompt Pack"],
  }),
  manifest({
    id: "repair-loop",
    name: "Repair Loop",
    version: "1.0.0",
    description: "Répare une fois les écarts vérifiés, puis déclenche une validation ciblée.",
    runtimeInputSchema: z.object({ promptPack: z.record(z.string(), z.unknown()), issues: z.array(z.string()) }),
    runtimeOutputSchema: CommonSkillOutputSchema.extend({ promptPack: z.record(z.string(), z.unknown()) }),
    permissions: basePermissions,
    compatibleModels: ["gateway:text"],
    tests: ["Une réparation ne peut pas créer une boucle infinie"],
  }),
]

const byId = new Map(SKILL_REGISTRY.map((skill) => [skill.id, skill]))

export const DEFAULT_SKILL_IDS = [
  "intent-decoder",
  "intent-decomposer",
  "context-collector",
  "mission-spec-compiler",
  "skill-router",
  "topology-planner",
  "artifact-contract",
  "verifier",
  "repair-loop",
]

export function getSkillManifests() {
  return SKILL_REGISTRY.map(({ runtimeInputSchema: _input, runtimeOutputSchema: _output, ...skill }) => skill)
}

export function resolveSkillIds(ids?: string[]) {
  const selected = ids?.length ? ids : DEFAULT_SKILL_IDS
  const unknown = selected.filter((id) => !byId.has(id))
  if (unknown.length) throw new Error(`Skills inconnus: ${unknown.join(", ")}`)
  return [...new Set(selected)]
}

