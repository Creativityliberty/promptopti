import { CompileIntentRequestSchema } from "@/lib/contracts"
import { requireUserId } from "@/lib/auth"
import { startCompilation } from "@/lib/compile-service"
import { AppError, toErrorResponse } from "@/lib/errors"

export async function POST(request: Request) {
  try {
    const ownerId = await requireUserId()
    const json = await request.json().catch(() => {
      throw new AppError("Corps JSON invalide.", 400, "INVALID_JSON")
    })
    const parsed = CompileIntentRequestSchema.safeParse(json)
    if (!parsed.success) {
      throw new AppError("La demande de compilation est invalide.", 422, "VALIDATION_ERROR", parsed.error.flatten())
    }
    const result = await startCompilation(ownerId, parsed.data)
    return Response.json(result, {
      status: 202,
      headers: { Location: `/api/missions/${result.missionId}` },
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}

