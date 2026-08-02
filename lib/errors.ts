export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = "AppError"
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status },
    )
  }

  console.error("Unhandled server error", error)
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "Une erreur interne est survenue." } },
    { status: 500 },
  )
}

