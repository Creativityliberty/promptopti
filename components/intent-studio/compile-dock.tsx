"use client"

import { Box, ChevronDown, FileJson2, LoaderCircle, Sparkles, TerminalSquare } from "lucide-react"

import { cn } from "@/lib/utils"
import type { CompileState } from "./types"

interface CompileDockProps {
  compileState: CompileState
  destination: string
  inspectorOpen: boolean
  mode: string
  output: string
  onCompile: () => void
  onDestinationChange: (value: string) => void
  onModeChange: (value: string) => void
  onOutputChange: (value: string) => void
}

const STATE_LABELS: Record<CompileState, string> = {
  idle: "Compiler l’intention",
  queued: "Mission en file d’attente…",
  analyzing: "Décodage de l’intention…",
  compiling: "Compilation du Prompt Pack…",
  verifying: "Vérification du Prompt Pack…",
  repairing: "Réparation ciblée…",
  completed: "Prompt Pack compilé",
  failed: "Relancer la compilation",
}

export function CompileDock({
  compileState,
  destination,
  inspectorOpen,
  mode,
  output,
  onCompile,
  onDestinationChange,
  onModeChange,
  onOutputChange,
}: CompileDockProps) {
  const working = ["queued", "analyzing", "compiling", "verifying", "repairing"].includes(compileState)

  return (
    <div
      className={cn(
        "pointer-events-none absolute bottom-3 left-0 z-20 px-3 transition-[right] md:px-6",
        inspectorOpen ? "right-0 xl:right-[310px]" : "right-0",
      )}
    >
      <div className="pointer-events-auto mx-auto grid w-full max-w-[860px] gap-2 rounded-[24px] border border-white/90 bg-white/78 p-2.5 shadow-[0_18px_50px_rgba(31,46,37,0.16)] backdrop-blur-xl md:grid-cols-[1fr_1fr_1.15fr_1.55fr] md:items-end">
        <div className="hidden md:block">
          <DockSelect
            label="Destination"
            value={destination}
            icon={TerminalSquare}
            options={["Auto", "Codex", "Claude", "Gemini", "Cursor"]}
            onChange={onDestinationChange}
          />
        </div>
        <div className="hidden md:block">
          <DockSelect
            label="Mode"
            value={mode}
            icon={Sparkles}
            options={["Rapide", "Équilibré", "Expert", "Agentique"]}
            onChange={onModeChange}
          />
        </div>
        <div className="hidden md:block">
          <DockSelect
            label="Sortie"
            value={output}
            icon={FileJson2}
            options={["Prompt", "Prompt Pack", "Skill", "Agent", "Workflow"]}
            onChange={onOutputChange}
          />
        </div>

        <button
          type="button"
          onClick={onCompile}
          disabled={working}
          className={cn(
            "flex min-h-[58px] items-center justify-center gap-2 rounded-[17px] bg-[#234333] px-4 text-[13px] font-semibold text-white shadow-[0_10px_22px_rgba(35,67,51,0.22)] transition hover:-translate-y-0.5 hover:bg-[#193529] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789985] focus-visible:ring-offset-2 disabled:translate-y-0 disabled:cursor-wait",
            compileState === "completed" && "bg-[#39664b]",
            compileState === "failed" && "bg-[#7f3d32]",
          )}
        >
          {working ? (
            <LoaderCircle className="h-[18px] w-[18px] animate-spin" />
          ) : compileState === "completed" ? (
            <Box className="h-[18px] w-[18px]" />
          ) : (
            <TerminalSquare className="h-[18px] w-[18px]" />
          )}
          <span>{STATE_LABELS[compileState]}</span>
        </button>
      </div>
    </div>
  )
}

function DockSelect({
  label,
  value,
  icon: Icon,
  options,
  onChange,
}: {
  label: string
  value: string
  icon: typeof TerminalSquare
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block pl-2 text-[9px] font-semibold uppercase tracking-[0.09em] text-[#7c837f]">{label}</span>
      <span className="relative flex h-11 items-center rounded-[14px] border border-[#d6dad3] bg-[#fbfbf8] px-3 text-[#303933]">
        <Icon className="h-[16px] w-[16px] shrink-0" strokeWidth={1.8} />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-full min-w-0 flex-1 appearance-none bg-transparent pl-2 pr-5 text-[11px] font-medium outline-none"
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5" />
      </span>
    </label>
  )
}
