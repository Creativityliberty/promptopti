import { requireUserId } from "@/lib/auth"
import { getMissionForOwner } from "@/lib/db/repository"
import { toErrorResponse } from "@/lib/errors"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  try {
    const ownerId = await requireUserId()
    const { missionId } = await params
    return Response.json(await getMissionForOwner(missionId, ownerId))
  } catch (error) {
    return toErrorResponse(error)
  }
}

