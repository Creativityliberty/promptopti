"use client"

import { Database, FilePenLine, Globe2, Puzzle, TerminalSquare, X } from "lucide-react"

import { cn } from "@/lib/utils"
import type { SkillDefinition } from "./types"

interface SkillInspectorProps {
  open: boolean
  skill: SkillDefinition
  onClose: () => void
}

const PERMISSION_ICONS = {
  "Accès web": Globe2,
  "Lecture fichiers": Database,
  "Écriture fichiers": FilePenLine,
  "Exécution de code": TerminalSquare,
}

export function SkillInspector({ open, skill, onClose }: SkillInspectorProps) {
  if (!open) return null

  return (
    <aside
      className="fixed inset-y-0 right-0 z-40 flex w-[min(340px,calc(100vw-24px))] flex-col border-l border-[#d8dad4] bg-[#F8F7F1] shadow-[-18px_0_50px_rgba(35,45,39,0.10)] xl:static xl:z-auto xl:w-[310px] xl:shadow-none"
      aria-label="Inspecteur du Skill"
    >
      <div className="flex items-start gap-3 border-b border-[#dcded7] px-4 py-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#dfe9e1] text-[#315b41]">
          <Puzzle className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="truncate text-[12px] font-semibold text-[#222a25]">{skill.name}</h2>
          <p className="mt-1 text-[11px] font-medium text-[#748079]">Skill Nümtema</p>
        </div>
        <button
          type="button"
          className="ml-auto grid h-9 w-9 place-items-center rounded-xl text-[#626c66] transition hover:bg-white hover:text-[#24352b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789985]"
          onClick={onClose}
          aria-label="Fermer l’inspecteur"
        >
          <X className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-7">
        <InspectorSection title="Pourquoi ce Skill">
          <p className="text-[12px] leading-5 text-[#5b625e]">{skill.summary}</p>
        </InspectorSection>

        <InspectorSection title="Entrée">
          <ul className="space-y-1.5 text-[12px] text-[#5b625e]">
            {skill.inputs.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#708177]" />
                {item}
              </li>
            ))}
          </ul>
        </InspectorSection>

        <InspectorSection title="Sortie">
          <ul className="space-y-1.5 text-[12px] text-[#5b625e]">
            {skill.outputs.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#708177]" />
                {item}
              </li>
            ))}
          </ul>
        </InspectorSection>

        <InspectorSection title="Permissions" border={false}>
          <div className="space-y-2.5">
            {skill.permissions.map((permission) => {
              const Icon = PERMISSION_ICONS[permission.label as keyof typeof PERMISSION_ICONS] ?? Database

              return (
                <div key={permission.label} className="flex items-center gap-2 text-[11px]">
                  <Icon className="h-[16px] w-[16px] text-[#34473b]" strokeWidth={1.8} />
                  <span className="text-[#4e5751]">{permission.label}</span>
                  <span
                    className={cn(
                      "ml-auto font-medium",
                      permission.state === "allowed" ? "text-[#397050]" : "text-[#8a6732]",
                    )}
                  >
                    {permission.state === "allowed" ? "Autorisé" : "Demander"}
                  </span>
                </div>
              )
            })}
          </div>
        </InspectorSection>
      </div>

      <div className="border-t border-[#dedfd9] p-4">
        <button
          type="button"
          className="h-10 w-full rounded-xl border border-[#cfd3cc] bg-white/70 text-[11px] font-medium text-[#4c554f] transition hover:bg-white"
        >
          Voir le manifeste du Skill
        </button>
      </div>
    </aside>
  )
}

function InspectorSection({
  title,
  border = true,
  children,
}: {
  title: string
  border?: boolean
  children: React.ReactNode
}) {
  return (
    <section className={cn("py-5", border && "border-b border-[#dedfd9]")}>
      <h3 className="mb-3 text-[14px] font-semibold tracking-[-0.02em] text-[#252b27]">{title}</h3>
      {children}
    </section>
  )
}
