import type { IntentSpec, PromptPackContent } from "@/lib/contracts"

export interface VerificationResult {
  score: number
  issues: string[]
}

export function verifyPromptPack(
  pack: PromptPackContent,
  intentSpec: IntentSpec,
  allowedTools: string[],
): VerificationResult {
  let score = 100
  const issues: string[] = []

  if (pack.system.length < 120) {
    score -= 12
    issues.push("Le prompt système ne cadre pas assez la mission.")
  }
  if (pack.user.length < 100) {
    score -= 10
    issues.push("Le prompt utilisateur ne précise pas suffisamment le livrable.")
  }
  if (pack.acceptanceCriteria.length < 3) {
    score -= 12
    issues.push("Il faut au moins trois critères d’acceptation observables.")
  }
  if (pack.tests.length < 3) {
    score -= 12
    issues.push("La couverture de test est insuffisante.")
  }
  const unauthorizedTools = pack.allowedTools.filter((tool) => !allowedTools.includes(tool))
  if (unauthorizedTools.length) {
    score -= 25
    issues.push(`Outils non autorisés: ${unauthorizedTools.join(", ")}`)
  }
  if (!Object.keys(pack.outputSchema).length) {
    score -= 12
    issues.push("Le schéma de sortie est vide.")
  }
  if (intentSpec.missingInformation.length > 3) {
    score -= 8
    issues.push("Trop d’informations critiques restent inconnues.")
  }

  return { score: Math.max(0, Math.min(100, score)), issues }
}

