import { type NextRequest, NextResponse } from "next/server"
import type { ReasoningData } from "@/types/reasoning"

export async function POST(request: NextRequest) {
  try {
    const { prompt, apiKey } = await request.json()

    if (!apiKey || !prompt) {
      return NextResponse.json({ error: "Clé API et prompt requis" }, { status: 400 })
    }

    const systemPrompt = `Tu es un expert en raisonnement structuré. Analyse le prompt suivant et génère une structure de raisonnement complète selon le format JSON suivant.

Le prompt à analyser: "${prompt}"

Génère une réponse JSON qui suit exactement cette structure:

{
  "exp": ["domaine1", "domaine2"],
  "se": [{"domain": "domaine", "subdomains": ["sous1", "sous2"]}],
  "wm": {
    "g": "objectif principal",
    "sg": "sous-objectif",
    "pr": {
      "completed": ["étape1", "étape2"],
      "current": ["étape en cours"]
    },
    "ctx": "contexte pertinent"
  },
  "kg": {
    "tri": [{"sub": "sujet", "pred": "prédicat", "obj": "objet"}]
  },
  "logic": {
    "propos": [{"symb": "P1", "nl": "proposition en langage naturel"}],
    "proofs": [{"symb": "Proof1", "nl": "preuve en langage naturel"}],
    "crits": [{"symb": "C1", "nl": "critique en langage naturel"}],
    "doubts": [{"symb": "D1", "nl": "doute en langage naturel"}]
  },
  "chain": {
    "steps": [
      {
        "index": 1,
        "depends_on": [],
        "description": "description de l'étape",
        "prompt": "prompt pour cette étape"
      }
    ],
    "reflect": "réflexion métacognitive",
    "note": ["note1", "note2"],
    "warn": ["avertissement1"]
  }
}

Assure-toi que:
1. Tous les champs sont remplis de manière pertinente
2. Les étapes de raisonnement sont logiquement ordonnées
3. Les relations de connaissances sont cohérentes
4. Le JSON est valide et complet
5. Le contenu est en français

Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`

    const response = await fetch(
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
                  text: systemPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Erreur API Gemini: ${errorData.error?.message || "Erreur inconnue"}`)
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      throw new Error("Aucune réponse générée par Gemini")
    }

    // Extract JSON from the response
    let jsonMatch = generatedText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      // Fallback: try to find JSON between code blocks
      jsonMatch = generatedText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
      if (jsonMatch) {
        jsonMatch[0] = jsonMatch[1]
      }
    }

    if (!jsonMatch) {
      throw new Error("Format JSON non trouvé dans la réponse")
    }

    let reasoningData: ReasoningData
    try {
      reasoningData = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error("Erreur de parsing JSON:", parseError)
      console.error("Texte reçu:", generatedText)

      // Fallback: create a basic structure
      reasoningData = {
        exp: ["Analyse générale"],
        wm: {
          g: "Analyser et répondre au prompt utilisateur",
          sg: "Comprendre les exigences",
          pr: {
            completed: ["Réception du prompt"],
            current: ["Analyse en cours"],
          },
          ctx: prompt,
        },
        chain: {
          steps: [
            {
              index: 1,
              depends_on: [],
              description: "Analyser le prompt utilisateur",
              prompt: "Examinez attentivement la demande de l'utilisateur",
            },
            {
              index: 2,
              depends_on: [1],
              description: "Structurer la réponse",
              prompt: "Organisez les informations de manière logique",
            },
          ],
          reflect: "Processus de raisonnement basique généré automatiquement",
        },
      }
    }

    return NextResponse.json(reasoningData)
  } catch (error) {
    console.error("Erreur lors de la génération:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la génération du raisonnement" },
      { status: 500 },
    )
  }
}
