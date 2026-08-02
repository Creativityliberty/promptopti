// Créer un nouveau fichier pour gérer les requêtes proxy vers le backend Python
// Ce fichier va simuler les réponses du backend quand celui-ci n'est pas disponible

import { type NextRequest, NextResponse } from "next/server"

// Fonction utilitaire pour vérifier si le backend est disponible
async function isBackendAvailable() {
  try {
    const response = await fetch("http://localhost:8000/health", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      // Timeout court pour ne pas bloquer l'UI
      signal: AbortSignal.timeout(1000),
    })
    return response.ok
  } catch (error) {
    console.error("Backend non disponible:", error)
    return false
  }
}

// Gestionnaire pour /api/v2/reasoning/proxy/health
export async function GET(request: NextRequest) {
  // Extraire le chemin après /api/v2/reasoning/proxy/
  const path = request.nextUrl.pathname.replace("/api/v2/reasoning/proxy", "")

  try {
    // Si c'est une requête de santé, on peut simuler une réponse
    if (path === "/health") {
      const backendAvailable = await isBackendAvailable()

      if (backendAvailable) {
        // Transmettre la requête au backend
        const response = await fetch("http://localhost:8000/health")
        const data = await response.json()
        return NextResponse.json(data)
      } else {
        // Simuler une réponse de santé
        return NextResponse.json({
          service: "reasoning-engine-mock",
          version: "1.0.0-mock",
          status: "unavailable",
          message: "Backend Python non disponible - mode simulé",
        })
      }
    }

    // Si c'est une requête pour les types de workflows
    if (path === "/workflows/types") {
      const backendAvailable = await isBackendAvailable()

      if (backendAvailable) {
        // Transmettre la requête au backend
        const response = await fetch("http://localhost:8000/api/v2/reasoning/workflows/types")
        const data = await response.json()
        return NextResponse.json(data)
      } else {
        // Simuler une réponse avec des types de workflows par défaut
        return NextResponse.json({
          simple_analysis: {
            name: "Analyse Simple (Simulé)",
            description: "Analyse basique du prompt (Backend non disponible)",
            steps: ["prompt_analysis"],
            estimated_duration: "10-20 secondes",
          },
          structured_reasoning: {
            name: "Raisonnement Structuré (Simulé)",
            description: "Raisonnement complet (Backend non disponible)",
            steps: ["prompt_analysis", "llm_call", "validation", "synthesis"],
            estimated_duration: "60-120 secondes",
          },
          logical_validation: {
            name: "Validation Logique (Simulé)",
            description: "Focus sur la validation (Backend non disponible)",
            steps: ["prompt_analysis", "validation", "synthesis"],
            estimated_duration: "30-60 secondes",
          },
        })
      }
    }

    // Pour les autres requêtes, on essaie de les transmettre au backend
    const backendUrl = `http://localhost:8000${path}`
    const backendAvailable = await isBackendAvailable()

    if (!backendAvailable) {
      return NextResponse.json(
        { error: "Backend Python non disponible", details: "Veuillez démarrer le serveur backend" },
        { status: 503 },
      )
    }

    // Transmettre la requête au backend
    const backendResponse = await fetch(backendUrl, {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
      },
      body: request.method !== "GET" ? await request.text() : undefined,
    })

    const data = await backendResponse.json()
    return NextResponse.json(data, { status: backendResponse.status })
  } catch (error) {
    console.error(`Erreur lors de la requête ${path}:`, error)
    return NextResponse.json(
      {
        error: "Erreur de communication avec le backend",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Gérer les requêtes POST
export async function POST(request: NextRequest) {
  return GET(request)
}

// Gérer les requêtes DELETE
export async function DELETE(request: NextRequest) {
  return GET(request)
}
