import { describe, expect, it } from "vitest"

import type { IntentSpec, PromptPackContent } from "@/lib/contracts"
import { fingerprintTool } from "@/lib/mcp/client"
import { verifyPromptPack } from "@/lib/verification"

const intentSpec: IntentSpec = {
  objective: "Qualifier des prospects locaux",
  audience: "Équipe commerciale",
  context: "Données publiques",
  constraints: ["RGPD"],
  deliverable: "Liste justifiée",
  successCriteria: ["Chaque score a une preuve"],
  assumptions: [],
  missingInformation: [],
  language: "fr",
}

const promptPack: PromptPackContent = {
  system: "S".repeat(140),
  user: "U".repeat(120),
  variables: [],
  contextRequirements: [],
  allowedTools: ["maps.search"],
  outputSchema: { type: "object", properties: { score: { type: "number" } } },
  acceptanceCriteria: ["Critère 1", "Critère 2", "Critère 3"],
  tests: ["Test 1", "Test 2", "Test 3"],
  examples: [],
}

describe("verification and MCP drift", () => {
  it("accepts a complete pack with an approved tool", () => {
    expect(verifyPromptPack(promptPack, intentSpec, ["maps.search"])).toEqual({ score: 100, issues: [] })
  })

  it("penalizes a tool outside the approved allowlist", () => {
    const result = verifyPromptPack(promptPack, intentSpec, [])
    expect(result.score).toBeLessThan(82)
    expect(result.issues[0]).toContain("maps.search")
  })

  it("fingerprints the complete definition deterministically", () => {
    const a = fingerprintTool({ name: "maps.search", inputSchema: { type: "object", properties: { q: { type: "string" } } } })
    const b = fingerprintTool({ name: "maps.search", inputSchema: { properties: { q: { type: "string" } }, type: "object" } })
    const drifted = fingerprintTool({ name: "maps.search", inputSchema: { type: "object", properties: { q: { type: "number" } } } })
    expect(a).toBe(b)
    expect(a).not.toBe(drifted)
  })
})

