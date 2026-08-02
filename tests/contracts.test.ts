import { describe, expect, it } from "vitest"

import { CompileIntentRequestSchema, PromptPackContentSchema } from "@/lib/contracts"

describe("compile intent contract", () => {
  it("refuses an empty or trivial intention", () => {
    expect(CompileIntentRequestSchema.safeParse({ intention: "court" }).success).toBe(false)
  })

  it("applies explicit compilation defaults", () => {
    const value = CompileIntentRequestSchema.parse({ intention: "Créer un agent de prospection locale" })
    expect(value).toMatchObject({ destination: "Auto", mode: "Expert", output: "Prompt Pack", mcpToolNames: [] })
  })

  it("rejects variables that are not declared with braces", () => {
    const result = PromptPackContentSchema.safeParse({
      system: "S".repeat(30),
      user: "U".repeat(30),
      variables: [{ name: "zone", description: "Zone", defaultValue: "", required: true }],
      contextRequirements: [],
      allowedTools: [],
      outputSchema: { type: "object" },
      acceptanceCriteria: ["Le résultat est vérifiable"],
      tests: ["Vérifier le résultat"],
      examples: [],
    })
    expect(result.success).toBe(false)
  })
})
