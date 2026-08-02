import type { LucideIcon } from "lucide-react"

export type CompileState = "idle" | "queued" | "analyzing" | "compiling" | "verifying" | "repairing" | "completed" | "failed"

export type PermissionState = "allowed" | "ask"

export interface PermissionDefinition {
  label: string
  state: PermissionState
}

export interface SkillDefinition {
  id: string
  name: string
  version: string
  summary: string
  inputs: string[]
  outputs: string[]
  permissions: PermissionDefinition[]
}

export interface IntentFieldDefinition {
  id: "objective" | "audience" | "context" | "constraints" | "deliverable" | "success"
  label: string
  value: string
  state: "understood" | "ambiguous" | "neutral"
  icon: LucideIcon
}

export interface PromptPackDefinition {
  id: string
  version: number
  model: string
  score: number
  status: "verified" | "repaired" | "needs_review"
  system: string
  user: string
  variables: Array<{ name: string; value: string; description: string; required: boolean }>
  tests: string[]
  provenance: {
    skillIds: string[]
    mcpToolNames: string[]
    workflowRunId: string | null
  }
}

export interface McpToolDefinition {
  connectionId: string
  connectionName: string
  name: string
  description: string
  fingerprint: string
  status: "approved" | "approval_required" | "drifted"
}
