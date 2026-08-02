"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, SortAsc, SortDesc, Calendar, Clock, CheckCircle, AlertCircle, X, Download, Eye } from "lucide-react"

interface SearchResult {
  id: string
  type: "workflow" | "prompt" | "result"
  title: string
  description: string
  status: "completed" | "error" | "running" | "cancelled"
  duration?: number
  timestamp: number
  tags: string[]
  metadata: Record<string, any>
}

interface SearchFilters {
  query: string
  type: string[]
  status: string[]
  dateRange: string
  sortBy: string
  sortOrder: "asc" | "desc"
  tags: string[]
}

const mockResults: SearchResult[] = [
  {
    id: "wf_001",
    type: "workflow",
    title: "Analyse de prompt marketing",
    description: "Analyse complète d'un prompt pour campagne publicitaire",
    status: "completed",
    duration: 45.2,
    timestamp: Date.now() - 3600000,
    tags: ["marketing", "analyse", "publicité"],
    metadata: { workflow_type: "structured_reasoning", cache_hit: false },
  },
  {
    id: "wf_002",
    type: "workflow",
    title: "Validation logique de raisonnement",
    description: "Vérification de la cohérence d'un argument philosophique",
    status: "completed",
    duration: 23.8,
    timestamp: Date.now() - 7200000,
    tags: ["philosophie", "logique", "validation"],
    metadata: { workflow_type: "logical_validation", cache_hit: true },
  },
  {
    id: "wf_003",
    type: "workflow",
    title: "Analyse technique de code",
    description: "Évaluation de la qualité et des bonnes pratiques",
    status: "error",
    duration: 12.1,
    timestamp: Date.now() - 10800000,
    tags: ["code", "technique", "qualité"],
    metadata: { workflow_type: "simple_analysis", error: "API timeout" },
  },
  {
    id: "pr_001",
    type: "prompt",
    title: "Prompt créatif pour storytelling",
    description: "Génération d'histoires courtes avec personnages complexes",
    status: "completed",
    timestamp: Date.now() - 14400000,
    tags: ["créatif", "storytelling", "personnages"],
    metadata: { length: 250, language: "fr" },
  },
  {
    id: "rs_001",
    type: "result",
    title: "Résultat d'analyse sentiment",
    description: "Analyse de sentiment sur des avis clients",
    status: "completed",
    duration: 18.5,
    timestamp: Date.now() - 18000000,
    tags: ["sentiment", "clients", "avis"],
    metadata: { confidence: 0.94, sentiment: "positive" },
  },
]

