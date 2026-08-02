import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server"

const clerkConfigured = Boolean(
  process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
)

const isProtectedRoute = createRouteMatcher([
  "/api/intents(.*)",
  "/api/missions(.*)",
  "/api/skills(.*)",
  "/api/mcp/tools(.*)",
])

const protectedProxy = clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) await auth.protect()
})

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!clerkConfigured) return NextResponse.next()
  return protectedProxy(request, event)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.well-known/workflow/).*)",
  ],
}
