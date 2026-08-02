import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey || !apiKey.startsWith("AIza")) {
      return NextResponse.json({ error: "Format de clé API invalide" }, { status: 400 })
    }

    // Test the API key with a simple request to Gemini
    const testResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Test de validation de clé API",
                },
              ],
            },
          ],
        }),
      },
    )

    if (!testResponse.ok) {
      const errorData = await testResponse.json()
      return NextResponse.json({ error: "Clé API invalide ou expirée" }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur de validation:", error)
    return NextResponse.json({ error: "Erreur lors de la validation de la clé API" }, { status: 500 })
  }
}
