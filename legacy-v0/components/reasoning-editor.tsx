"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Brain, Target, Lightbulb, AlertTriangle, CheckCircle } from "lucide-react"
import type { ReasoningData } from "@/types/reasoning"
import { Network } from "lucide-react" // Declaring the Network variable

interface ReasoningEditorProps {
  data: ReasoningData
  onChange: (data: ReasoningData) => void
}

export function ReasoningEditor({ data, onChange }: ReasoningEditorProps) {
  const updateField = (path: string[], value: any) => {
    const newData = JSON.parse(JSON.stringify(data))
    let current = newData

    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]]
    }

    current[path[path.length - 1]] = value
    onChange(newData)
  }

  const addArrayItem = (path: string[], item: any) => {
    const newData = JSON.parse(JSON.stringify(data))
    let current = newData

    for (let i = 0; i < path.length; i++) {
      current = current[path[i]]
    }

    current.push(item)
    onChange(newData)
  }

  const removeArrayItem = (path: string[], index: number) => {
    const newData = JSON.parse(JSON.stringify(data))
    let current = newData

    for (let i = 0; i < path.length; i++) {
      current = current[path[i]]
    }

    current.splice(index, 1)
    onChange(newData)
  }

  return (
    <div className="space-y-6">
      <Accordion type="multiple" className="w-full" defaultValue={["expertise", "working-memory"]}>
        {/* Domain Expertise */}
        <AccordionItem value="expertise" className="border rounded-lg p-2">
          <AccordionTrigger className="px-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-emerald-500" />
              Expertise du Domaine
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-2">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Domaines d'expertise</label>
                <div className="space-y-2">
                  {data.exp?.map((exp: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={exp}
                        onChange={(e) => {
                          const newExp = [...(data.exp || [])]
                          newExp[index] = e.target.value
                          updateField(["exp"], newExp)
                        }}
                        placeholder="Ex: Intelligence artificielle, Traitement du langage naturel"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeArrayItem(["exp"], index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => addArrayItem(["exp"], "")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une expertise
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Sous-domaines d'expertise</label>
                <div className="space-y-3">
                  {data.se?.map((se: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={se.domain}
                          onChange={(e) => {
                            const newSe = [...(data.se || [])]
                            newSe[index] = { ...newSe[index], domain: e.target.value }
                            updateField(["se"], newSe)
                          }}
                          placeholder="Domaine principal"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeArrayItem(["se"], index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {se.subdomains?.map((subdomain: string, subIndex: number) => (
                          <div key={subIndex} className="flex gap-2 ml-4">
                            <Input
                              value={subdomain}
                              onChange={(e) => {
                                const newSe = [...(data.se || [])]
                                newSe[index].subdomains[subIndex] = e.target.value
                                updateField(["se"], newSe)
                              }}
                              placeholder="Sous-domaine"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newSe = [...(data.se || [])]
                                newSe[index].subdomains.splice(subIndex, 1)
                                updateField(["se"], newSe)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-4"
                          onClick={() => {
                            const newSe = [...(data.se || [])]
                            if (!newSe[index].subdomains) newSe[index].subdomains = []
                            newSe[index].subdomains.push("")
                            updateField(["se"], newSe)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter sous-domaine
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => addArrayItem(["se"], { domain: "", subdomains: [] })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un domaine d'expertise
                  </Button>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Working Memory */}
        <AccordionItem value="working-memory" className="border rounded-lg p-2 mt-2">
          <AccordionTrigger className="px-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Mémoire de Travail
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-2">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Objectif Principal</label>
                <Input
                  value={data.wm?.g || ""}
                  onChange={(e) => updateField(["wm", "g"], e.target.value)}
                  placeholder="Définir l'objectif principal du raisonnement"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Sous-objectif Actuel</label>
                <Input
                  value={data.wm?.sg || ""}
                  onChange={(e) => updateField(["wm", "sg"], e.target.value)}
                  placeholder="Sous-objectif immédiat à traiter"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Contexte</label>
                <Textarea
                  value={data.wm?.ctx || ""}
                  onChange={(e) => updateField(["wm", "ctx"], e.target.value)}
                  placeholder="Informations contextuelles pertinentes"
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Étapes Complétées
                  </label>
                  <div className="space-y-2">
                    {data.wm?.pr?.completed?.map((step: string, index: number) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={step}
                          onChange={(e) => {
                            const newCompleted = [...(data.wm?.pr?.completed || [])]
                            newCompleted[index] = e.target.value
                            updateField(["wm", "pr", "completed"], newCompleted)
                          }}
                          placeholder="Étape complétée"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeArrayItem(["wm", "pr", "completed"], index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => addArrayItem(["wm", "pr", "completed"], "")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter étape complétée
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Étapes Actuelles
                  </label>
                  <div className="space-y-2">
                    {data.wm?.pr?.current?.map((step: string, index: number) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={step}
                          onChange={(e) => {
                            const newCurrent = [...(data.wm?.pr?.current || [])]
                            newCurrent[index] = e.target.value
                            updateField(["wm", "pr", "current"], newCurrent)
                          }}
                          placeholder="Étape en cours"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeArrayItem(["wm", "pr", "current"], index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => addArrayItem(["wm", "pr", "current"], "")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter étape actuelle
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Knowledge Graph */}
        <AccordionItem value="knowledge-graph" className="border rounded-lg p-2 mt-2">
          <AccordionTrigger className="px-4">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-purple-500" />
              Graphe de Connaissances
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-2">
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Relations sémantiques sous forme de triplets (Sujet - Prédicat - Objet)
              </p>
              <div className="space-y-3">
                {data.kg?.tri?.map((triplet: any, index: number) => (
                  <div key={index} className="grid grid-cols-3 gap-2 p-3 border rounded-lg">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Sujet</label>
                      <Input
                        value={triplet.sub}
                        onChange={(e) => {
                          const newTri = [...(data.kg?.tri || [])]
                          newTri[index] = { ...newTri[index], sub: e.target.value }
                          updateField(["kg", "tri"], newTri)
                        }}
                        placeholder="Sujet"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Prédicat</label>
                      <Input
                        value={triplet.pred}
                        onChange={(e) => {
                          const newTri = [...(data.kg?.tri || [])]
                          newTri[index] = { ...newTri[index], pred: e.target.value }
                          updateField(["kg", "tri"], newTri)
                        }}
                        placeholder="Relation"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-slate-500 mb-1 block">Objet</label>
                        <Input
                          value={triplet.obj}
                          onChange={(e) => {
                            const newTri = [...(data.kg?.tri || [])]
                            newTri[index] = { ...newTri[index], obj: e.target.value }
                            updateField(["kg", "tri"], newTri)
                          }}
                          placeholder="Objet"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button variant="ghost" size="icon" onClick={() => removeArrayItem(["kg", "tri"], index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => addArrayItem(["kg", "tri"], { sub: "", pred: "", obj: "" })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un triplet
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Logic Components */}
        <AccordionItem value="logic" className="border rounded-lg p-2 mt-2">
          <AccordionTrigger className="px-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-indigo-500" />
              Composants Logiques
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-2">
            <div className="space-y-6">
              {/* Propositions */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Badge variant="secondary">Propositions</Badge>
                </h4>
                <div className="space-y-3">
                  {data.logic?.propos?.map((prop: any, index: number) => (
                    <div key={index} className="grid grid-cols-2 gap-2 p-3 border rounded-lg">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Symbolique</label>
                        <Input
                          value={prop.symb}
                          onChange={(e) => {
                            const newPropos = [...(data.logic?.propos || [])]
                            newPropos[index] = { ...newPropos[index], symb: e.target.value }
                            updateField(["logic", "propos"], newPropos)
                          }}
                          placeholder="P1, P2, etc."
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-slate-500 mb-1 block">Langage naturel</label>
                          <Input
                            value={prop.nl}
                            onChange={(e) => {
                              const newPropos = [...(data.logic?.propos || [])]
                              newPropos[index] = { ...newPropos[index], nl: e.target.value }
                              updateField(["logic", "propos"], newPropos)
                            }}
                            placeholder="Description de la proposition"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeArrayItem(["logic", "propos"], index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => addArrayItem(["logic", "propos"], { symb: "", nl: "" })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une proposition
                  </Button>
                </div>
              </div>

              {/* Preuves */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Preuves
                  </Badge>
                </h4>
                <div className="space-y-3">
                  {data.logic?.proofs?.map((proof: any, index: number) => (
                    <div key={index} className="grid grid-cols-2 gap-2 p-3 border rounded-lg">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Symbolique</label>
                        <Input
                          value={proof.symb}
                          onChange={(e) => {
                            const newProofs = [...(data.logic?.proofs || [])]
                            newProofs[index] = { ...newProofs[index], symb: e.target.value }
                            updateField(["logic", "proofs"], newProofs)
                          }}
                          placeholder="Proof1, etc."
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-slate-500 mb-1 block">Langage naturel</label>
                          <Input
                            value={proof.nl}
                            onChange={(e) => {
                              const newProofs = [...(data.logic?.proofs || [])]
                              newProofs[index] = { ...newProofs[index], nl: e.target.value }
                              updateField(["logic", "proofs"], newProofs)
                            }}
                            placeholder="Description de la preuve"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeArrayItem(["logic", "proofs"], index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => addArrayItem(["logic", "proofs"], { symb: "", nl: "" })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une preuve
                  </Button>
                </div>
              </div>

              {/* Critiques et Doutes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Critiques
                    </Badge>
                  </h4>
                  <div className="space-y-2">
                    {data.logic?.crits?.map((crit: any, index: number) => (
                      <div key={index} className="flex gap-2 p-2 border rounded">
                        <Input
                          value={crit.nl}
                          onChange={(e) => {
                            const newCrits = [...(data.logic?.crits || [])]
                            newCrits[index] = { ...newCrits[index], nl: e.target.value }
                            updateField(["logic", "crits"], newCrits)
                          }}
                          placeholder="Point critique"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeArrayItem(["logic", "crits"], index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => addArrayItem(["logic", "crits"], { symb: "", nl: "" })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter critique
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      Doutes
                    </Badge>
                  </h4>
                  <div className="space-y-2">
                    {data.logic?.doubts?.map((doubt: any, index: number) => (
                      <div key={index} className="flex gap-2 p-2 border rounded">
                        <Input
                          value={doubt.nl}
                          onChange={(e) => {
                            const newDoubts = [...(data.logic?.doubts || [])]
                            newDoubts[index] = { ...newDoubts[index], nl: e.target.value }
                            updateField(["logic", "doubts"], newDoubts)
                          }}
                          placeholder="Point de doute"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeArrayItem(["logic", "doubts"], index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => addArrayItem(["logic", "doubts"], { symb: "", nl: "" })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter doute
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Reasoning Chain */}
        <AccordionItem value="chain" className="border rounded-lg p-2 mt-2">
          <AccordionTrigger className="px-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-cyan-500" />
              Chaîne de Raisonnement
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-2">
            <div className="space-y-6">
              {/* Steps */}
              <div>
                <h4 className="font-medium mb-3">Étapes de Raisonnement</h4>
                <div className="space-y-3">
                  {data.chain?.steps?.map((step: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Index</label>
                          <Input
                            type="number"
                            value={step.index}
                            onChange={(e) => {
                              const newSteps = [...(data.chain?.steps || [])]
                              newSteps[index] = { ...newSteps[index], index: Number.parseInt(e.target.value) }
                              updateField(["chain", "steps"], newSteps)
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-slate-500 mb-1 block">Dépend de</label>
                            <Input
                              value={step.depends_on?.join(", ") || ""}
                              onChange={(e) => {
                                const newSteps = [...(data.chain?.steps || [])]
                                newSteps[index] = {
                                  ...newSteps[index],
                                  depends_on: e.target.value
                                    .split(",")
                                    .map((n) => Number.parseInt(n.trim()))
                                    .filter((n) => !isNaN(n)),
                                }
                                updateField(["chain", "steps"], newSteps)
                              }}
                              placeholder="1, 2, 3"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeArrayItem(["chain", "steps"], index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Description</label>
                        <Textarea
                          value={step.description}
                          onChange={(e) => {
                            const newSteps = [...(data.chain?.steps || [])]
                            newSteps[index] = { ...newSteps[index], description: e.target.value }
                            updateField(["chain", "steps"], newSteps)
                          }}
                          placeholder="Description de l'étape"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Prompt</label>
                        <Textarea
                          value={step.prompt}
                          onChange={(e) => {
                            const newSteps = [...(data.chain?.steps || [])]
                            newSteps[index] = { ...newSteps[index], prompt: e.target.value }
                            updateField(["chain", "steps"], newSteps)
                          }}
                          placeholder="Prompt pour cette étape"
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      addArrayItem(["chain", "steps"], {
                        index: (data.chain?.steps?.length || 0) + 1,
                        depends_on: [],
                        description: "",
                        prompt: "",
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une étape
                  </Button>
                </div>
              </div>

              {/* Reflection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Réflexion Métacognitive</label>
                <Textarea
                  value={data.chain?.reflect || ""}
                  onChange={(e) => updateField(["chain", "reflect"], e.target.value)}
                  placeholder="Analyse métacognitive du processus de raisonnement"
                  className="min-h-[100px]"
                />
              </div>

              {/* Errors, Notes, Warnings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Erreurs
                  </h4>
                  <div className="space-y-2">
                    {data.chain?.err?.map((error: any, index: number) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={error.msg}
                          onChange={(e) => {
                            const newErr = [...(data.chain?.err || [])]
                            newErr[index] = { ...newErr[index], msg: e.target.value }
                            updateField(["chain", "err"], newErr)
                          }}
                          placeholder="Message d'erreur"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeArrayItem(["chain", "err"], index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => addArrayItem(["chain", "err"], { msg: "" })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter erreur
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-500" />
                    Notes
                  </h4>
                  <div className="space-y-2">
                    {data.chain?.note?.map((note: string, index: number) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={note}
                          onChange={(e) => {
                            const newNote = [...(data.chain?.note || [])]
                            newNote[index] = e.target.value
                            updateField(["chain", "note"], newNote)
                          }}
                          placeholder="Note"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeArrayItem(["chain", "note"], index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => addArrayItem(["chain", "note"], "")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter note
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Avertissements
                  </h4>
                  <div className="space-y-2">
                    {data.chain?.warn?.map((warning: string, index: number) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={warning}
                          onChange={(e) => {
                            const newWarn = [...(data.chain?.warn || [])]
                            newWarn[index] = e.target.value
                            updateField(["chain", "warn"], newWarn)
                          }}
                          placeholder="Avertissement"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeArrayItem(["chain", "warn"], index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => addArrayItem(["chain", "warn"], "")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter avertissement
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
