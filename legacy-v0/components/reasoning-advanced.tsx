"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Brain,
  Play,
  Square,
  RotateCcw,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Settings,
  Activity,
  FileText,
  Server,
  ServerOff,
  ExternalLink,
} from "lucide-react"

interface WorkflowType {
  name: string
  description: string
  steps: string[]
  estimated_duration: string
}

interface WorkflowStatus {
  workflow_id: string
  status: "running" | "completed" | "error" | "cancelled"
  progress: number
  current_step?: string
  result?: any
  error?: string
}

interface BackendStatus {
  connected: boolean
  url: string
  health?: any
  error?: string
}

export function ReasoningAdvanced() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("simple_analysis")
  const [workflowTypes, setWorkflowTypes] = useState<Record<string, WorkflowType>>({})
  const [currentExecution, setCurrentExecution] = useState<WorkflowStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    connected: false,
    url: "http://localhost:8000",
  })

  // Vérifier le statut du backend au démarrage
  useEffect(() => {
    checkBackendHealth()
    fetchWorkflowTypes()
  }, [])

  // Polling pour le statut du workflow
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (currentExecution && currentExecution.status === "running") {
      interval = setInterval(() => {
        fetchWorkflowStatus(currentExecution.workflow_id)
      }, 2000) // Polling toutes les 2 secondes
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [currentExecution])

  const checkBackendHealth = async () => {
    try {
      const response = await fetch("/api/v2/reasoning/proxy/health")

      if (response.ok) {
        // Vérifier si la réponse est du JSON valide
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const health = await response.json()
          setBackendStatus({
            connected: true,
            url: "http://localhost:8000",
            health,
          })
        } else {
          // La réponse n'est pas du JSON (probablement du HTML d'erreur)
          throw new Error("Réponse non-JSON reçue du serveur")
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (err) {
      console.error("Backend non disponible:", err)

      let errorMessage = "Erreur de connexion"
      if (err instanceof Error) {
        if (err.message.includes("JSON")) {
          errorMessage = "Backend Python non démarré ou URL incorrecte"
        } else if (err.message.includes("fetch")) {
          errorMessage = "Impossible de contacter le serveur"
        } else {
          errorMessage = err.message
        }
      }

      setBackendStatus({
        connected: false,
        url: "http://localhost:8000",
        error: errorMessage,
      })
    }
  }

  const fetchWorkflowTypes = async () => {
    try {
      console.log("Tentative de récupération des types de workflows...")
      const response = await fetch("/api/v2/reasoning/proxy/workflows/types")

      // Vérifier si la réponse est OK avant de tenter de parser le JSON
      if (!response.ok) {
        console.warn(`Réponse HTTP non-OK: ${response.status} ${response.statusText}`)
        throw new Error(`Erreur HTTP ${response.status}`)
      }

      // Vérifier le content-type de manière plus souple
      const contentType = response.headers.get("content-type") || ""
      if (!contentType.includes("application/json")) {
        console.warn(`Content-type non JSON reçu: ${contentType}`)
        // Tenter de lire le corps de la réponse pour le debugging
        const text = await response.text()
        console.warn(`Corps de la réponse: ${text.substring(0, 100)}...`)
        throw new Error("Réponse non-JSON reçue")
      }

      // Parser le JSON
      const types = await response.json()
      console.log("Types de workflows récupérés avec succès:", Object.keys(types))
      setWorkflowTypes(types)
    } catch (err) {
      console.error("Erreur lors du chargement des types de workflows:", err)

      // Message d'erreur plus informatif
      let errorMessage = "Erreur inconnue"
      if (err instanceof Error) {
        errorMessage = err.message
      }

      console.log("Utilisation des types de workflows par défaut")

      // Fallback avec des types par défaut
      setWorkflowTypes({
        simple_analysis: {
          name: "Analyse Simple",
          description: "Analyse basique du prompt avec Gemini",
          steps: ["prompt_analysis"],
          estimated_duration: "10-20 secondes",
        },
        structured_reasoning: {
          name: "Raisonnement Structuré",
          description: "Raisonnement complet avec validation logique",
          steps: ["prompt_analysis", "llm_call", "validation", "synthesis"],
          estimated_duration: "60-120 secondes",
        },
        logical_validation: {
          name: "Validation Logique",
          description: "Focus sur la validation et la cohérence logique",
          steps: ["prompt_analysis", "validation", "synthesis"],
          estimated_duration: "30-60 secondes",
        },
      })

      // Mettre à jour le statut du backend
      setBackendStatus((prev) => ({
        ...prev,
        connected: false,
        error: `Erreur de connexion: ${errorMessage}`,
      }))
    }
  }

  const fetchWorkflowStatus = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/v2/reasoning/proxy/status/${workflowId}`)
      if (response.ok) {
        const status = await response.json()
        setCurrentExecution(status)

        // Sauvegarder le résultat dans le localStorage pour les autres composants
        if (status.result && status.status === "completed") {
          localStorage.setItem(`workflow_result_${status.workflow_id}`, JSON.stringify(status.result))
          localStorage.setItem("latest_reasoning_result", JSON.stringify(status.result))
        }
      } else if (response.status === 404) {
        setError("Workflow non trouvé")
        setCurrentExecution(null)
      }
    } catch (err) {
      console.error("Erreur lors de la récupération du statut:", err)
    }
  }

  const executeWorkflow = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Récupérer le prompt et la clé API
      const prompt = localStorage.getItem("current-prompt")
      const apiKey = localStorage.getItem("gemini-api-key")

      if (!prompt?.trim()) {
        setError("Aucun prompt disponible. Veuillez d'abord saisir un prompt dans l'onglet 'Saisie'.")
        setIsLoading(false)
        return
      }

      if (!apiKey?.trim()) {
        setError("Clé API Gemini requise. Veuillez la configurer dans l'onglet 'Saisie'.")
        setIsLoading(false)
        return
      }

      const response = await fetch("/api/v2/reasoning/proxy/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          workflow_type: selectedWorkflow,
          parameters: {
            gemini_api_key: apiKey,
          },
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setCurrentExecution({
          workflow_id: result.workflow_id,
          status: "running",
          progress: 0,
          current_step: "initialization",
        })
        setBackendStatus((prev) => ({ ...prev, connected: true }))
      } else {
        const errorData = await response.json()
        setError(errorData.error || errorData.details || "Erreur lors de l'exécution du workflow")

        if (response.status === 503) {
          setBackendStatus((prev) => ({ ...prev, connected: false }))
        }
      }
    } catch (err) {
      setError("Erreur de connexion au serveur")
      setBackendStatus((prev) => ({ ...prev, connected: false }))
      console.error("Erreur:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const cancelWorkflow = async () => {
    if (!currentExecution) return

    try {
      const response = await fetch(`/api/v2/reasoning/proxy/cancel/${currentExecution.workflow_id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setCurrentExecution(null)
      }
    } catch (err) {
      console.error("Erreur lors de l'annulation:", err)
    }
  }

  const resetExecution = () => {
    setCurrentExecution(null)
    setError(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Activity className="h-4 w-4 animate-spin text-blue-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "cancelled":
        return <Square className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Moteur de Raisonnement Avancé
            </div>
            <div className="flex items-center gap-2">
              {backendStatus.connected ? (
                <Server className="h-4 w-4 text-green-500" />
              ) : (
                <ServerOff className="h-4 w-4 text-red-500" />
              )}
              <Badge variant={backendStatus.connected ? "default" : "destructive"}>
                {backendStatus.connected ? "Backend Python Connecté" : "Backend Déconnecté"}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Workflows sophistiqués avec Gemini pour un raisonnement structuré et une validation logique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="execute" className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="execute" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Exécution
              </TabsTrigger>
              <TabsTrigger value="monitor" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Monitoring
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Résultats
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuration
              </TabsTrigger>
            </TabsList>

            <TabsContent value="execute" className="space-y-4">
              {/* Statut de connexion backend */}
              {!backendStatus.connected && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                  <ServerOff className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 dark:text-red-300">
                    <div className="space-y-2">
                      <p>Backend Python non disponible</p>
                      <p className="text-sm">
                        Démarrez le serveur Python avec:{" "}
                        <code className="bg-red-100 px-1 rounded">cd backend && python main.py</code>
                      </p>
                      <Button variant="outline" size="sm" onClick={checkBackendHealth} className="mt-2">
                        Tester la connexion
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Sélection du workflow */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Type de Workflow</label>
                <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(workflowTypes).map(([key, workflow]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col">
                          <span className="font-medium">{workflow.name}</span>
                          <span className="text-xs text-slate-500">{workflow.estimated_duration}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description du workflow sélectionné */}
              {workflowTypes[selectedWorkflow] && (
                <Card className="bg-slate-50 dark:bg-slate-900">
                  <CardContent className="pt-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {workflowTypes[selectedWorkflow].description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {workflowTypes[selectedWorkflow].steps.map((step, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {step}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Messages d'erreur */}
              {error && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
                </Alert>
              )}

              {/* Contrôles d'exécution */}
              <div className="flex gap-2">
                <Button
                  onClick={executeWorkflow}
                  disabled={isLoading || currentExecution?.status === "running" || !backendStatus.connected}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Lancement...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Exécuter avec Gemini
                    </>
                  )}
                </Button>

                {currentExecution?.status === "running" && (
                  <Button variant="outline" onClick={cancelWorkflow}>
                    <Square className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                )}

                {currentExecution && currentExecution.status !== "running" && (
                  <Button variant="outline" onClick={resetExecution}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="monitor" className="space-y-4">
              {currentExecution ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(currentExecution.status)}
                        Workflow {currentExecution.workflow_id.substring(0, 8)}
                      </div>
                      <Badge variant={currentExecution.status === "completed" ? "default" : "secondary"}>
                        {currentExecution.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Barre de progression */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progression</span>
                        <span>{Math.round(currentExecution.progress * 100)}%</span>
                      </div>
                      <Progress value={currentExecution.progress * 100} className="w-full" />
                    </div>

                    {/* Étape actuelle */}
                    {currentExecution.current_step && (
                      <div className="text-sm">
                        <span className="font-medium">Étape actuelle: </span>
                        <span className="text-slate-600 dark:text-slate-400">{currentExecution.current_step}</span>
                      </div>
                    )}

                    {/* Résultat */}
                    {currentExecution.result && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Résultat</h4>
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md">
                          <pre className="text-xs overflow-auto max-h-40">
                            {JSON.stringify(currentExecution.result, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Erreur */}
                    {currentExecution.error && (
                      <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700 dark:text-red-300">
                          {currentExecution.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Aucun workflow en cours</p>
                  <p>Lancez un workflow pour voir le monitoring en temps réel</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {currentExecution?.result ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Résultats du Workflow Gemini</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="summary" className="w-full">
                      <TabsList className="grid grid-cols-4">
                        <TabsTrigger value="summary">Résumé</TabsTrigger>
                        <TabsTrigger value="analysis">Analyse</TabsTrigger>
                        <TabsTrigger value="validation">Validation</TabsTrigger>
                        <TabsTrigger value="raw">Données Brutes</TabsTrigger>
                      </TabsList>

                      <TabsContent value="summary" className="space-y-4">
                        {currentExecution.result.synthesis?.executive_summary && (
                          <div className="space-y-3">
                            <h4 className="font-medium">Résumé Exécutif</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Intention:</span>{" "}
                                {currentExecution.result.synthesis.executive_summary.original_intent}
                              </div>
                              <div>
                                <span className="font-medium">Complexité:</span>{" "}
                                {currentExecution.result.synthesis.executive_summary.complexity_level}
                              </div>
                              <div>
                                <span className="font-medium">Confiance:</span>{" "}
                                {currentExecution.result.synthesis.executive_summary.confidence_level}
                              </div>
                              <div>
                                <span className="font-medium">Score de validation:</span>{" "}
                                {(currentExecution.result.synthesis.executive_summary.validation_score * 100).toFixed(
                                  1,
                                )}
                                %
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Conclusion principale:</span>
                              <p className="mt-1 text-slate-600 dark:text-slate-400">
                                {currentExecution.result.synthesis.executive_summary.main_conclusion}
                              </p>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="analysis" className="space-y-4">
                        {currentExecution.result.analysis && (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Domaines Identifiés</h4>
                              <div className="flex flex-wrap gap-1">
                                {currentExecution.result.analysis.domains?.map((domain: string, index: number) => (
                                  <Badge key={index} variant="outline">
                                    {domain}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Mots-clés</h4>
                              <div className="flex flex-wrap gap-1">
                                {currentExecution.result.analysis.keywords?.map((keyword: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Sous-problèmes</h4>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                {currentExecution.result.analysis.subproblems?.map((problem: string, index: number) => (
                                  <li key={index}>{problem}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="validation" className="space-y-4">
                        {currentExecution.result.validation_result && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <Card className="p-4">
                                <h5 className="font-medium mb-2">Score Global</h5>
                                <div className="text-2xl font-bold text-emerald-600">
                                  {(currentExecution.result.validation_result.overall_score * 100).toFixed(1)}%
                                </div>
                              </Card>
                              <Card className="p-4">
                                <h5 className="font-medium mb-2">Contradictions</h5>
                                <div className="text-2xl font-bold text-red-600">
                                  {currentExecution.result.validation_result.contradiction_analysis
                                    ?.contradictions_found || 0}
                                </div>
                              </Card>
                            </div>

                            {currentExecution.result.validation_result.recommendations && (
                              <div>
                                <h5 className="font-medium mb-2">Recommandations</h5>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                  {currentExecution.result.validation_result.recommendations.map(
                                    (rec: string, index: number) => (
                                      <li key={index}>{rec}</li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="raw" className="space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md">
                          <pre className="text-xs overflow-auto max-h-96">
                            {JSON.stringify(currentExecution.result, null, 2)}
                          </pre>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Aucun résultat disponible</p>
                  <p>Exécutez un workflow pour voir les résultats détaillés</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration du Backend Python</CardTitle>
                  <CardDescription>Statut et configuration du moteur de raisonnement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Statut du Backend</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Connexion au serveur Python FastAPI
                        </p>
                      </div>
                      <Badge variant={backendStatus.connected ? "default" : "destructive"}>
                        {backendStatus.connected ? "Connecté" : "Déconnecté"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">URL du Backend</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{backendStatus.url}</p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={backendStatus.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ouvrir
                        </a>
                      </Button>
                    </div>

                    {backendStatus.health && (
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Informations du Service</h4>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="font-medium">Service:</span> {backendStatus.health.service}
                          </p>
                          <p>
                            <span className="font-medium">Version:</span> {backendStatus.health.version}
                          </p>
                          <p>
                            <span className="font-medium">Statut:</span> {backendStatus.health.status}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={checkBackendHealth} className="flex-1">
                        Tester la connexion
                      </Button>
                      <Button variant="outline" onClick={fetchWorkflowTypes} className="flex-1">
                        Recharger les workflows
                      </Button>
                    </div>

                    {backendStatus.error && (
                      <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700 dark:text-red-300">
                          {backendStatus.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
