import { createHash } from "node:crypto"

import { createMCPClient } from "@ai-sdk/mcp"
import { z } from "zod"

const ConnectionSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().min(1),
  url: z.string().url(),
  tokenEnv: z.string().regex(/^[A-Z][A-Z0-9_]+$/).optional(),
  allowedTools: z.array(z.string()).default([]),
  approvedFingerprints: z.record(z.string(), z.string()).default({}),
})

export const DiscoveredMcpToolSchema = z.object({
  connectionId: z.string(),
  connectionName: z.string(),
  name: z.string(),
  description: z.string(),
  fingerprint: z.string(),
  status: z.enum(["approved", "approval_required", "drifted"]),
})

export type DiscoveredMcpTool = z.infer<typeof DiscoveredMcpToolSchema>

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}

export function fingerprintTool(tool: { name: string; description?: string; inputSchema?: unknown; outputSchema?: unknown }) {
  return createHash("sha256")
    .update(stableStringify({
      name: tool.name,
      description: tool.description ?? "",
      inputSchema: tool.inputSchema ?? {},
      outputSchema: tool.outputSchema ?? {},
    }))
    .digest("hex")
}

export function configuredMcpConnections() {
  const raw = process.env.NUMTEMA_MCP_CONNECTIONS_JSON ?? "[]"
  const parsed = z.array(ConnectionSchema).parse(JSON.parse(raw))
  return parsed.map((connection) => {
    const url = new URL(connection.url)
    const localAllowed = process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname)
    if (url.protocol !== "https:" && !localAllowed) {
      throw new Error(`La connexion MCP ${connection.id} doit utiliser HTTPS.`)
    }
    return connection
  })
}

export async function discoverConfiguredMcpTools(): Promise<DiscoveredMcpTool[]> {
  const connections = configuredMcpConnections()
  const groups = await Promise.all(connections.map(async (connection) => {
    const token = connection.tokenEnv ? process.env[connection.tokenEnv] : undefined
    const client = await createMCPClient({
      clientName: "numtema-intent-studio",
      version: "1.0.0",
      transport: {
        type: "http",
        url: connection.url,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        redirect: "error",
      },
      initializationOptions: { timeout: 8_000 },
      maxRetries: 1,
    })

    try {
      const result = await client.listTools({ options: { timeout: 8_000 } })
      return result.tools
        .filter((tool) => !connection.allowedTools.length || connection.allowedTools.includes(tool.name))
        .map((tool) => {
          const fingerprint = fingerprintTool(tool)
          const approved = connection.approvedFingerprints[tool.name]
          return {
            connectionId: connection.id,
            connectionName: connection.name,
            name: tool.name,
            description: tool.description ?? "",
            fingerprint,
            status: approved === fingerprint ? "approved" as const : approved ? "drifted" as const : "approval_required" as const,
          }
        })
    } finally {
      await client.close()
    }
  }))
  return groups.flat()
}

