"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReasoningEditor } from "@/components/reasoning-editor"
import { ReasoningVisualizer } from "@/components/reasoning-visualizer"
import { PromptOutput } from "@/components/prompt-output"
import { PromptTemplates } from "@/components/prompt-templates"
import { ReasoningAdvanced } from "@/components/reasoning-advanced"
import { WorkflowEditor } from "@/components/workflow-editor"
import {
  Brain,
  Sparkles,
  Code,
  Network,
  FileText,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Zap,
  Workflow,
} from "lucide-react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { generateReasoning } from "@/lib/gemini-api"
import type { ReasoningData } from "@/types/reasoning"

export function PromptBuilder() {
  const [apiKey] = useLocalStorage<string>("gemini-api-key", "")
  const [userPrompt, setUserPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [reasoningData, setReasoningData] = useState<ReasoningData | null>(null)
  const [activeTab, setActiveTab] = useState("input")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Sauvegarder le prompt actuel pour le moteur avancé
  useEffect(() => {
    if (userPrompt) {
      localStorage.setItem("current-prompt", userPrompt)
    }
  }, [userPrompt])

  // Debug: log the API key state
  useEffect(() => {
    console.log("🔑 API Key dans PromptBuilder:", apiKey ? "Présente" : "Absente")
  }, [apiKey])

  const handleGenerateReasoning = async () => {
    console.log("🚀 Début de la génération...")
    console.log("API Key présente:", !!apiKey)
    console.log("Prompt:", userPrompt.substring(0, 100) + "...")

    if (!apiKey || !apiKey.trim()) {
      setError("Veuillez d'abord configurer votre clé API Gemini")
      return
    }

    if (!userPrompt.trim()) {
      setError("Veuillez saisir un prompt à analyser")
      return
    }

    setIsGenerating(true)
    setError(null)
    setSuccess(null)

    try {
      console.log("📡 Appel de l'API...")
      const result = await generateReasoning(userPrompt, apiKey)
      console.log("✅ Résultat reçu:", result)

      setReasoningData(result)
      setActiveTab("reasoning")
      setSuccess("Raisonnement structuré généré avec succès !")

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error("❌ Erreur:", err)
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la génération"
      setError(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const loadTemplate = (template: any) => {
    setUserPrompt(template.prompt)
    if (template.reasoningData) {
      setReasoningData(template.reasoningData)
    }
    setError(null)
    setSuccess("Template chargé avec succès !")
    setTimeout(() => setSuccess(null), 3000)
  }

  // Check if generation is possible
  const canGenerate = apiKey && apiKey.trim() && userPrompt.trim() && !isGenerating

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-emerald-500" />
          Générateur de Prompts avec Raisonnement Structuré
        </CardTitle>
        <CardDescription>Créez des prompts puissants avec raisonnement structuré et visualisation</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Status Messages */}
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-8 mb-6">
            <TabsTrigger value="input" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Saisie</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="reasoning" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Raisonnement</span>
            </TabsTrigger>
            <TabsTrigger value="visualization" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">Visualisation</span>
            </TabsTrigger>
            <TabsTrigger value="workflow" className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              <span className="hidden sm:inline">Workflows</span>
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              <span className="hidden sm:inline">JSON</span>
            </TabsTrigger>
            <TabsTrigger value="output" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Résultat</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Avancé</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="prompt" className="text-sm font-medium">
                Votre Prompt
              </label>
              <Textarea
                id="prompt"
                placeholder="Décrivez ce que vous voulez accomplir avec ce prompt..."
                value={userPrompt}
                onChange={(e) => {
                  setUserPrompt(e.target.value)
                  setError(null) // Clear error when user types
                }}
                className="min-h-[200px]"
              />
              <div className="text-xs text-slate-500 flex justify-between">
                <span>{userPrompt.length} caractères</span>
                <span>{userPrompt.split(/\s+/).filter((word) => word.length > 0).length} mots</span>
              </div>
            </div>

            <Button
              onClick={handleGenerateReasoning}
              disabled={!canGenerate}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Génération du raisonnement...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Générer le Raisonnement Structuré
                </>
              )}
            </Button>

            {!apiKey && (
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  ⚠️ Veuillez d'abord configurer votre clé API Gemini ci-dessus
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates">
            <PromptTemplates onLoadTemplate={loadTemplate} />
          </TabsContent>

          <TabsContent value="reasoning">
            {reasoningData ? (
              <ReasoningEditor data={reasoningData} onChange={setReasoningData} />
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Aucun raisonnement généré</p>
                <p>Générez d'abord un raisonnement pour voir la décomposition structurée</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="visualization">
            {reasoningData ? (
              <ReasoningVisualizer data={reasoningData} />
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Aucune visualisation disponible</p>
                <p>Générez d'abord un raisonnement pour voir la visualisation</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="workflow">
            <WorkflowEditor />
          </TabsContent>

          <TabsContent value="code">
            {reasoningData ? (
              <div className="space-y-4">
                <div className="bg-slate-900 text-slate-100 p-4 rounded-md overflow-auto max-h-[500px]">
                  <pre className="text-sm">
                    <code>{JSON.stringify(reasoningData, null, 2)}</code>
                  </pre>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(reasoningData, null, 2))
                    setSuccess("JSON copié dans le presse-papiers !")
                    setTimeout(() => setSuccess(null), 3000)
                  }}
                >
                  Copier JSON
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Aucune structure JSON disponible</p>
                <p>Générez d'abord un raisonnement pour voir la structure JSON</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="output">
            {reasoningData ? (
              <PromptOutput data={reasoningData} originalPrompt={userPrompt} />
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Aucun prompt final disponible</p>
                <p>Générez d'abord un raisonnement pour voir le prompt final</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="advanced">
            <ReasoningAdvanced />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
