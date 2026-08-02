import { NextResponse } from "next/server"

export async function GET() {
  try {
    const workflowTypes = {
      simple_analysis: {
        name: "Analyse Simple",
        description: "Analyse basique du prompt avec extraction d'informations",
        steps: ["prompt_analysis"],
        estimated_duration: "5-10 secondes",
      },
      structured_reasoning: {
        name: "Raisonnement Structuré",
        description: "Raisonnement complet avec validation logique",
        steps: ["prompt_analysis", "llm_call", "validation", "synthesis"],
        estimated_duration: "30-60 secondes",
      },
      logical_validation: {
        name: "Validation Logique",
        description: "Focus sur la validation et la cohérence logique",
        steps: ["prompt_analysis", "validation", "synthesis"],
        estimated_duration: "15-30 secondes",
      },
    }

    return NextResponse.json(workflowTypes)
  } catch (error) {
    console.error("Erreur lors de la récupération des types de workflows:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des types de workflows" }, { status: 500 })
  }
}
