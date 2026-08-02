export async function GET() {
  return Response.json(
    {
      auth: Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) ||
        (process.env.NODE_ENV !== "production" && Boolean(process.env.NUMTEMA_DEV_USER_ID)),
      database: Boolean(process.env.DATABASE_URL),
      gateway: Boolean(process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY || process.env.VERCEL),
      mcp: Boolean(process.env.NUMTEMA_MCP_TOKEN || process.env.CLERK_SECRET_KEY),
    },
    { headers: { "Cache-Control": "no-store" } },
  )
}

