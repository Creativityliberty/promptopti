"use client"

import {
  CircleHelp,
  LockKeyhole,
  Package,
  Target,
  Trophy,
  UserRound,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { IntentFieldDefinition } from "./types"

interface IntentMapProps {
  fieldOverrides: Partial<Record<IntentFieldDefinition["id"], string>>
  platform: string
  onPlatformChange: (platform: string) => void
  onFieldChange: (id: IntentFieldDefinition["id"], value: string) => void
}

const PLATFORMS = ["Codex", "Claude", "Cursor", "Décide pour moi"]

export function IntentMap({ fieldOverrides, platform, onPlatformChange, onFieldChange }: IntentMapProps) {
  const fields: IntentFieldDefinition[] = [
    {
      id: "objective",
      label: "Objectif",
      value: "Analyser les entreprises locales et identifier les prospects à fort potentiel.",
      state: "understood",
      icon: Target,
    },
    {
      id: "audience",
      label: "Audience",
      value: "Équipes commerciales, consultants et spécialistes de l’acquisition locale.",
      state: "understood",
      icon: UserRound,
    },
    {
      id: "context",
      label: "Contexte",
      value: platform ? `Agent destiné à ${platform}.` : "Sur quelle plateforme cet agent sera-t-il utilisé ?",
      state: platform ? "understood" : "ambiguous",
      icon: CircleHelp,
    },
    {
      id: "constraints",
      label: "Contraintes",
      value: "RGPD, données publiques uniquement, aucune information inventée.",
      state: "neutral",
      icon: LockKeyhole,
    },
    {
      id: "deliverable",
      label: "Livrable",
      value: "Prompt Pack prêt à l’emploi avec variables, outils et tests.",
      state: "neutral",
      icon: Package,
    },
    {
      id: "success",
      label: "Réussite",
      value: "Des leads qualifiés, justifiés et actionnables dès la première itération.",
      state: "neutral",
      icon: Trophy,
    },
  ]

  return (
    <section aria-labelledby="intent-map-title">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 id="intent-map-title" className="text-[18px] font-semibold tracking-[-0.025em] text-[#252A26]">
          Carte d’intention
        </h2>
        <span className="text-[11px] font-medium text-[#718078]">5 éléments compris sur 6</span>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-[#d8dbd4] bg-white/60">
        {fields.map((field) => {
          const Icon = field.icon
          const isContext = field.id === "context"

          return (
            <div key={field.id} className="border-b border-[#e1e2dc] last:border-b-0">
              <div className="grid min-h-[48px] grid-cols-[36px_105px_minmax(0,1fr)] items-center gap-2 px-3 md:grid-cols-[36px_120px_minmax(0,1fr)]">
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-xl",
                    field.state === "ambiguous"
                      ? "bg-[#fff2da] text-[#bf7113]"
                      : field.state === "understood"
                        ? "bg-[#e4eee7] text-[#436f53]"
                        : "bg-[#f2f2ee] text-[#49524d]",
                  )}
                >
                  <Icon className="h-[17px] w-[17px]" strokeWidth={1.8} />
                </span>
                <label htmlFor={`field-${field.id}`} className="text-[12px] font-medium text-[#303733] md:text-[13px]">
                  {field.label}
                </label>
                <input
                  id={`field-${field.id}`}
                  defaultValue={fieldOverrides[field.id] ?? field.value}
                  key={`${field.id}-${fieldOverrides[field.id] ?? field.value}`}
                  onBlur={(event) => onFieldChange(field.id, event.target.value)}
                  className={cn(
                    "h-9 min-w-0 rounded-xl border px-3 text-[12px] text-[#333b36] outline-none transition focus:ring-2 md:text-[13px]",
                    field.state === "understood" && "border-transparent bg-[#e9f1eb] focus:ring-[#9fbaa8]",
                    field.state === "ambiguous" && "border-[#e3a64c] bg-[#fff6e6] focus:ring-[#e5b363]",
                    field.state === "neutral" && "border-transparent bg-[#f3f3ef] focus:bg-white focus:ring-[#bdc9c0]",
                  )}
                />
              </div>

              {isContext ? (
                <div className="mx-3 mb-2 ml-[52px] rounded-[16px] border border-[#e2aa56] bg-[#fffaf0] p-2.5 md:ml-[170px]">
                  <p className="mb-2 text-[12px] font-medium text-[#3c403d]">
                    Sur quelle plateforme cet agent sera-t-il utilisé ?
                  </p>
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    {PLATFORMS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => onPlatformChange(item === "Décide pour moi" ? "Codex" : item)}
                        className={cn(
                          "min-h-8 rounded-xl border px-2 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d99d43]",
                          platform === item
                            ? "border-[#b97317] bg-[#f9e7c3] text-[#65410f]"
                            : "border-[#e1b36d] bg-white/70 text-[#555951] hover:bg-[#fff1d5]",
                        )}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
