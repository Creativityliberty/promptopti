"use client"

import type React from "react"
import { useCallback, useState } from "react"
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
} from "reactflow"
import "reactflow/dist/style.css"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Play,
  Upload,
  Download,
  Plus,
  Trash2,
  Settings,
  Brain,
  Zap,
  CheckCircle,
  AlertTriangle,
  Network,
  Code,
  FileText,
} from "lucide-react"

// Types pour les nœuds personnalisés
interface CustomNodeData {
  label: string
  type: string
  config: Record<string, any>
  status?: "idle" | "running" | "completed" | "error"
}

// Composant pour les nœuds personnalisés
const CustomNode = ({ data, selected }: { data: CustomNodeData; selected: boolean }) => {
  const getNodeIcon = (type: string) => {
    switch (type) {
      case "prompt_analysis":
        return <FileText className="h-4 w-4" />
      case "llm_call":
        return <Brain className="h-4 w-4" />
      case "validation":
        return <CheckCircle className="h-4 w-4" />
      case "synthesis":
        return <Zap className="h-4 w-4" />
      case "condition":
        return <AlertTriangle className="h-4 w-4" />
      case "custom":
        return <Code className="h-4 w-4" />
      default:
        return <Network className="h-4 w-4" />
    }
  }

  const getNodeColor = (type: string) => {
    switch (type) {
      case "prompt_analysis":
        return "bg-blue-100 border-blue-300 text-blue-800"
      case "llm_call":
        return "bg-emerald-100 border-emerald-300 text-emerald-800"
      case "validation":
        return "bg-orange-100 border-orange-300 text-orange-800"
      case "synthesis":
        return "bg-purple-100 border-purple-300 text-purple-800"
      case "condition":
        return "bg-yellow-100 border-yellow-300 text-yellow-800"
      case "custom":
        return "bg-gray-100 border-gray-300 text-gray-800"
      default:
        return "bg-slate-100 border-slate-300 text-slate-800"
    }
  }

  const getStatusIndicator = (status?: string) => {
    switch (status) {
      case "running":
        return <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      case "completed":
        return <div className="w-2 h-2 bg-green-500 rounded-full" />
      case "error":
        return <div className="w-2 h-2 bg-red-500 rounded-full" />
      default:
        return <div className="w-2 h-2 bg-gray-300 rounded-full" />
    }
  }

  return (
    <div
      className={`
      px-4 py-2 shadow-md rounded-md border-2 min-w-[150px]
      ${getNodeColor(data.type)}
      ${selected ? "ring-2 ring-blue-500" : ""}
    `}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {getNodeIcon(data.type)}
          <span className="text-sm font-medium">{data.label}</span>
        </div>
        {getStatusIndicator(data.status)}
      </div>
      <div className="text-xs opacity-75">{data.type.replace("_", " ")}</div>
    </div>
  )
}

// Types de nœuds disponibles
const nodeTypes: NodeTypes = {
  custom: CustomNode,
}

// Nœuds prédéfinis
const predefinedNodes = [
  {
    type: "prompt_analysis",
    label: "Analyse de Prompt",
    description: "Analyse et décompose le prompt d'entrée",
    config: {
      extract_keywords: true,
      detect_intent: true,
      complexity_analysis: true,
    },
  },
  {
    type: "llm_call",
    label: "Appel LLM",
    description: "Génère une réponse avec Gemini",
    config: {
      model: "gemini-2.0-flash-exp",
      temperature: 0.7,
      max_tokens: 2048,
    },
  },
  {
    type: "validation",
    label: "Validation",
    description: "Valide la cohérence logique",
    config: {
      check_contradictions: true,
      validate_completeness: true,
      confidence_check: true,
    },
  },
  {
    type: "synthesis",
    label: "Synthèse",
    description: "Synthétise les résultats",
    config: {
      include_summary: true,
      generate_recommendations: true,
      quality_assessment: true,
    },
  },
  {
    type: "condition",
    label: "Condition",
    description: "Branchement conditionnel",
    config: {
      condition_type: "score_threshold",
      threshold: 0.7,
      true_path: "continue",
      false_path: "retry",
    },
  },
  {
    type: "custom",
    label: "Nœud Personnalisé",
    description: "Nœud avec logique personnalisée",
    config: {
      script: "",
      inputs: [],
      outputs: [],
    },
  },
]

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  nodes: Node[]
  edges: Edge[]
  category: string
}

