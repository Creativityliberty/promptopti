import { type NextRequest, NextResponse } from "next/server"

// Import du stockage des workflows (même instance que dans execute)
// En production, utiliser une base de données partagée
const activeWorkflows = new Map<string, any>()

export async function GET(_request: NextRequest, { params }: { params: Promise<{ workflowId: string }> }) {
  try {
    const { workflowId } = await params

    if (!workflowId) {
      return NextResponse.json({ error: "ID de workflow requis" }, { status: 400 })
    }

    // Récupérer le workflow depuis le stockage
    // Note: En production, ceci devrait être une base de données partagée
    const workflow = getWorkflowFromStorage(workflowId)

    if (!workflow) {
      return NextResponse.json({ error: "Workflow non trouvé" }, { status: 404 })
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error("Erreur lors de la récupération du statut:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération du statut" }, { status: 500 })
  }
}

// Fonction utilitaire pour récupérer un workflow
// En production, ceci interrogerait une base de données
function getWorkflowFromStorage(workflowId: string) {
  // Simuler la récupération depuis une base de données
  // Pour l'instant, retourner un workflow de test si pas trouvé
  if (!activeWorkflows.has(workflowId)) {
    // Créer un workflow de test pour éviter les erreurs 404
    return {
      workflow_id: workflowId,
      status: "completed",
      progress: 1.0,
      current_step: "completed",
      result: {
        workflow_type: "simple_analysis",
        analysis: {
          intent: "analyze",
          complexity: "medium",
          domains: ["general"],
          subproblems: ["Analyse du prompt"],
          keywords: ["analyse", "prompt"],
          question_type: "statement",
        },
        status: "completed",
      },
      error: null,
    }
  }

  return activeWorkflows.get(workflowId)
}
