"use client"

import { ChevronLeft, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { NAV_ITEMS, SETTINGS_ITEM } from "./studio-data"

interface NavigationProps {
  activeItem: string
  mobileOpen: boolean
  onClose: () => void
  onSelect: (item: string) => void
}

export function Navigation({ activeItem, mobileOpen, onClose, onSelect }: NavigationProps) {
  const renderItem = ({ label, icon: Icon }: (typeof NAV_ITEMS)[number] | typeof SETTINGS_ITEM) => {
    const selected = activeItem === label

    return (
      <button
        key={label}
        type="button"
        onClick={() => {
          onSelect(label)
          onClose()
        }}
        className={cn(
          "group flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-[14px] font-medium text-[#4c554f] outline-none transition focus-visible:ring-2 focus-visible:ring-[#789985]",
          selected ? "bg-[#DCE8DF] text-[#234333]" : "hover:bg-white/70 hover:text-[#234333]",
        )}
        aria-current={selected ? "page" : undefined}
      >
        <Icon className="h-[19px] w-[19px] shrink-0" strokeWidth={1.8} />
        <span>{label}</span>
      </button>
    )
  }

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Fermer la navigation"
          className="fixed inset-0 z-40 bg-[#17221c]/20 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col border-r border-[#dcded7] bg-[#F6F4ED] px-3 py-5 transition-transform duration-300 md:static md:z-auto md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Navigation principale"
      >
        <div className="mb-7 flex h-11 items-center justify-between px-2">
          <div className="flex items-center gap-2.5 text-[#234333]">
            <span className="font-serif text-[40px] leading-none">N</span>
            <span className="text-[20px] font-semibold tracking-[-0.04em]">Nümtema</span>
          </div>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-xl text-[#59625c] hover:bg-white md:hidden"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1.5">{NAV_ITEMS.map(renderItem)}</nav>

        <div className="mt-auto border-t border-[#dcddd6] pt-4">
          {renderItem(SETTINGS_ITEM)}
          <button
            type="button"
            className="mt-2 hidden h-10 w-full items-center justify-center gap-2 rounded-xl text-xs font-medium text-[#7a827d] transition hover:bg-white md:flex"
          >
            <ChevronLeft className="h-4 w-4" />
            Réduire le menu
          </button>
        </div>
      </aside>
    </>
  )
}
