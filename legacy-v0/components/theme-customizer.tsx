"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Palette, Sun, Moon, Monitor, Paintbrush, Eye, Download, Upload, RotateCcw, Sparkles } from "lucide-react"

interface ThemeConfig {
  mode: "light" | "dark" | "system"
  primaryColor: string
  accentColor: string
  borderRadius: number
  fontSize: number
  fontFamily: string
  animations: boolean
  compactMode: boolean
  customColors: {
    background: string
    foreground: string
    card: string
    cardForeground: string
    popover: string
    popoverForeground: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    muted: string
    mutedForeground: string
    accent: string
    accentForeground: string
    destructive: string
    destructiveForeground: string
    border: string
    input: string
    ring: string
  }
}

const defaultTheme: ThemeConfig = {
  mode: "system",
  primaryColor: "#6366f1",
  accentColor: "#8b5cf6",
  borderRadius: 8,
  fontSize: 14,
  fontFamily: "Inter",
  animations: true,
  compactMode: false,
  customColors: {
    background: "#ffffff",
    foreground: "#0f172a",
    card: "#ffffff",
    cardForeground: "#0f172a",
    popover: "#ffffff",
    popoverForeground: "#0f172a",
    primary: "#6366f1",
    primaryForeground: "#ffffff",
    secondary: "#f1f5f9",
    secondaryForeground: "#0f172a",
    muted: "#f1f5f9",
    mutedForeground: "#64748b",
    accent: "#f1f5f9",
    accentForeground: "#0f172a",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "#e2e8f0",
    input: "#e2e8f0",
    ring: "#6366f1",
  },
}

const presetThemes = {
  default: {
    name: "Défaut",
    description: "Thème par défaut moderne",
    colors: { primary: "#6366f1", accent: "#8b5cf6" },
  },
  ocean: {
    name: "Océan",
    description: "Bleus apaisants",
    colors: { primary: "#0ea5e9", accent: "#06b6d4" },
  },
  forest: {
    name: "Forêt",
    description: "Verts naturels",
    colors: { primary: "#10b981", accent: "#059669" },
  },
  sunset: {
    name: "Coucher de soleil",
    description: "Oranges chaleureux",
    colors: { primary: "#f97316", accent: "#ea580c" },
  },
  purple: {
    name: "Violet",
    description: "Violets élégants",
    colors: { primary: "#8b5cf6", accent: "#7c3aed" },
  },
  rose: {
    name: "Rose",
    description: "Roses doux",
    colors: { primary: "#ec4899", accent: "#db2777" },
  },
}

