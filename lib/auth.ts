import { timingSafeEqual } from "node:crypto"

import type { AuthInfo } from "@modelcontextprotocol/server"
import { z } from "zod"

import { AppError } from "@/lib/errors"

const clerkConfigured = () => Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

export async function requireUserId() {
  if (clerkConfigured()) {
    const { auth } = await import("@clerk/nextjs/server")
    const { userId } = await auth()
    if (!userId) throw new AppError("Authentification requise.", 401, "UNAUTHORIZED")
    return userId
  }

  if (process.env.NODE_ENV !== "production" && process.env.NUMTEMA_DEV_USER_ID) {
    return process.env.NUMTEMA_DEV_USER_ID
  }

  throw new AppError(
    "Clerk n’est pas configuré pour cet environnement.",
    503,
    "AUTH_NOT_CONFIGURED",
  )
}

function tokensMatch(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function verifyMcpToken(_request: Request, bearerToken?: string): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined

  const staticToken = process.env.NUMTEMA_MCP_TOKEN
  const staticUserId = process.env.NUMTEMA_MCP_USER_ID
  if (staticToken && staticUserId && tokensMatch(bearerToken, staticToken)) {
    return {
      token: bearerToken,
      clientId: "numtema-operator-token",
      scopes: ["intent:read", "intent:compile", "skills:read"],
      extra: { userId: staticUserId },
    }
  }

  if (process.env.CLERK_SECRET_KEY) {
    const { verifyToken } = await import("@clerk/nextjs/server")
    const result = await verifyToken(bearerToken, {
      secretKey: process.env.CLERK_SECRET_KEY,
      jwtKey: process.env.CLERK_JWT_KEY,
    })
    const payload = z.object({
      sub: z.string().min(1),
      azp: z.string().optional(),
      exp: z.number().optional(),
    }).safeParse(result.data)
    if (!result.errors && payload.success) {
      return {
        token: bearerToken,
        clientId: payload.data.azp ?? "clerk-session",
        scopes: ["intent:read", "intent:compile", "skills:read"],
        expiresAt: payload.data.exp,
        extra: { userId: payload.data.sub },
      }
    }
  }

  return undefined
}

export function getMcpUserId(authInfo?: AuthInfo) {
  const userId = authInfo?.extra?.userId
  if (typeof userId !== "string" || !userId) {
    throw new AppError("Identité MCP invalide.", 401, "MCP_IDENTITY_INVALID")
  }
  return userId
}

export function requireMcpScope(authInfo: AuthInfo | undefined, scope: string) {
  if (!authInfo?.scopes.includes(scope)) {
    throw new AppError(`Portée MCP requise: ${scope}`, 403, "MCP_SCOPE_REQUIRED")
  }
}