const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "simple_analysis",
    name: "Analyse Simple",
    description: "Workflow basique pour analyser un prompt",
    category: "Basique",
    nodes: [
      {
        id: "1",
        type: "custom",
        position: { x: 100, y: 100 },
        data: { label: "Analyse", type: "prompt_analysis", config: {} },
      },
      {
        id: "2",
        type: "custom",
        position: { x: 300, y: 100 },
        data: { label: "Synthèse", type: "synthesis", config: {} },
      },
    ],
    edges: [{ id: "e1-2", source: "1", target: "2", type: "smoothstep" }],
  },
  {
    id: "full_reasoning",
    name: "Raisonnement Complet",
    description: "Workflow complet avec toutes les étapes",
    category: "Avancé",
    nodes: [
      {
        id: "1",
        type: "custom",
        position: { x: 100, y: 100 },
        data: { label: "Analyse", type: "prompt_analysis", config: {} },
      },
      {
        id: "2",
        type: "custom",
        position: { x: 300, y: 100 },
        data: { label: "LLM", type: "llm_call", config: {} },
      },
      {
        id: "3",
        type: "custom",
        position: { x: 500, y: 100 },
        data: { label: "Validation", type: "validation", config: {} },
      },
      {
        id: "4",
        type: "custom",
        position: { x: 700, y: 100 },
        data: { label: "Synthèse", type: "synthesis", config: {} },
      },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", type: "smoothstep" },
      { id: "e2-3", source: "2", target: "3", type: "smoothstep" },
      { id: "e3-4", source: "3", target: "4", type: "smoothstep" },
    ],
  },
  {
    id: "conditional_flow",
    name: "Flux Conditionnel",
    description: "Workflow avec branchements conditionnels",
    category: "Avancé",
    nodes: [
      {
        id: "1",
        type: "custom",
        position: { x: 100, y: 100 },
        data: { label: "Analyse", type: "prompt_analysis", config: {} },
      },
      {
        id: "2",
        type: "custom",
        position: { x: 300, y: 100 },
        data: { label: "Condition", type: "condition", config: {} },
      },
      {
        id: "3",
        type: "custom",
        position: { x: 500, y: 50 },
        data: { label: "LLM Simple", type: "llm_call", config: { temperature: 0.3 } },
      },
      {
        id: "4",
        type: "custom",
        position: { x: 500, y: 150 },
        data: { label: "LLM Créatif", type: "llm_call", config: { temperature: 0.9 } },
      },
      {
        id: "5",
        type: "custom",
        position: { x: 700, y: 100 },
        data: { label: "Synthèse", type: "synthesis", config: {} },
      },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", type: "smoothstep" },
      { id: "e2-3", source: "2", target: "3", type: "smoothstep", label: "Simple" },
      { id: "e2-4", source: "2", target: "4", type: "smoothstep", label: "Créatif" },
      { id: "e3-5", source: "3", target: "5", type: "smoothstep" },
      { id: "e4-5", source: "4", target: "5", type: "smoothstep" },
    ],
  },
]

