"use client"

import { ArrowUpRight, Link2, Mic, Paperclip } from "lucide-react"

interface IntentComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}

export function IntentComposer({ value, onChange, onSubmit }: IntentComposerProps) {
  return (
    <section aria-labelledby="intent-title">
      <h1
        id="intent-title"
        className="max-w-[760px] text-[28px] font-semibold leading-[1.15] tracking-[-0.04em] text-[#252A26] md:text-[31px]"
      >
        Que veux-tu rendre clair et exécutable ?
      </h1>

      <div className="mt-5 rounded-[22px] border-2 border-[#2b563f] bg-white/75 p-3 shadow-[0_12px_45px_rgba(35,67,51,0.05)] transition focus-within:border-[#234333] focus-within:shadow-[0_15px_55px_rgba(35,67,51,0.09)]">
        <label htmlFor="intent-input" className="sr-only">
          Intention à compiler
        </label>
        <textarea
          id="intent-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-[125px] w-full resize-none bg-transparent px-1 text-[17px] leading-7 text-[#222824] outline-none placeholder:text-[#858b86] md:min-h-[76px]"
          placeholder="Décris ce que tu veux obtenir, pour qui et dans quel contexte…"
        />

        <div className="flex items-center gap-1.5">
          <ComposerAction label="Joindre un fichier">
            <Paperclip />
          </ComposerAction>
          <ComposerAction label="Dicter l’intention">
            <Mic />
          </ComposerAction>
          <ComposerAction label="Ajouter une URL">
            <Link2 />
          </ComposerAction>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!value.trim()}
            className="ml-auto grid h-11 w-11 place-items-center rounded-[14px] bg-[#234333] text-white shadow-[0_8px_20px_rgba(35,67,51,0.22)] transition hover:-translate-y-0.5 hover:bg-[#193529] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789985] focus-visible:ring-offset-2 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Analyser l’intention"
          >
            <ArrowUpRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mx-auto h-5 w-px bg-[#89a994]" aria-hidden="true">
        <span className="block h-2 w-2 -translate-x-[3.5px] translate-y-4 rounded-full bg-[#6f947c]" />
      </div>
    </section>
  )
}

function ComposerAction({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="grid h-10 w-10 place-items-center rounded-xl text-[#46514a] transition hover:bg-[#edf1ec] hover:text-[#234333] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789985] [&_svg]:h-[18px] [&_svg]:w-[18px]"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}
