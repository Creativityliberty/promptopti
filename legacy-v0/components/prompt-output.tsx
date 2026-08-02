"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Clipboard, Check, Download, Sparkles, FileText, Code } from "lucide-react"
import type { ReasoningData } from "@/types/reasoning"

interface PromptOutputProps {
  data: ReasoningData
  originalPrompt: string
}

export function PromptOutput({ data, originalPrompt }: PromptOutputProps) {
  const [copied, setCopied] = useState(false)
  const [activeFormat, setActiveFormat] = useState("structured")

  const generateStructuredPrompt = (): string => {
    // Vérification de sécurité pour data
    if (!data) {
      return `# Prompt de Raisonnement Structuré\n\n## Prompt Original\n${originalPrompt}\n\nAucune donnée de raisonnement disponible.`
    }

    let prompt = `# Prompt de Raisonnement Structuré\n\n`

    prompt += `## Prompt Original\n${originalPrompt}\n\n`

    // Add expertise context - avec vérification
    if (data.exp && data.exp.length > 0) {
      prompt += `## Contexte d'Expertise\n`
      prompt += `Vous êtes un expert dans les domaines suivants :\n`
      data.exp.forEach((exp) => {
        prompt += `- ${exp}\n`
      })
      prompt += "\n"
    }

    // Add subdomain expertise - avec vérification
    if (data.se && data.se.length > 0) {
      prompt += `## Expertise Spécialisée\n`
      data.se.forEach((se) => {
        prompt += `**${se.domain}** :\n`
        if (se.subdomains && se.subdomains.length > 0) {
          se.subdomains.forEach((subdomain: string) => {
            prompt += `  - ${subdomain}\n`
          })
        }
      })
      prompt += "\n"
    }

    // Add working memory context - avec vérification
    if (data.wm) {
      prompt += `## Objectifs et Contexte\n`
      if (data.wm.g) prompt += `**Objectif Principal :** ${data.wm.g}\n`
      if (data.wm.sg) prompt += `**Sous-objectif Actuel :** ${data.wm.sg}\n`
      if (data.wm.ctx) prompt += `**Contexte :** ${data.wm.ctx}\n\n`

      if (data.wm.pr) {
        if (data.wm.pr.completed && data.wm.pr.completed.length > 0) {
          prompt += `### Étapes Déjà Complétées\n`
          data.wm.pr.completed.forEach((step, index) => {
            prompt += `${index + 1}. ${step}\n`
          })
          prompt += "\n"
        }

        if (data.wm.pr.current && data.wm.pr.current.length > 0) {
          prompt += `### Étapes en Cours\n`
          data.wm.pr.current.forEach((step, index) => {
            prompt += `${index + 1}. ${step}\n`
          })
          prompt += "\n"
        }
      }
    }

    // Add knowledge graph - avec vérification
    if (data.kg?.tri && data.kg.tri.length > 0) {
      prompt += `## Relations de Connaissances\n`
      prompt += `Considérez les relations suivantes :\n`
      data.kg.tri.forEach((triplet) => {
        prompt += `- ${triplet.sub} ${triplet.pred} ${triplet.obj}\n`
      })
      prompt += "\n"
    }

    // Add logical components - avec vérification
    if (data.logic) {
      prompt += `## Composants Logiques\n`

      if (data.logic.propos && data.logic.propos.length > 0) {
        prompt += `### Propositions à Considérer\n`
        data.logic.propos.forEach((prop) => {
          prompt += `- **${prop.symb}** : ${prop.nl}\n`
        })
        prompt += "\n"
      }

      if (data.logic.proofs && data.logic.proofs.length > 0) {
        prompt += `### Preuves Disponibles\n`
        data.logic.proofs.forEach((proof) => {
          prompt += `- **${proof.symb}** : ${proof.nl}\n`
        })
        prompt += "\n"
      }

      if (data.logic.crits && data.logic.crits.length > 0) {
        prompt += `### Points Critiques à Examiner\n`
        data.logic.crits.forEach((crit) => {
          prompt += `- ${crit.nl}\n`
        })
        prompt += "\n"
      }

      if (data.logic.doubts && data.logic.doubts.length > 0) {
        prompt += `### Doutes à Clarifier\n`
        data.logic.doubts.forEach((doubt) => {
          prompt += `- ${doubt.nl}\n`
        })
        prompt += "\n"
      }
    }

    // Add reasoning chain - avec vérification
    if (data.chain?.steps && data.chain.steps.length > 0) {
      prompt += `## Processus de Raisonnement\n`
      prompt += `Suivez ces étapes dans l'ordre :\n\n`

      data.chain.steps
        .sort((a, b) => a.index - b.index)
        .forEach((step) => {
          prompt += `### Étape ${step.index}: ${step.description}\n`
          if (step.prompt) {
            prompt += `${step.prompt}\n`
          }
          if (step.depends_on && step.depends_on.length > 0) {
            prompt += `*Dépend des étapes : ${step.depends_on.join(", ")}*\n`
          }
          prompt += "\n"
        })

      if (data.chain.reflect) {
        prompt += `### Réflexion Métacognitive\n`
        prompt += `${data.chain.reflect}\n\n`
      }
    }

    // Add warnings and notes - avec vérification
    if (data.chain?.warn && data.chain.warn.length > 0) {
      prompt += `## ⚠️ Avertissements\n`
      data.chain.warn.forEach((warning) => {
        prompt += `- ${warning}\n`
      })
      prompt += "\n"
    }

    if (data.chain?.note && data.chain.note.length > 0) {
      prompt += `## 📝 Notes Importantes\n`
      data.chain.note.forEach((note) => {
        prompt += `- ${note}\n`
      })
      prompt += "\n"
    }

    prompt += `## Instructions Finales\n`
    prompt += `Utilisez toutes les informations ci-dessus pour fournir une réponse complète, structurée et bien raisonnée. `
    prompt += `Assurez-vous de suivre le processus de raisonnement défini et de tenir compte de tous les éléments contextuels fournis.`

    return prompt
  }

  const generateSimplePrompt = (): string => {
    if (!data) {
      return originalPrompt + "\n\nAucune donnée de raisonnement disponible."
    }

    let prompt = originalPrompt + "\n\n"

    if (data.wm?.g) {
      prompt += `Objectif: ${data.wm.g}\n`
    }

    if (data.exp && data.exp.length > 0) {
      prompt += `Expertise requise: ${data.exp.join(", ")}\n`
    }

    if (data.chain?.steps && data.chain.steps.length > 0) {
      prompt += `\nÉtapes à suivre:\n`
      data.chain.steps
        .sort((a, b) => a.index - b.index)
        .forEach((step, index) => {
          prompt += `${index + 1}. ${step.description}\n`
        })
    }

    return prompt
  }

  const generateMarkdownPrompt = (): string => {
    return generateStructuredPrompt()
  }

  const getCurrentPrompt = (): string => {
    switch (activeFormat) {
      case "structured":
        return generateStructuredPrompt()
      case "simple":
        return generateSimplePrompt()
      case "markdown":
        return generateMarkdownPrompt()
      default:
        return generateStructuredPrompt()
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getCurrentPrompt())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadPrompt = () => {
    const content = getCurrentPrompt()
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `prompt-${activeFormat}-${Date.now()}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getPromptStats = () => {
    const prompt = getCurrentPrompt()
    return {
      characters: prompt.length,
      words: prompt.split(/\s+/).length,
      lines: prompt.split("\n").length,
    }
  }

  const stats = getPromptStats()

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              Prompt Généré
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 text-xs text-slate-500">
                <Badge variant="outline">{stats.words} mots</Badge>
                <Badge variant="outline">{stats.characters} caractères</Badge>
                <Badge variant="outline">{stats.lines} lignes</Badge>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeFormat} onValueChange={setActiveFormat} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="structured" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Structuré
              </TabsTrigger>
              <TabsTrigger value="simple" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Simple
              </TabsTrigger>
              <TabsTrigger value="markdown" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Markdown
              </TabsTrigger>
            </TabsList>

            <TabsContent value="structured">
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border">
                  <Textarea
                    value={generateStructuredPrompt()}
                    readOnly
                    className="min-h-[400px] bg-transparent border-none resize-none focus:ring-0"
                  />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Format complet avec tous les éléments de raisonnement structuré
                </p>
              </div>
            </TabsContent>

            <TabsContent value="simple">
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border">
                  <Textarea
                    value={generateSimplePrompt()}
                    readOnly
                    className="min-h-[300px] bg-transparent border-none resize-none focus:ring-0"
                  />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Version simplifiée avec les éléments essentiels
                </p>
              </div>
            </TabsContent>

            <TabsContent value="markdown">
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border">
                  <Textarea
                    value={generateMarkdownPrompt()}
                    readOnly
                    className="min-h-[400px] bg-transparent border-none resize-none focus:ring-0"
                  />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Format Markdown pour documentation et partage
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-4">
            <Button onClick={copyToClipboard} className="flex-1">
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copié !
                </>
              ) : (
                <>
                  <Clipboard className="h-4 w-4 mr-2" />
                  Copier le prompt
                </>
              )}
            </Button>
            <Button variant="outline" onClick={downloadPrompt}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aperçu du Raisonnement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-emerald-600 mb-2">Expertise</h4>
              <div className="space-y-1">
                {data?.exp?.slice(0, 3).map((exp, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {exp}
                  </Badge>
                )) || <p className="text-xs text-slate-500">Aucune expertise définie</p>}
                {(data?.exp?.length || 0) > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{(data?.exp?.length || 0) - 3} autres
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-blue-600 mb-2">Objectifs</h4>
              <div className="space-y-1">
                {data?.wm?.g ? (
                  <p className="text-xs text-slate-600 dark:text-slate-400">{data.wm.g.substring(0, 50)}...</p>
                ) : (
                  <p className="text-xs text-slate-500">Aucun objectif défini</p>
                )}
                {data?.wm?.sg && (
                  <p className="text-xs text-slate-500">Sous-objectif: {data.wm.sg.substring(0, 30)}...</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-purple-600 mb-2">Connaissances</h4>
              <div className="space-y-1">
                <p className="text-xs text-slate-600 dark:text-slate-400">{data?.kg?.tri?.length || 0} relations</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {data?.logic?.propos?.length || 0} propositions
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-cyan-600 mb-2">Processus</h4>
              <div className="space-y-1">
                <p className="text-xs text-slate-600 dark:text-slate-400">{data?.chain?.steps?.length || 0} étapes</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {data?.wm?.pr?.completed?.length || 0} complétées
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
