import { createMcpHandler, withMcpAuth } from "mcp-handler"
import { z } from "zod"

import { CompileIntentRequestSchema, MissionResponseSchema } from "@/lib/contracts"
import { getMcpUserId, requireMcpScope, verifyMcpToken } from "@/lib/auth"
import { startCompilation } from "@/lib/compile-service"
import { getMissionForOwner } from "@/lib/db/repository"
import { getSkillManifests } from "@/lib/skills/registry"

const CompileResultSchema = z.object({
  missionId: z.string().uuid(),
  workflowRunId: z.string(),
  status: z.literal("queued"),
})

const handler = createMcpHandler((server) => {
  server.registerTool(
    "list_skills",
    {
      title: "List Nümtema Skills",
      description: "Liste les manifestes versionnés des Skills Nümtema.",
      inputSchema: z.object({}),
      outputSchema: z.object({ skills: z.array(z.record(z.string(), z.unknown())) }),
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async () => {
      const output = { skills: getSkillManifests() }
      return { content: [{ type: "text", text: JSON.stringify(output) }], structuredContent: output }
    },
  )

  server.registerTool(
    "compile_intent",
    {
      title: "Compile Intent",
      description: "Crée une mission persistée puis lance sa compilation durable.",
      inputSchema: CompileIntentRequestSchema,
      outputSchema: CompileResultSchema,
      annotations: { readOnlyHint: false, idempotentHint: false },
    },
    async (input, context) => {
      requireMcpScope(context.http?.authInfo, "intent:compile")
      const output = await startCompilation(getMcpUserId(context.http?.authInfo), input)
      return { content: [{ type: "text", text: JSON.stringify(output) }], structuredContent: output }
    },
  )

  server.registerTool(
    "get_mission",
    {
      title: "Get Mission",
      description: "Retourne une mission appartenant à l’utilisateur authentifié.",
      inputSchema: z.object({ missionId: z.string().uuid() }),
      outputSchema: MissionResponseSchema,
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ missionId }, context) => {
      requireMcpScope(context.http?.authInfo, "intent:read")
      const output = await getMissionForOwner(missionId, getMcpUserId(context.http?.authInfo))
      return { content: [{ type: "text", text: JSON.stringify(output) }], structuredContent: output }
    },
  )
}, {
  serverInfo: { name: "numtema-intent-studio", version: "1.0.0" },
  capabilities: { tools: {} },
})

const authenticated = withMcpAuth(handler, verifyMcpToken, {
  required: true,
  requiredScopes: ["intent:read"],
  resourceMetadataPath: "/.well-known/oauth-protected-resource/api/mcp",
})

export { authenticated as GET, authenticated as POST }
