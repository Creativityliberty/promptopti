"use client"

import { AlertTriangle, Box, Check, LoaderCircle, Puzzle } from "lucide-react"

import { cn } from "@/lib/utils"
import type { CompileState, McpToolDefinition, SkillDefinition } from "./types"

interface SkillThreadProps {
  skills: SkillDefinition[]
  selectedSkillId: string
  compileState: CompileState
  currentSkillId: string | null
  mcpTools: McpToolDefinition[]
  onSelectSkill: (skillId: string) => void
}

export function SkillThread({ skills, selectedSkillId, compileState, currentSkillId, mcpTools, onSelectSkill }: SkillThreadProps) {
  return (
    <section aria-labelledby="skill-thread-title" className="pb-2">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 id="skill-thread-title" className="text-[18px] font-semibold tracking-[-0.025em] text-[#252A26]">
          Assemblage proposé
        </h2>
        <div className="hidden items-center gap-4 text-[10px] font-medium text-[#78817b] sm:flex">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#8db099]" /> Skill
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-dashed border-[#405247]" /> Outil MCP
          </span>
        </div>
      </div>

      <div className="relative overflow-x-auto pb-3 pt-1 scrollbar-none">
        <div className="absolute left-0 right-0 top-[27px] h-px bg-[#80a78d]" aria-hidden="true" />
        <div className="relative flex min-w-max items-center gap-3 px-1">
          <span className="h-3 w-3 shrink-0 rounded-full bg-[#2e6846] ring-4 ring-[#edf3ee]" aria-hidden="true" />
          {skills.map((skill, index) => {
            const selected = selectedSkillId === skill.id
            const currentIndex = currentSkillId ? skills.findIndex((item) => item.id === currentSkillId) : -1
            const active = currentSkillId === skill.id && !["completed", "failed", "idle"].includes(compileState)
            const completed = compileState === "completed" || (currentIndex > -1 && index < currentIndex)

            return (
              <button
                key={skill.id}
                type="button"
                onClick={() => onSelectSkill(skill.id)}
                className={cn(
                  "relative flex h-[54px] items-center gap-2 rounded-[15px] border bg-[#e2ece4] px-3 text-[11px] font-medium text-[#274734] shadow-[0_3px_10px_rgba(35,67,51,0.04)] transition hover:-translate-y-0.5 hover:bg-[#d8e7dc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789985]",
                  selected ? "border-[#234333] ring-1 ring-[#234333]" : "border-[#8eae99]",
                  active && "animate-[softPulse_1.4s_ease-in-out_infinite]",
                )}
              >
                <Puzzle className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />
                {skill.name}
                {active ? (
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#315e43] text-white ring-2 ring-[#F6F4ED]">
                    <LoaderCircle className="h-3 w-3 animate-spin" />
                  </span>
                ) : completed ? (
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#649773] text-white ring-2 ring-[#F6F4ED]">
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                ) : null}
              </button>
            )
          })}

          {mcpTools.map((tool) => (
            <div
              key={`${tool.connectionId}:${tool.name}`}
              title={tool.status === "drifted" ? "Définition modifiée : autorisation suspendue" : tool.description}
              className={cn(
                "relative flex h-[54px] items-center gap-2 rounded-[15px] border border-dashed bg-white/65 px-3 text-[11px] font-medium",
                tool.status === "approved" ? "border-[#294d39] text-[#253a2e]" : "border-[#b47a37] text-[#765022]",
              )}
            >
              {tool.status === "drifted" ? <AlertTriangle className="h-[17px] w-[17px]" /> : <Box className="h-[17px] w-[17px]" strokeWidth={1.8} />}
              {tool.name}
              {tool.status !== "approved" ? <span className="text-[9px]">autorisation requise</span> : null}
            </div>
          ))}
          <span className="h-3 w-3 shrink-0 rounded-full bg-[#2e6846] ring-4 ring-[#edf3ee]" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
