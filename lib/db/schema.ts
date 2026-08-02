import { relations } from "drizzle-orm"
import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("projects_owner_idx").on(table.ownerId)],
)

export const missions = pgTable(
  "missions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    ownerId: text("owner_id").notNull(),
    intention: text("intention").notNull(),
    destination: text("destination").notNull(),
    mode: text("mode").notNull(),
    output: text("output").notNull(),
    status: text("status").notNull().default("queued"),
    currentSkillId: text("current_skill_id"),
    workflowRunId: text("workflow_run_id"),
    skillIds: jsonb("skill_ids").$type<string[]>().notNull(),
    mcpToolNames: jsonb("mcp_tool_names").$type<string[]>().notNull().default([]),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("missions_owner_created_idx").on(table.ownerId, table.createdAt)],
)

export const missionEvents = pgTable(
  "mission_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    missionId: uuid("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    skillId: text("skill_id"),
    message: text("message").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("mission_events_mission_created_idx").on(table.missionId, table.createdAt)],
)

export const promptPackVersions = pgTable(
  "prompt_pack_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    missionId: uuid("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    model: text("model").notNull(),
    score: integer("score").notNull(),
    status: text("status").notNull(),
    intentSpec: jsonb("intent_spec").$type<Record<string, unknown>>().notNull(),
    content: jsonb("content").$type<Record<string, unknown>>().notNull(),
    provenance: jsonb("provenance").$type<Record<string, unknown>>().notNull(),
    tokenUsage: jsonb("token_usage").$type<Record<string, unknown>>(),
    estimatedCostUsd: text("estimated_cost_usd"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("prompt_pack_mission_version_unique").on(table.missionId, table.version),
    index("prompt_pack_mission_created_idx").on(table.missionId, table.createdAt),
  ],
)

export const mcpConnections = pgTable(
  "mcp_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    ownerId: text("owner_id").notNull(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("mcp_connections_owner_idx").on(table.ownerId)],
)

export const mcpPermissions = pgTable(
  "mcp_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    connectionId: uuid("connection_id").notNull().references(() => mcpConnections.id, { onDelete: "cascade" }),
    ownerId: text("owner_id").notNull(),
    toolName: text("tool_name").notNull(),
    toolFingerprint: text("tool_fingerprint").notNull(),
    scope: text("scope").notNull(),
    status: text("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("mcp_permission_owner_tool_unique").on(table.ownerId, table.connectionId, table.toolName)],
)

export const projectRelations = relations(projects, ({ many }) => ({ missions: many(missions) }))
export const missionRelations = relations(missions, ({ one, many }) => ({
  project: one(projects, { fields: [missions.projectId], references: [projects.id] }),
  events: many(missionEvents),
  promptPacks: many(promptPackVersions),
}))