export function ThemeCustomizer() {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme)
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    // Charger le thème depuis localStorage
    const savedTheme = localStorage.getItem("theme-config")
    if (savedTheme) {
      try {
        setTheme(JSON.parse(savedTheme))
      } catch (error) {
        console.error("Erreur lors du chargement du thème:", error)
      }
    }
  }, [])

  useEffect(() => {
    // Appliquer le thème
    applyTheme(theme)
    // Sauvegarder dans localStorage
    localStorage.setItem("theme-config", JSON.stringify(theme))
  }, [theme])

  const applyTheme = (config: ThemeConfig) => {
    const root = document.documentElement

    // Mode sombre/clair
    if (config.mode === "dark") {
      root.classList.add("dark")
    } else if (config.mode === "light") {
      root.classList.remove("dark")
    } else {
      // System mode
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (isDark) {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    }

    // Variables CSS personnalisées
    root.style.setProperty("--primary", config.primaryColor)
    root.style.setProperty("--accent", config.accentColor)
    root.style.setProperty("--radius", `${config.borderRadius}px`)
    root.style.setProperty("--font-size", `${config.fontSize}px`)
    root.style.setProperty("--font-family", config.fontFamily)

    // Mode compact
    if (config.compactMode) {
      root.classList.add("compact")
    } else {
      root.classList.remove("compact")
    }

    // Animations
    if (!config.animations) {
      root.classList.add("no-animations")
    } else {
      root.classList.remove("no-animations")
    }
  }

  const updateTheme = (updates: Partial<ThemeConfig>) => {
    setTheme((prev) => ({ ...prev, ...updates }))
  }

  const applyPreset = (presetKey: string) => {
    const preset = presetThemes[presetKey as keyof typeof presetThemes]
    if (preset) {
      updateTheme({
        primaryColor: preset.colors.primary,
        accentColor: preset.colors.accent,
      })
    }
  }

  const resetTheme = () => {
    setTheme(defaultTheme)
  }

  const exportTheme = () => {
    const dataStr = JSON.stringify(theme, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "theme-config.json"
    link.click()
  }

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedTheme = JSON.parse(e.target?.result as string)
          setTheme(importedTheme)
        } catch (error) {
          console.error("Erreur lors de l'import du thème:", error)
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-500" />
            Personnalisation du Thème
          </CardTitle>
          <CardDescription>Personnalisez l'apparence de l'application selon vos préférences</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Apparence
              </TabsTrigger>
              <TabsTrigger value="colors" className="flex items-center gap-2">
                <Paintbrush className="h-4 w-4" />
                Couleurs
              </TabsTrigger>
              <TabsTrigger value="typography" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Typographie
              </TabsTrigger>
              <TabsTrigger value="presets" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Préréglages
              </TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Mode d'affichage</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={theme.mode === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateTheme({ mode: "light" })}
                    >
                      <Sun className="h-4 w-4 mr-2" />
                      Clair
                    </Button>
                    <Button
                      variant={theme.mode === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateTheme({ mode: "dark" })}
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      Sombre
                    </Button>
                    <Button
                      variant={theme.mode === "system" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateTheme({ mode: "system" })}
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      Système
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Rayon des bordures</Label>
                  <Slider
                    value={[theme.borderRadius]}
                    onValueChange={([value]) => updateTheme({ borderRadius: value })}
                    max={20}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-slate-600 dark:text-slate-400">{theme.borderRadius}px</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Animations</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Activer les transitions et animations</p>
                  </div>
                  <Switch checked={theme.animations} onCheckedChange={(animations) => updateTheme({ animations })} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mode compact</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Interface plus dense avec moins d'espacement
                    </p>
                  </div>
                  <Switch checked={theme.compactMode} onCheckedChange={(compactMode) => updateTheme({ compactMode })} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="colors" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Couleur principale</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.primaryColor}
                        onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                        className="w-12 h-8 rounded border"
                      />
                      <span className="text-sm font-mono">{theme.primaryColor}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Couleur d'accent</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.accentColor}
                        onChange={(e) => updateTheme({ accentColor: e.target.value })}
                        className="w-12 h-8 rounded border"
                      />
                      <span className="text-sm font-mono">{theme.accentColor}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Aperçu des couleurs</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className="h-12 rounded border flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: theme.primaryColor }}
                    >
                      Principale
                    </div>
                    <div
                      className="h-12 rounded border flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: theme.accentColor }}
                    >
                      Accent
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="typography" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Police de caractères</Label>
                  <Select value={theme.fontFamily} onValueChange={(fontFamily) => updateTheme({ fontFamily })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                      <SelectItem value="Montserrat">Montserrat</SelectItem>
                      <SelectItem value="system-ui">Système</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Taille de police</Label>
                  <Slider
                    value={[theme.fontSize]}
                    onValueChange={([value]) => updateTheme({ fontSize: value })}
                    max={18}
                    min={12}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-slate-600 dark:text-slate-400">{theme.fontSize}px</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Aperçu de la typographie</h4>
                  <div className="space-y-2" style={{ fontFamily: theme.fontFamily, fontSize: theme.fontSize }}>
                    <h1 className="text-2xl font-bold">Titre principal</h1>
                    <h2 className="text-xl font-semibold">Sous-titre</h2>
                    <p className="text-base">
                      Ceci est un exemple de paragraphe avec la police et la taille sélectionnées.
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Texte secondaire plus petit</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="presets" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(presetThemes).map(([key, preset]) => (
                  <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{preset.name}</CardTitle>
                        <div className="flex gap-1">
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: preset.colors.primary }}
                          />
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: preset.colors.accent }}
                          />
                        </div>
                      </div>
                      <CardDescription className="text-sm">{preset.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button size="sm" onClick={() => applyPreset(key)} className="w-full">
                        Appliquer
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-wrap gap-2 pt-6 border-t">
            <Button variant="outline" onClick={resetTheme}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
            <Button variant="outline" onClick={exportTheme}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button variant="outline" asChild>
              <label>
                <Upload className="h-4 w-4 mr-2" />
                Importer
                <input type="file" accept=".json" onChange={importTheme} className="hidden" />
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
