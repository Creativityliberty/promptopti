"use client"

import {
  CheckCircle2,
  ChevronDown,
  FolderClosed,
  Menu,
  PanelRightOpen,
  PlugZap,
  Search,
} from "lucide-react"
import { useEffect, useState } from "react"

interface TopbarProps {
  inspectorOpen: boolean
  onOpenCommand: () => void
  onOpenInspector: () => void
  onOpenNavigation: () => void
}

export function Topbar({ inspectorOpen, onOpenCommand, onOpenInspector, onOpenNavigation }: TopbarProps) {
  const [backendReady, setBackendReady] = useState(false)

  useEffect(() => {
    let active = true
    void fetch("/api/system/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((status: { auth?: boolean; database?: boolean; gateway?: boolean }) => {
        if (active) setBackendReady(Boolean(status.auth && status.database && status.gateway))
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [])

  return (
    <header className="flex min-h-[76px] items-center gap-2 border-b border-[#dedfd9] px-4 md:px-6">
      <button
        type="button"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#d6d9d2] bg-white/70 text-[#34423a] md:hidden"
        onClick={onOpenNavigation}
        aria-label="Ouvrir la navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <button
        type="button"
        className="flex h-11 min-w-0 items-center gap-2 rounded-xl border border-[#d6d9d2] bg-white/60 px-3 text-[13px] font-medium text-[#252A26] transition hover:bg-white md:min-w-[270px] md:text-[14px]"
      >
        <FolderClosed className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
        <span className="truncate">Site de prospection locale</span>
        <ChevronDown className="ml-auto h-4 w-4 shrink-0" />
      </button>

      <button
        type="button"
        className="hidden h-11 items-center gap-2 rounded-xl border border-[#d6d9d2] bg-white/60 px-3 text-[13px] font-medium text-[#252A26] transition hover:bg-white sm:flex"
      >
        v1.0
        <ChevronDown className="h-4 w-4" />
      </button>

      <div className="ml-1 hidden items-center gap-2 text-[13px] font-medium text-[#5d7f6a] lg:flex">
        <CheckCircle2 className="h-[18px] w-[18px]" />
        Enregistré
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-xl border border-[#d6d9d2] bg-white/60 text-[#26332b] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789985]"
          onClick={onOpenCommand}
          aria-label="Ouvrir la palette de commandes"
          title="Rechercher — Ctrl K"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>

        <div className="hidden h-11 items-center gap-2 rounded-xl border border-[#d6d9d2] bg-white/60 px-3 text-[12px] font-medium text-[#425048] lg:flex">
          <PlugZap className={`h-[17px] w-[17px] ${backendReady ? "text-[#5d9870]" : "text-[#b17936]"}`} />
          {backendReady ? "Backend connecté" : "Configuration requise"}
        </div>

        {!inspectorOpen ? (
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-xl border border-[#d6d9d2] bg-white/60 text-[#26332b] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789985]"
            onClick={onOpenInspector}
            aria-label="Ouvrir l’inspecteur"
          >
            <PanelRightOpen className="h-[18px] w-[18px]" />
          </button>
        ) : null}

        <button
          type="button"
          aria-label="Ouvrir le profil"
          className="grid h-10 w-10 place-items-center rounded-full bg-[#234333] text-[13px] font-semibold text-white shadow-sm ring-4 ring-white/70"
        >
          N
        </button>
      </div>
    </header>
  )
}
