import {
  Activity,
  Boxes,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  CircleGauge,
  PackageCheck,
  Puzzle,
  Settings2,
  Sparkles,
  Wrench,
} from "lucide-react"

import type { SkillDefinition } from "./types"

export const NAV_ITEMS = [
  { label: "Studio", icon: Sparkles },
  { label: "Missions", icon: BriefcaseBusiness },
  { label: "Prompt Packs", icon: PackageCheck },
  { label: "Skills", icon: Puzzle },
  { label: "MCP Hub", icon: Boxes },
  { label: "Évaluations", icon: ChartNoAxesCombined },
  { label: "Activité", icon: Activity },
] as const

export const SETTINGS_ITEM = { label: "Paramètres", icon: Settings2 } as const

export const LEGACY_UI_SKILLS: SkillDefinition[] = [
  {
    id: "intent-decoder",
    name: "intent-decoder",
    version: "1.0.0",
    summary: "Décode la demande brute, les implicites et le résultat réellement attendu.",
    inputs: ["Demande brute", "Contexte disponible", "Destination pressentie"],
    outputs: ["Intent Spec", "Ambiguïtés prioritaires", "Hypothèses explicites"],
    permissions: [
      { label: "Lecture fichiers", state: "allowed" },
      { label: "Accès web", state: "ask" },
      { label: "Écriture fichiers", state: "ask" },
    ],
  },
  {
    id: "context-collector",
    name: "context-collector",
    version: "1.0.0",
    summary: "Rassemble uniquement le contexte qui modifie réellement la qualité de la mission.",
    inputs: ["Intent Spec", "Documents joints", "Sources autorisées"],
    outputs: ["Contexte consolidé", "Sources et preuves", "Manques critiques"],
    permissions: [
      { label: "Lecture fichiers", state: "allowed" },
      { label: "Accès web", state: "allowed" },
      { label: "Écriture fichiers", state: "ask" },
    ],
  },
  {
    id: "mission-spec-compiler",
    name: "mission-spec-compiler",
    version: "1.0.0",
    summary: "Transforme l’intention et le contexte en spécification de mission structurée et exécutable par l’agent.",
    inputs: ["Intention structurée", "Contexte et contraintes", "Audience définie"],
    outputs: ["Spécification de mission (JSON)", "Critères de réussite", "Plan d’exécution proposé"],
    permissions: [
      { label: "Accès web", state: "allowed" },
      { label: "Lecture fichiers", state: "allowed" },
      { label: "Écriture fichiers", state: "ask" },
      { label: "Exécution de code", state: "ask" },
    ],
  },
  {
    id: "verifier",
    name: "verifier",
    version: "1.0.0",
    summary: "Vérifie la clarté, la complétude et la testabilité du Prompt Pack produit.",
    inputs: ["Prompt Pack", "Critères d’acceptation", "Cas de test"],
    outputs: ["Score qualité", "Écarts observés", "Décision de validation"],
    permissions: [
      { label: "Lecture fichiers", state: "allowed" },
      { label: "Exécution de code", state: "allowed" },
    ],
  },
  {
    id: "repair-loop",
    name: "repair-loop",
    version: "1.0.0",
    summary: "Répare les écarts détectés, puis soumet la nouvelle version à une vérification ciblée.",
    inputs: ["Prompt Pack", "Écarts vérifiés", "Budget d’itération"],
    outputs: ["Prompt Pack réparé", "Journal des changements", "Score final"],
    permissions: [
      { label: "Écriture fichiers", state: "allowed" },
      { label: "Exécution de code", state: "allowed" },
    ],
  },
]

export const INITIAL_INTENT =
  "Créer un agent qui analyse les entreprises locales, identifie les prospects à fort potentiel et prépare une approche personnalisée."

export const COMPILE_STEPS = [
  { state: "analyzing" as const, label: "Décodage de l’intention", icon: CircleGauge },
  { state: "compiling" as const, label: "Compilation du Prompt Pack", icon: Wrench },
]
