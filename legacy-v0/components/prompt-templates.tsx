"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { BookOpen, Plus, Download, Upload, Trash2, Star, Copy } from "lucide-react"
import { useLocalStorage } from "@/hooks/use-local-storage"

interface PromptTemplate {
  id: string
  name: string
  description: string
  category: string
  prompt: string
  reasoningData?: any
  tags: string[]
  createdAt: string
  rating: number
}

interface PromptTemplatesProps {
  onLoadTemplate: (template: PromptTemplate) => void
}

const defaultTemplates: PromptTemplate[] = [
  {
    id: "1",
    name: "Analyse de Problème Complexe",
    description: "Template pour analyser des problèmes complexes avec une approche structurée",
    category: "Analyse",
    prompt:
      "Analysez le problème suivant en utilisant une approche systématique:\n\n1. Identification du problème\n2. Décomposition en sous-problèmes\n3. Analyse des causes racines\n4. Proposition de solutions\n5. Évaluation des risques",
    tags: ["analyse", "problème", "systématique"],
    createdAt: "2024-01-15",
    rating: 5,
  },
  {
    id: "2",
    name: "Raisonnement Scientifique",
    description: "Framework pour le raisonnement scientifique et la validation d'hypothèses",
    category: "Science",
    prompt:
      "Appliquez la méthode scientifique pour examiner cette question:\n\n1. Observation du phénomène\n2. Formulation d'hypothèses\n3. Conception d'expériences\n4. Analyse des résultats\n5. Conclusion et validation",
    tags: ["science", "hypothèse", "expérience"],
    createdAt: "2024-01-10",
    rating: 4,
  },
  {
    id: "3",
    name: "Prise de Décision Stratégique",
    description: "Cadre pour la prise de décisions stratégiques en entreprise",
    category: "Business",
    prompt:
      "Évaluez cette décision stratégique en considérant:\n\n1. Contexte et enjeux\n2. Options disponibles\n3. Critères d'évaluation\n4. Analyse coûts/bénéfices\n5. Plan d'implémentation",
    tags: ["stratégie", "décision", "business"],
    createdAt: "2024-01-05",
    rating: 5,
  },
]

export function PromptTemplates({ onLoadTemplate }: PromptTemplatesProps) {
  const [templates, setTemplates] = useLocalStorage<PromptTemplate[]>("prompt-templates", defaultTemplates)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newTemplate, setNewTemplate] = useState<Partial<PromptTemplate>>({
    name: "",
    description: "",
    category: "",
    prompt: "",
    tags: [],
  })

  const categories = ["all", ...Array.from(new Set(templates.map((t) => t.category)))]

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.prompt) return

    const template: PromptTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      description: newTemplate.description || "",
      category: newTemplate.category || "Général",
      prompt: newTemplate.prompt,
      tags: newTemplate.tags || [],
      createdAt: new Date().toISOString().split("T")[0],
      rating: 0,
    }

    setTemplates([...templates, template])
    setNewTemplate({ name: "", description: "", category: "", prompt: "", tags: [] })
    setIsCreateDialogOpen(false)
  }

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id))
  }

  const handleRateTemplate = (id: string, rating: number) => {
    setTemplates(templates.map((t) => (t.id === id ? { ...t, rating } : t)))
  }

  const handleExportTemplates = () => {
    const dataStr = JSON.stringify(templates, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "prompt-templates.json"
    link.click()
  }

  const handleImportTemplates = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedTemplates = JSON.parse(e.target?.result as string)
        setTemplates([...templates, ...importedTemplates])
      } catch (error) {
        console.error("Erreur lors de l'importation:", error)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-500" />
            Templates de Prompts
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Utilisez des templates prédéfinis ou créez les vôtres
          </p>
        </div>
        <div className="flex gap-2">
          <input type="file" accept=".json" onChange={handleImportTemplates} className="hidden" id="import-templates" />
          <Button variant="outline" size="sm" onClick={() => document.getElementById("import-templates")?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportTemplates}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un Nouveau Template</DialogTitle>
                <DialogDescription>Créez un template réutilisable pour vos prompts</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Nom</label>
                    <Input
                      value={newTemplate.name || ""}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="Nom du template"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Catégorie</label>
                    <Input
                      value={newTemplate.category || ""}
                      onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                      placeholder="Catégorie"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Textarea
                    value={newTemplate.description || ""}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder="Description du template"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Prompt</label>
                  <Textarea
                    value={newTemplate.prompt || ""}
                    onChange={(e) => setNewTemplate({ ...newTemplate, prompt: e.target.value })}
                    placeholder="Contenu du prompt"
                    className="min-h-[150px]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Tags (séparés par des virgules)</label>
                  <Input
                    value={newTemplate.tags?.join(", ") || ""}
                    onChange={(e) =>
                      setNewTemplate({
                        ...newTemplate,
                        tags: e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter((tag) => tag),
                      })
                    }
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateTemplate} disabled={!newTemplate.name || !newTemplate.prompt}>
                  Créer Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Rechercher des templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category === "all" ? "Tous" : category}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="text-sm mt-1">{template.description}</CardDescription>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navigator.clipboard.writeText(template.prompt)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <Badge variant="secondary">{template.category}</Badge>
                  <span className="text-slate-500">{template.createdAt}</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRateTemplate(template.id, star)}
                        className={`text-sm ${star <= template.rating ? "text-yellow-400" : "text-gray-300"}`}
                      >
                        <Star className="h-4 w-4 fill-current" />
                      </button>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onLoadTemplate(template)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Utiliser
                  </Button>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded max-h-20 overflow-y-auto">
                  {template.prompt.substring(0, 150)}
                  {template.prompt.length > 150 && "..."}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucun template trouvé</p>
          <p className="text-sm">Essayez de modifier vos critères de recherche</p>
        </div>
      )}
    </div>
  )
}
