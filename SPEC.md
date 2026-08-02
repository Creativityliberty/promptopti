# Nümtema Intent Studio — Product Contract

## Value proposition

Turn a raw request into a versioned, testable Prompt Pack that can be used by a human, an IDE agent, or an MCP client. The target users are creators, developers, and teams who currently rewrite prompts manually and cannot trace why a result was produced.

Core actions:

1. Compile a raw intention into an `IntentSpec` and a Prompt Pack.
2. Inspect the Nümtema Skills, execution events, tests, model, and provenance.
3. Retrieve or compile missions through authenticated HTTP and MCP tools.

## Why an LLM

Natural language is the native input: describing the desired result is faster than completing a long configuration form. The model extracts implicit intent, proposes missing structure, and generates the pack. It does not provide identity, persistence, permissions, durable execution, or trusted external data; those remain application responsibilities.

## UI overview

- First view: Living Intent Canvas with one intention composer.
- Compile: the UI creates an authenticated mission, then follows persisted workflow state.
- Progress: the Skill thread reflects the real current step and only shows configured MCP tools.
- End state: a versioned Prompt Pack with prompt, variables, tests, score, model, and provenance.
- Advanced integrations: IDEs and assistants use the same backend through MCP.

## Product context

- Frontend: Next.js App Router, React, Tailwind.
- AI: Vercel AI SDK through AI Gateway.
- Durable execution: Workflow SDK on Vercel.
- Persistence: Neon/Postgres with Drizzle.
- Web identity: Clerk; local development may use an explicit development user ID.
- MCP identity: verified Clerk bearer token, with an operator-managed token fallback for non-OAuth IDE clients.
- Constraints: no browser API keys, no fake status/cost/tool, ownership checks on every mission, explicit MCP scopes.

## UX flows

### Compile an intention

1. Enter intention and choose destination/mode/output.
2. Create a persisted mission.
3. Start a durable workflow.
4. Follow mission status and events.
5. Render the persisted Prompt Pack version.

### Inspect a mission

1. Request a mission by ID.
2. Verify ownership.
3. Return mission, events, and latest Prompt Pack.

### Use from an IDE or assistant

1. Authenticate to `/api/mcp`.
2. List Skills, compile an intention, or retrieve a mission.
3. Receive structured MCP content backed by the same services as the web UI.

## MCP tools

- `list_skills`: returns versioned Nümtema Skill manifests.
- `compile_intent`: creates and starts a mission for the authenticated user.
- `get_mission`: returns an owned mission and its latest version.

No MCP view is required: the outputs are compact structured data intended for the host IDE or assistant.
