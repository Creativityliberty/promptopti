import { type NextRequest, NextResponse } from "next/server"

// Stockage des workflows (même instance)
const activeWorkflows = new Map<string, any>()

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ workflowId: string }> }) {
  try {
    const { workflowId } = await params

    if (!workflowId) {
      return NextResponse.json({ error: "ID de workflow requis" }, { status: 400 })
    }

    const workflow = activeWorkflows.get(workflowId)

    if (!workflow) {
      return NextResponse.json({ error: "Workflow non trouvé" }, { status: 404 })
    }

    // Marquer le workflow comme annulé
    workflow.status = "cancelled"
    workflow.current_step = "cancelled"
    activeWorkflows.set(workflowId, workflow)

    return NextResponse.json({
      message: "Workflow annulé avec succès",
    })
  } catch (error) {
    console.error("Erreur lors de l'annulation:", error)
    return NextResponse.json({ error: "Erreur lors de l'annulation du workflow" }, { status: 500 })
  }
}
