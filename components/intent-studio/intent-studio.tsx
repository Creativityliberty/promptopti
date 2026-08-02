"use client"

import { ArrowLeft, Box, Command, Puzzle, Search, Sparkles, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { cn } from "@/lib/utils"
import { CompileDock } from "./compile-dock"
import { IntentComposer } from "./intent-composer"
import { IntentMap } from "./intent-map"
import { Navigation } from "./navigation"
import { PromptPackResult } from "./prompt-pack-result"
import { SkillInspector } from "./skill-inspector"
import { SkillThread } from "./skill-thread"
import type { MissionResponse } from "@/lib/contracts"
import { INITIAL_INTENT, NAV_ITEMS } from "./studio-data"
import { Topbar } from "./topbar"
import type { CompileState, IntentFieldDefinition, McpToolDefinition, PromptPackDefinition, SkillDefinition } from "./types"

export function IntentStudio({
  initialSkills,
  authConfigured: _authConfigured,
}: {
  initialSkills: SkillDefinition[]
  authConfigured: boolean
}) {
  const [activeItem, setActiveItem] = useState("Studio")
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [selectedSkillId, setSelectedSkillId] = useState(
    initialSkills.some((skill) => skill.id === "mission-spec-compiler") ? "mission-spec-compiler" : initialSkills[0]?.id ?? "",
  )
  const [intent, setIntent] = useState(INITIAL_INTENT)
  const [fieldOverrides, setFieldOverrides] = useState<Partial<Record<IntentFieldDefinition["id"], string>>>({})
  const [platform, setPlatform] = useState("")
  const [destination, setDestination] = useState("Codex")
  const [mode, setMode] = useState("Expert")
  const [output, setOutput] = useState("Prompt Pack")
  const [compileState, setCompileState] = useState<CompileState>("idle")
  const [promptPack, setPromptPack] = useState<PromptPackDefinition | null>(null)
  const [currentSkillId, setCurrentSkillId] = useState<string | null>(null)
  const [compileError, setCompileError] = useState<string | null>(null)
  const [mcpTools, setMcpTools] = useState<McpToolDefinition[]>([])

  const selectedSkill = useMemo(
    () => initialSkills.find((skill) => skill.id === selectedSkillId) ?? initialSkills[0],
    [initialSkills, selectedSkillId],
  )

  useEffect(() => {
    if (window.matchMedia("(min-width: 1280px)").matches) {
      setInspectorOpen(true)
    }

    function handleKeyboard(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setCommandOpen((current) => !current)
      }
      if (event.key === "Escape") {
        setCommandOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyboard)
    return () => window.removeEventListener("keydown", handleKeyboard)
  }, [])

  useEffect(() => {
    let active = true
    void fetch("/api/mcp/tools", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { tools: [] })
      .then((payload: { tools?: McpToolDefinition[] }) => {
        if (active) setMcpTools(payload.tools ?? [])
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [])

  function selectSkill(skillId: string) {
    setSelectedSkillId(skillId)
    setInspectorOpen(true)
  }

  async function compileIntent() {
    if (!intent.trim() || ["queued", "analyzing", "compiling", "verifying", "repairing"].includes(compileState)) return

    setPromptPack(null)
    setCompileError(null)
    setCurrentSkillId(null)
    setCompileState("queued")

    try {
      const enrichedIntention = buildEnrichedIntention(intent, fieldOverrides)
      const startResponse = await fetch("/api/intents/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intention: enrichedIntention,
          destination: platform || destination,
          mode,
          output,
          skillIds: initialSkills.map((skill) => skill.id),
          mcpToolNames: mcpTools.filter((tool) => tool.status === "approved").map((tool) => tool.name),
        }),
      })
      if (!startResponse.ok) throw new Error(await readApiError(startResponse))
      const started = await startResponse.json() as { missionId: string }

      for (let attempt = 0; attempt < 180; attempt += 1) {
        await delay(attempt < 3 ? 550 : 1_250)
        const response = await fetch(`/api/missions/${started.missionId}`, { cache: "no-store" })
        if (!response.ok) throw new Error(await readApiError(response))
        const mission = await response.json() as MissionResponse
        setCompileState(toCompileState(mission.status))
        setCurrentSkillId(mission.currentSkillId)

        if (mission.status === "failed") {
          throw new Error(mission.errorMessage ?? "La compilation a échoué.")
        }
        if (mission.status === "completed" && mission.promptPack) {
          setPromptPack({
            id: mission.promptPack.id,
            version: mission.promptPack.version,
            model: mission.promptPack.model,
            score: mission.promptPack.score,
            status: mission.promptPack.status,
            system: mission.promptPack.system,
            user: mission.promptPack.user,
            variables: mission.promptPack.variables.map((variable) => ({
              name: variable.name,
              value: variable.defaultValue,
              description: variable.description,
              required: variable.required,
            })),
            tests: mission.promptPack.tests,
            provenance: mission.promptPack.provenance,
          })
          setCompileState("completed")
          return
        }
      }

      throw new Error("Le workflow continue en arrière-plan. Retrouvez-le dans Missions.")
    } catch (error) {
      setCompileState("failed")
      setCompileError(error instanceof Error ? error.message : "Impossible de compiler cette intention.")
    }
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#F6F4ED] text-[#252A26]">
      <Navigation
        activeItem={activeItem}
        mobileOpen={mobileNavigationOpen}
        onClose={() => setMobileNavigationOpen(false)}
        onSelect={setActiveItem}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          inspectorOpen={inspectorOpen}
          onOpenCommand={() => setCommandOpen(true)}
          onOpenInspector={() => setInspectorOpen(true)}
          onOpenNavigation={() => setMobileNavigationOpen(true)}
        />

        <div className="relative flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto scroll-smooth" aria-label="Espace de travail">
            {activeItem === "Studio" ? (
              <div className="mx-auto flex min-h-full w-full max-w-[980px] flex-col px-4 pb-28 pt-7 md:px-7 md:pt-9">
                <div className="space-y-3">
                  <IntentComposer value={intent} onChange={setIntent} onSubmit={() => void compileIntent()} />

                  <IntentMap
                    fieldOverrides={fieldOverrides}
                    platform={platform}
                    onPlatformChange={(value) => {
                      setPlatform(value)
                      setDestination(value)
                    }}
                    onFieldChange={(id, value) =>
                      setFieldOverrides((current) => ({
                        ...current,
                        [id]: value,
                      }))
                    }
                  />

                  <SkillThread
                    skills={initialSkills}
                    selectedSkillId={selectedSkillId}
                    compileState={compileState}
                    currentSkillId={currentSkillId}
                    mcpTools={mcpTools}
                    onSelectSkill={selectSkill}
                  />

                  {compileError ? (
                    <div role="alert" className="rounded-[16px] border border-[#d6a08d] bg-[#fff2ec] px-4 py-3 text-[12px] leading-5 text-[#7b392c]">
                      {compileError}
                    </div>
                  ) : null}

                  {promptPack ? <PromptPackResult promptPack={promptPack} onRecompile={() => void compileIntent()} /> : null}
                </div>

              </div>
            ) : (
              <ModuleView module={activeItem} onBack={() => setActiveItem("Studio")} />
            )}
          </main>

          {activeItem === "Studio" ? (
            <CompileDock
              compileState={compileState}
              destination={destination}
              inspectorOpen={inspectorOpen}
              mode={mode}
              output={output}
              onCompile={() => void compileIntent()}
              onDestinationChange={setDestination}
              onModeChange={setMode}
              onOutputChange={setOutput}
            />
          ) : null}

          {inspectorOpen && selectedSkill ? (
            <button
              type="button"
              className="absolute inset-0 z-30 bg-[#1f2e25]/15 backdrop-blur-[2px] xl:hidden"
              onClick={() => setInspectorOpen(false)}
              aria-label="Fermer l’inspecteur"
            />
          ) : null}

          {selectedSkill ? <SkillInspector open={inspectorOpen} skill={selectedSkill} onClose={() => setInspectorOpen(false)} /> : null}
        </div>
      </div>

      <CommandPalette
        skills={initialSkills}
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onSelectNavigation={(item) => {
          setActiveItem(item)
          setCommandOpen(false)
        }}
        onSelectSkill={(skillId) => {
          setActiveItem("Studio")
          selectSkill(skillId)
          setCommandOpen(false)
        }}
      />
    </div>
  )
}

function CommandPalette({
  open,
  skills,
  onClose,
  onSelectNavigation,
  onSelectSkill,
}: {
  open: boolean
  skills: SkillDefinition[]
  onClose: () => void
  onSelectNavigation: (item: string) => void
  onSelectSkill: (skillId: string) => void
}) {
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  if (!open) return null

  const normalized = query.trim().toLowerCase()
  const navigationResults = NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(normalized))
  const skillResults = skills.filter((skill) => skill.name.toLowerCase().includes(normalized))

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-[#14241a]/25 px-4 pt-[12vh] backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Palette de commandes">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Fermer" />
      <div className="relative w-full max-w-[590px] overflow-hidden rounded-[24px] border border-white bg-[#fbfaf6] shadow-[0_28px_80px_rgba(28,42,33,0.26)]">
        <div className="flex items-center gap-3 border-b border-[#dcdfd8] px-4">
          <Search className="h-[19px] w-[19px] text-[#617067]" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-14 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#8a928d]"
            placeholder="Rechercher une page, un Skill ou un outil…"
          />
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-[#6a736e] hover:bg-[#edf1ec]" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-2">
          {navigationResults.length ? (
            <CommandGroup label="Navigation">
              {navigationResults.map(({ label, icon: Icon }) => (
                <CommandRow key={label} icon={Icon} label={label} onClick={() => onSelectNavigation(label)} />
              ))}
            </CommandGroup>
          ) : null}

          {skillResults.length ? (
            <CommandGroup label="Skills Nümtema">
              {skillResults.map((skill) => (
                <CommandRow key={skill.id} icon={Puzzle} label={skill.name} hint="Ouvrir dans le Studio" onClick={() => onSelectSkill(skill.id)} />
              ))}
            </CommandGroup>
          ) : null}

          {!navigationResults.length && !skillResults.length ? (
            <div className="grid min-h-32 place-items-center text-center text-[12px] text-[#7b837e]">
              Aucun résultat pour « {query} »
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 border-t border-[#dcdfd8] px-4 py-2.5 text-[10px] text-[#7f8782]">
          <Command className="h-3.5 w-3.5" />
          Ctrl K pour ouvrir · Échap pour fermer
        </div>
      </div>
    </div>
  )
}

function CommandGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mb-2 last:mb-0">
      <h2 className="px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8a928d]">{label}</h2>
      <div className="space-y-1">{children}</div>
    </section>
  )
}

function CommandRow({
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  icon: typeof Sparkles
  label: string
  hint?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center gap-3 rounded-[13px] px-3 text-left text-[12px] font-medium text-[#37423b] transition hover:bg-[#e7eee8] hover:text-[#234333]"
    >
      <Icon className="h-[17px] w-[17px]" strokeWidth={1.8} />
      {label}
      {hint ? <span className="ml-auto text-[10px] font-normal text-[#8a928d]">{hint}</span> : null}
    </button>
  )
}

function ModuleView({ module, onBack }: { module: string; onBack: () => void }) {
  return (
    <div className="mx-auto flex min-h-full max-w-[760px] flex-col justify-center px-6 py-16">
      <button type="button" onClick={onBack} className="mb-8 flex w-fit items-center gap-2 text-[12px] font-medium text-[#5f7868] hover:text-[#234333]">
        <ArrowLeft className="h-4 w-4" />
        Retour au Studio
      </button>
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-[#dfeae1] text-[#315e43]">
          <Box className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-[30px] font-semibold tracking-[-0.04em] text-[#252A26]">{module}</h1>
          <p className="mt-3 max-w-[560px] text-[14px] leading-6 text-[#657069]">
            Le shell du module est prêt. Sa logique métier sera branchée après la validation du Studio, afin de conserver une seule orchestration réelle pour les Skills, MCP et Prompt Packs.
          </p>
        </div>
      </div>
    </div>
  )
}

function delay(duration: number) {
  return new Promise((resolve) => window.setTimeout(resolve, duration))
}

function toCompileState(status: MissionResponse["status"]): CompileState {
  return status === "cancelled" ? "failed" : status
}

function buildEnrichedIntention(
  intention: string,
  overrides: Partial<Record<IntentFieldDefinition["id"], string>>,
) {
  const labels: Record<IntentFieldDefinition["id"], string> = {
    objective: "Objectif",
    audience: "Audience",
    context: "Contexte",
    constraints: "Contraintes",
    deliverable: "Livrable",
    success: "Critères de réussite",
  }
  const additions = Object.entries(overrides)
    .filter((entry): entry is [IntentFieldDefinition["id"], string] => Boolean(entry[1]?.trim()))
    .map(([key, value]) => `${labels[key]} : ${value.trim()}`)
  return additions.length ? `${intention.trim()}\n\nContexte confirmé :\n${additions.join("\n")}` : intention.trim()
}

async function readApiError(response: Response) {
  const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null
  return payload?.error?.message ?? `Erreur HTTP ${response.status}`
}