export function WorkflowEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [workflowName, setWorkflowName] = useState("Mon Workflow")
  const [workflowDescription, setWorkflowDescription] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResults, setExecutionResults] = useState<any>(null)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: "smoothstep" }, eds)),
    [setEdges],
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const addNode = (nodeType: any) => {
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      type: "custom",
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: nodeType.label,
        type: nodeType.type,
        config: { ...nodeType.config },
      },
    }
    setNodes((nds) => [...nds, newNode])
  }

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId))
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }
  }

  const updateNodeConfig = (nodeId: string, config: any) => {
    setNodes((nds) => nds.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, config } } : node)))
  }

  const loadTemplate = (template: WorkflowTemplate) => {
    setNodes(template.nodes)
    setEdges(template.edges)
    setWorkflowName(template.name)
    setWorkflowDescription(template.description)
  }

  const saveWorkflow = () => {
    const workflow = {
      name: workflowName,
      description: workflowDescription,
      nodes,
      edges,
      created_at: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${workflowName.toLowerCase().replace(/\s+/g, "_")}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const loadWorkflow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const workflow = JSON.parse(e.target?.result as string)
          setWorkflowName(workflow.name || "Workflow Importé")
          setWorkflowDescription(workflow.description || "")
          setNodes(workflow.nodes || [])
          setEdges(workflow.edges || [])
        } catch (error) {
          console.error("Erreur lors du chargement du workflow:", error)
        }
      }
      reader.readAsText(file)
    }
  }

  const executeWorkflow = async () => {
    setIsExecuting(true)
    setExecutionResults(null)

    try {
      // Simuler l'exécution du workflow
      const workflowData = {
        name: workflowName,
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.data.type,
          config: node.data.config,
        })),
        edges: edges.map((edge) => ({
          from: edge.source,
          to: edge.target,
        })),
      }

      // Mettre à jour le statut des nœuds pendant l'exécution
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]

        // Marquer comme en cours
        setNodes((nds) => nds.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, status: "running" } } : n)))

        // Simuler le temps de traitement
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

        // Marquer comme terminé
        setNodes((nds) => nds.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, status: "completed" } } : n)))
      }

      setExecutionResults({
        status: "success",
        duration: "12.3s",
        nodes_executed: nodes.length,
        result: "Workflow exécuté avec succès",
      })
    } catch (error) {
      setExecutionResults({
        status: "error",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="font-medium"
              placeholder="Nom du workflow"
            />
            <Badge variant="outline">{nodes.length} nœuds</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={executeWorkflow}
              disabled={isExecuting || nodes.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isExecuting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exécution...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Exécuter
                </>
              )}
            </Button>

            <Button onClick={saveWorkflow} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>

            <label className="cursor-pointer">
              <Button variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Importer
                </span>
              </Button>
              <input type="file" accept=".json" onChange={loadWorkflow} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r bg-slate-50 overflow-y-auto">
          <Tabs defaultValue="nodes" className="h-full">
            <TabsList className="grid w-full grid-cols-3 m-2">
              <TabsTrigger value="nodes">Nœuds</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="config">Config</TabsTrigger>
            </TabsList>

            <TabsContent value="nodes" className="p-4 space-y-4">
              <h3 className="font-medium mb-3">Nœuds Disponibles</h3>
              {predefinedNodes.map((nodeType) => (
                <Card key={nodeType.type} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3" onClick={() => addNode(nodeType)}>
                    <div className="flex items-center gap-2 mb-1">
                      <Plus className="h-4 w-4 text-emerald-600" />
                      <span className="font-medium text-sm">{nodeType.label}</span>
                    </div>
                    <p className="text-xs text-slate-600">{nodeType.description}</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="templates" className="p-4 space-y-4">
              <h3 className="font-medium mb-3">Templates de Workflow</h3>
              {workflowTemplates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3" onClick={() => loadTemplate(template)}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{template.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{template.description}</p>
                    <div className="text-xs text-slate-500">
                      {template.nodes.length} nœuds • {template.edges.length} connexions
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="config" className="p-4 space-y-4">
              {selectedNode ? (
                <div>
                  <h3 className="font-medium mb-3">Configuration du Nœud</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Nom</label>
                      <Input
                        value={selectedNode.data.label}
                        onChange={(e) => {
                          const updatedNode = {
                            ...selectedNode,
                            data: { ...selectedNode.data, label: e.target.value },
                          }
                          setSelectedNode(updatedNode)
                          setNodes((nds) => nds.map((node) => (node.id === selectedNode.id ? updatedNode : node)))
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <Select
                        value={selectedNode.data.type}
                        onValueChange={(value) => {
                          const nodeType = predefinedNodes.find((n) => n.type === value)
                          if (nodeType) {
                            const updatedNode = {
                              ...selectedNode,
                              data: {
                                ...selectedNode.data,
                                type: value,
                                config: { ...nodeType.config },
                              },
                            }
                            setSelectedNode(updatedNode)
                            setNodes((nds) => nds.map((node) => (node.id === selectedNode.id ? updatedNode : node)))
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {predefinedNodes.map((nodeType) => (
                            <SelectItem key={nodeType.type} value={nodeType.type}>
                              {nodeType.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Configuration</label>
                      <Textarea
                        value={JSON.stringify(selectedNode.data.config, null, 2)}
                        onChange={(e) => {
                          try {
                            const config = JSON.parse(e.target.value)
                            updateNodeConfig(selectedNode.id, config)
                          } catch (error) {
                            // Ignore invalid JSON
                          }
                        }}
                        className="font-mono text-xs"
                        rows={8}
                      />
                    </div>

                    <Button
                      onClick={() => deleteNode(selectedNode.id)}
                      variant="destructive"
                      size="sm"
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer le Nœud
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Sélectionnez un nœud pour le configurer</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Editor */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-slate-50"
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>

          {/* Results Panel */}
          {executionResults && (
            <div className="absolute bottom-4 right-4 w-80">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {executionResults.status === "success" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    Résultat d'Exécution
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {executionResults.status === "success" ? (
                    <div className="space-y-2">
                      <div>✅ Exécution réussie</div>
                      <div>⏱️ Durée: {executionResults.duration}</div>
                      <div>🔗 Nœuds: {executionResults.nodes_executed}</div>
                    </div>
                  ) : (
                    <div className="text-red-600">❌ Erreur: {executionResults.error}</div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
