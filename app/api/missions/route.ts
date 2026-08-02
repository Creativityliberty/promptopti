import { requireUserId } from "@/lib/auth"
import { listMissionsForOwner } from "@/lib/db/repository"
import { toErrorResponse } from "@/lib/errors"

export async function GET(request: Request) {
  try {
    const ownerId = await requireUserId()
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 20)
    return Response.json({ missions: await listMissionsForOwner(ownerId, limit) })
  } catch (error) {
    return toErrorResponse(error)
  }
}

