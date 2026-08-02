import { describe, expect, it } from "vitest"

import { DEFAULT_SKILL_IDS, getSkillManifests, resolveSkillIds } from "@/lib/skills/registry"

describe("Nümtema Skill registry", () => {
  it("contains nine unique versioned Skills", () => {
    const manifests = getSkillManifests()
    expect(manifests).toHaveLength(9)
    expect(new Set(manifests.map((skill) => skill.id)).size).toBe(9)
    expect(manifests.every((skill) => /^\d+\.\d+\.\d+$/.test(skill.version))).toBe(true)
  })

  it("uses the complete default assembly", () => {
    expect(resolveSkillIds()).toEqual(DEFAULT_SKILL_IDS)
  })

  it("refuses an unknown Skill", () => {
    expect(() => resolveSkillIds(["intent-decoder", "invented-skill"])).toThrow("invented-skill")
  })
})

