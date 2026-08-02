CREATE TABLE IF NOT EXISTS "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "projects_owner_idx" ON "projects" ("owner_id");

CREATE TABLE IF NOT EXISTS "missions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "owner_id" text NOT NULL,
  "intention" text NOT NULL,
  "destination" text NOT NULL,
  "mode" text NOT NULL,
  "output" text NOT NULL,
  "status" text DEFAULT 'queued' NOT NULL,
  "current_skill_id" text,
  "workflow_run_id" text,
  "skill_ids" jsonb NOT NULL,
  "mcp_tool_names" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "error_message" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "missions_owner_created_idx" ON "missions" ("owner_id", "created_at");

CREATE TABLE IF NOT EXISTS "mission_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "mission_id" uuid NOT NULL REFERENCES "missions"("id") ON DELETE CASCADE,
  "status" text NOT NULL,
  "skill_id" text,
  "message" text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "mission_events_mission_created_idx" ON "mission_events" ("mission_id", "created_at");

CREATE TABLE IF NOT EXISTS "prompt_pack_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "mission_id" uuid NOT NULL REFERENCES "missions"("id") ON DELETE CASCADE,
  "version" integer NOT NULL,
  "model" text NOT NULL,
  "score" integer NOT NULL,
  "status" text NOT NULL,
  "intent_spec" jsonb NOT NULL,
  "content" jsonb NOT NULL,
  "provenance" jsonb NOT NULL,
  "token_usage" jsonb,
  "estimated_cost_usd" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "prompt_pack_mission_version_unique" ON "prompt_pack_versions" ("mission_id", "version");
CREATE INDEX IF NOT EXISTS "prompt_pack_mission_created_idx" ON "prompt_pack_versions" ("mission_id", "created_at");

CREATE TABLE IF NOT EXISTS "mcp_connections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "owner_id" text NOT NULL,
  "name" text NOT NULL,
  "url" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "mcp_connections_owner_idx" ON "mcp_connections" ("owner_id");

CREATE TABLE IF NOT EXISTS "mcp_permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "connection_id" uuid NOT NULL REFERENCES "mcp_connections"("id") ON DELETE CASCADE,
  "owner_id" text NOT NULL,
  "tool_name" text NOT NULL,
  "tool_fingerprint" text NOT NULL,
  "scope" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "expires_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "mcp_permission_owner_tool_unique" ON "mcp_permissions" ("owner_id", "connection_id", "tool_name");

