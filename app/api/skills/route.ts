import { requireUserId } from "@/lib/auth"
import { toErrorResponse } from "@/lib/errors"
import { getSkillManifests } from "@/lib/skills/registry"

export async function GET() {
  try {
    await requireUserId()
    return Response.json({ skills: getSkillManifests() })
  } catch (error) {
    return toErrorResponse(error)
  }
}

