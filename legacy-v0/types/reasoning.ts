export interface ReasoningData {
  exp?: string[]
  se?: Array<{
    domain: string
    subdomains: string[]
  }>
  wm?: {
    g: string
    sg: string
    pr: {
      completed: string[]
      current: string[]
    }
    ctx: string
  }
  kg?: {
    tri: Array<{
      sub: string
      pred: string
      obj: string
    }>
  }
  logic?: {
    propos: Array<{
      symb: string
      nl: string
    }>
    proofs: Array<{
      symb: string
      nl: string
    }>
    crits: Array<{
      symb: string
      nl: string
    }>
    doubts: Array<{
      symb: string
      nl: string
    }>
  }
  chain?: {
    steps: Array<{
      index: number
      depends_on: number[]
      description: string
      prompt: string
    }>
    reflect: string
    err?: Array<{
      msg: string
      reversibility?: {
        level: "faible" | "modérée" | "forte"
        repairable: boolean
        action: string
      }
    }>
    note?: string[]
    warn?: string[]
  }
  graph_view?: {
    nodes: Array<{
      id: string
      label: string
      type: string
      metadata?: any
    }>
    edges: Array<{
      from: string
      to: string
      relation: string
    }>
  }
  prompt_templates?: {
    template_id: string
    text: string
    variables: string[]
    example_substitution?: Record<string, string>
    mode?: "dry-run" | "interactive" | "test" | "final"
    persona?: string
    permissions?: {
      allowed_roles: string[]
      restricted_vars: string[]
    }
    history?: Array<{
      timestamp: string
      input_snapshot: any
      output: string
      feedback: "positif" | "neutre" | "négatif"
      goal_alignment_score: number
    }>
    type?: "instruction" | "exploration" | "diagnostic" | "simulation" | "meta" | "debug"
  }
}
