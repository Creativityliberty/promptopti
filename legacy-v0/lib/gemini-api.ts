import type { ReasoningData } from "@/types/reasoning"

export async function generateReasoning(prompt: string, apiKey: string): Promise<ReasoningData> {
  console.log("🔄 generateReasoning appelé avec:", {
    promptLength: prompt.length,
    hasApiKey: !!apiKey,
  })

  const response = await fetch("/api/generate-reasoning", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, apiKey }),
  })

  console.log("📡 Réponse API:", response.status, response.statusText)

  if (!response.ok) {
    const errorText = await response.text()
    console.error("❌ Erreur API:", errorText)

    let error
    try {
      error = JSON.parse(errorText)
    } catch {
      error = { error: errorText }
    }

    throw new Error(error.error || `Erreur HTTP ${response.status}`)
  }

  const result = await response.json()
  console.log("✅ Résultat parsé:", result)

  return result
}