export function AdvancedSearch() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    type: [],
    status: [],
    dateRange: "all",
    sortBy: "timestamp",
    sortOrder: "desc",
    tags: [],
  })

  const [results, setResults] = useState<SearchResult[]>(mockResults)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedResults, setSelectedResults] = useState<string[]>([])

  // Extraction des tags uniques
  const availableTags = useMemo(() => {
    const allTags = mockResults.flatMap((result) => result.tags)
    return Array.from(new Set(allTags)).sort()
  }, [])

  // Filtrage et tri des résultats
  const filteredResults = useMemo(() => {
    let filtered = mockResults

    // Filtrage par requête
    if (filters.query) {
      const query = filters.query.toLowerCase()
      filtered = filtered.filter(
        (result) =>
          result.title.toLowerCase().includes(query) ||
          result.description.toLowerCase().includes(query) ||
          result.tags.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    // Filtrage par type
    if (filters.type.length > 0) {
      filtered = filtered.filter((result) => filters.type.includes(result.type))
    }

    // Filtrage par statut
    if (filters.status.length > 0) {
      filtered = filtered.filter((result) => filters.status.includes(result.status))
    }

    // Filtrage par tags
    if (filters.tags.length > 0) {
      filtered = filtered.filter((result) => filters.tags.some((tag) => result.tags.includes(tag)))
    }

    // Filtrage par date
    if (filters.dateRange !== "all") {
      const now = Date.now()
      const ranges = {
        "1h": 3600000,
        "24h": 86400000,
        "7d": 604800000,
        "30d": 2592000000,
      }
      const range = ranges[filters.dateRange as keyof typeof ranges]
      if (range) {
        filtered = filtered.filter((result) => now - result.timestamp <= range)
      }
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (filters.sortBy) {
        case "title":
          aValue = a.title
          bValue = b.title
          break
        case "duration":
          aValue = a.duration || 0
          bValue = b.duration || 0
          break
        case "timestamp":
        default:
          aValue = a.timestamp
          bValue = b.timestamp
          break
      }

      if (filters.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [filters])

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const addToFilter = (key: "type" | "status" | "tags", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value],
    }))
  }

  const clearFilters = () => {
    setFilters({
      query: "",
      type: [],
      status: [],
      dateRange: "all",
      sortBy: "timestamp",
      sortOrder: "desc",
      tags: [],
    })
  }

  const toggleResultSelection = (id: string) => {
    setSelectedResults((prev) => (prev.includes(id) ? prev.filter((resultId) => resultId !== id) : [...prev, id]))
  }

  const selectAllResults = () => {
    setSelectedResults(filteredResults.map((result) => result.id))
  }

  const clearSelection = () => {
    setSelectedResults([])
  }

  const exportSelected = () => {
    const selectedData = filteredResults.filter((result) => selectedResults.includes(result.id))
    const dataStr = JSON.stringify(selectedData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `search-results-${new Date().toISOString().split("T")[0]}.json`
    link.click()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "workflow":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "prompt":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "result":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A"
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    return `${(seconds / 60).toFixed(1)}min`
  }

  const formatTimestamp = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `il y a ${minutes}min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `il y a ${hours}h`
    const days = Math.floor(hours / 24)
    return `il y a ${days}j`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-500" />
            Recherche Avancée
          </CardTitle>
          <CardDescription>
            Recherchez et filtrez vos workflows, prompts et résultats avec des critères avancés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="search">Recherche</TabsTrigger>
              <TabsTrigger value="filters">Filtres</TabsTrigger>
              <TabsTrigger value="results">Résultats ({filteredResults.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Rechercher dans les titres, descriptions et tags..."
                    value={filters.query}
                    onChange={(e) => updateFilter("query", e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Effacer
                </Button>
              </div>

              {/* Filtres rapides */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Filtres rapides</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={filters.type.includes("workflow") ? "default" : "outline"}
                      size="sm"
                      onClick={() => addToFilter("type", "workflow")}
                    >
                      Workflows
                    </Button>
                    <Button
                      variant={filters.type.includes("prompt") ? "default" : "outline"}
                      size="sm"
                      onClick={() => addToFilter("type", "prompt")}
                    >
                      Prompts
                    </Button>
                    <Button
                      variant={filters.type.includes("result") ? "default" : "outline"}
                      size="sm"
                      onClick={() => addToFilter("type", "result")}
                    >
                      Résultats
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Statut</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={filters.status.includes("completed") ? "default" : "outline"}
                      size="sm"
                      onClick={() => addToFilter("status", "completed")}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Terminé
                    </Button>
                    <Button
                      variant={filters.status.includes("error") ? "default" : "outline"}
                      size="sm"
                      onClick={() => addToFilter("status", "error")}
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Erreur
                    </Button>
                    <Button
                      variant={filters.status.includes("running") ? "default" : "outline"}
                      size="sm"
                      onClick={() => addToFilter("status", "running")}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      En cours
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="filters" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Période</Label>
                    <Select value={filters.dateRange} onValueChange={(value) => updateFilter("dateRange", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les périodes</SelectItem>
                        <SelectItem value="1h">Dernière heure</SelectItem>
                        <SelectItem value="24h">Dernières 24h</SelectItem>
                        <SelectItem value="7d">7 derniers jours</SelectItem>
                        <SelectItem value="30d">30 derniers jours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Trier par</Label>
                    <div className="flex gap-2">
                      <Select value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="timestamp">Date</SelectItem>
                          <SelectItem value="title">Titre</SelectItem>
                          <SelectItem value="duration">Durée</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateFilter("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc")}
                      >
                        {filters.sortOrder === "asc" ? (
                          <SortAsc className="h-4 w-4" />
                        ) : (
                          <SortDesc className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Tags</Label>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {availableTags.map((tag) => (
                        <div key={tag} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tag-${tag}`}
                            checked={filters.tags.includes(tag)}
                            onCheckedChange={() => addToFilter("tags", tag)}
                          />
                          <Label htmlFor={`tag-${tag}`} className="text-sm">
                            {tag}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {/* Actions sur les résultats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {filteredResults.length} résultat(s) trouvé(s)
                  </span>
                  {selectedResults.length > 0 && (
                    <Badge variant="secondary">{selectedResults.length} sélectionné(s)</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {filteredResults.length > 0 && (
                    <>
                      <Button variant="outline" size="sm" onClick={selectAllResults}>
                        Tout sélectionner
                      </Button>
                      {selectedResults.length > 0 && (
                        <>
                          <Button variant="outline" size="sm" onClick={clearSelection}>
                            Désélectionner
                          </Button>
                          <Button variant="outline" size="sm" onClick={exportSelected}>
                            <Download className="h-4 w-4 mr-2" />
                            Exporter
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Liste des résultats */}
              <div className="space-y-3">
                {filteredResults.map((result) => (
                  <Card
                    key={result.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedResults.includes(result.id) ? "ring-2 ring-blue-500" : ""
                    }`}
                    onClick={() => toggleResultSelection(result.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedResults.includes(result.id)}
                              onChange={() => toggleResultSelection(result.id)}
                            />
                            {getStatusIcon(result.status)}
                            <h3 className="font-medium">{result.title}</h3>
                            <Badge className={getTypeColor(result.type)}>{result.type}</Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{result.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatTimestamp(result.timestamp)}
                            </span>
                            {result.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(result.duration)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {result.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredResults.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                    <p className="text-lg font-medium mb-2">Aucun résultat trouvé</p>
                    <p className="text-slate-600 dark:text-slate-400">Essayez de modifier vos critères de recherche</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
