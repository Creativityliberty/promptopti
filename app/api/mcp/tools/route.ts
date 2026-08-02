import { requireUserId } from "@/lib/auth"
import { toErrorResponse } from "@/lib/errors"
import { discoverConfiguredMcpTools } from "@/lib/mcp/client"

export async function GET() {
  try {
    await requireUserId()
    return Response.json({ tools: await discoverConfiguredMcpTools() }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    return toErrorResponse(error)
  }
}

