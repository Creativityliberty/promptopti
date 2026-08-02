import { metadataCorsOptionsRequestHandler, protectedResourceHandler } from "mcp-handler"

export async function GET(request: Request) {
  const issuer = process.env.CLERK_ISSUER_URL
  if (!issuer) {
    return Response.json(
      { error: "CLERK_ISSUER_URL is not configured" },
      { status: 404 },
    )
  }
  return protectedResourceHandler({ authServerUrls: [issuer] })(request)
}

export const OPTIONS = metadataCorsOptionsRequestHandler()
