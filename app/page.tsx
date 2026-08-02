import { IntentStudio } from "@/components/intent-studio/intent-studio"
import { getSkillManifests } from "@/lib/skills/registry"

export default function Home() {
  const skills = getSkillManifests().map((skill) => ({
    id: skill.id,
    name: skill.id,
    version: skill.version,
    summary: skill.description,
    inputs: Object.keys((skill.inputSchema.properties as Record<string, unknown> | undefined) ?? {}),
    outputs: Object.keys((skill.outputSchema.properties as Record<string, unknown> | undefined) ?? {}),
    permissions: skill.permissions.map((permission) => ({
      label: permission.capability,
      state: permission.approval === "never" ? "allowed" as const : "ask" as const,
    })),
  }))

  return (
    <IntentStudio
      initialSkills={skills}
      authConfigured={Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)}
    />
  )
}
