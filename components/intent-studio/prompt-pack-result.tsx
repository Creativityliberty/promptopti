"use client"

import { Check, Clipboard, FileJson2, FlaskConical, SlidersHorizontal } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"
import type { PromptPackDefinition } from "./types"

interface PromptPackResultProps {
  promptPack: PromptPackDefinition
  onRecompile: () => void
}

const TABS = ["Prompt", "Variables", "Tests"] as const

export function PromptPackResult({ promptPack, onRecompile }: PromptPackResultProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Prompt")
  const [copied, setCopied] = useState(false)

  async function copyPrompt() {
    await navigator.clipboard.writeText(`${promptPack.system}\n\n${promptPack.user}`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <section className="animate-[revealUp_420ms_ease-out] rounded-[22px] border border-[#cbd7ce] bg-[#f7faf7] p-4 md:p-5" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[#315e43]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#dceadf]">
              <FileJson2 className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-[#243029]">Prompt Pack v{promptPack.version}</h2>
              <p className="text-[10px] font-medium text-[#718078]">{promptPack.model} · score {promptPack.score}/100 · {promptPack.status}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRecompile}
            className="h-9 rounded-xl border border-[#cfd7d1] bg-white px-3 text-[11px] font-medium text-[#435048] transition hover:bg-[#edf3ee]"
          >
            Réparer
          </button>
          <button
            type="button"
            onClick={copyPrompt}
            className="flex h-9 items-center gap-2 rounded-xl bg-[#234333] px-3 text-[11px] font-medium text-white transition hover:bg-[#193529]"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
            {copied ? "Copié" : "Copier"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-1 border-b border-[#d9e0da]" role="tablist" aria-label="Contenu du Prompt Pack">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "relative px-3 pb-2.5 text-[11px] font-medium text-[#737c76] transition hover:text-[#234333]",
              activeTab === tab && "text-[#234333] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[#234333]",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {activeTab === "Prompt" ? (
          <div className="grid gap-3 lg:grid-cols-2">
            <ResultBlock label="Prompt système" icon={SlidersHorizontal} value={promptPack.system} />
            <ResultBlock label="Prompt utilisateur" icon={FileJson2} value={promptPack.user} />
          </div>
        ) : null}

        {activeTab === "Variables" ? (
          <div className="divide-y divide-[#e1e5e1] rounded-[16px] border border-[#dde3de] bg-white/70 px-3">
            {promptPack.variables.map((variable) => (
              <div key={variable.name} className="grid gap-1 py-3 sm:grid-cols-[150px_1fr]">
                <code className="text-[11px] font-semibold text-[#336047]">{variable.name}</code>
                <span className="text-[11px] text-[#5f6862]">{variable.value || variable.description}{variable.required ? " · requis" : ""}</span>
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "Tests" ? (
          <div className="space-y-2">
            {promptPack.tests.map((test) => (
              <div key={test} className="flex items-start gap-2 rounded-[14px] border border-[#dde3de] bg-white/70 p-3 text-[11px] leading-5 text-[#525d56]">
                <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-[#4c7b5d]" />
                {test}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function ResultBlock({ label, value, icon: Icon }: { label: string; value: string; icon: typeof FileJson2 }) {
  return (
    <div className="rounded-[16px] border border-[#dde3de] bg-white/75 p-3.5">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6e7c73]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="text-[11px] leading-5 text-[#4c5650]">{value}</p>
    </div>
  )
}
