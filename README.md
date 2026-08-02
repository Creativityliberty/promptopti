# Nümtema Intent Studio

Nümtema Intent Studio transforme une intention brute en `IntentSpec`, puis en Prompt Pack versionné, vérifié et exploitable depuis le Studio ou un IDE compatible MCP.

## Sprint Backend 01

La tranche verticale active comprend :

- Living Intent Canvas relié aux vraies routes ;
- contrat `IntentSpec` et `PromptPack` validé par Zod ;
- registre unique de 9 Skills Nümtema versionnés ;
- AI SDK 7 et AI Gateway avec modèles de secours, attribution utilisateur et tags ;
- Workflow SDK durable : 1 workflow, 9 étapes compilées ;
- persistance Neon/Postgres via Drizzle ;
- mission créée avant tout appel LLM ;
- événements, statut courant, erreurs et versions persistés ;
- authentification Clerk et contrôle de propriété ;
- serveur MCP authentifié : `list_skills`, `compile_intent`, `get_mission` ;
- client MCP sortant avec HTTPS, liste blanche et empreinte de définition ;
- détection des outils nouveaux ou modifiés avant autorisation ;
- aucun secret fournisseur dans le navigateur ;
- aucun workflow, coût ou outil simulé dans l’application active.

## Lancer en local

Prérequis : Node.js 22+ et pnpm.

```bash
cp .env.example .env.local
pnpm install
pnpm db:migrate
pnpm dev
```

Pour le développement sans Clerk, définir explicitement :

```env
NUMTEMA_DEV_USER_ID=dev_user
```

Le mode production refuse ce raccourci.

## Variables indispensables

- `DATABASE_URL` : connexion Neon/Postgres ;
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` et `CLERK_SECRET_KEY` : identité web ;
- AI Gateway : `VERCEL_OIDC_TOKEN` est provisionné automatiquement sur Vercel, sinon utiliser `AI_GATEWAY_API_KEY` ;
- `NUMTEMA_MCP_TOKEN` et `NUMTEMA_MCP_USER_ID` : solution de repli pour les IDE ne prenant pas encore en charge un JWT Clerk ;
- `CLERK_ISSUER_URL` : métadonnées OAuth du serveur MCP.

Voir [.env.example](./.env.example) pour les modèles, fallbacks et connexions MCP sortantes.

## API

| Route | Rôle |
|---|---|
| `POST /api/intents/compile` | Persiste puis lance une mission durable |
| `GET /api/missions` | Liste les missions de l’utilisateur |
| `GET /api/missions/:id` | Retourne statut, événements et dernière version |
| `GET /api/skills` | Retourne les manifestes versionnés |
| `GET /api/mcp/tools` | Découvre les outils MCP configurés et vérifie leur empreinte |
| `GET/POST /api/mcp` | Serveur MCP Streamable HTTP |
| `GET /api/system/status` | État de configuration sans exposer de secret |

## Base de données

La migration initiale se trouve dans `drizzle/0000_intent_studio.sql` et crée :

- `projects` ;
- `missions` ;
- `mission_events` ;
- `prompt_pack_versions` ;
- `mcp_connections` ;
- `mcp_permissions`.

## Vérifications

```bash
pnpm test
pnpm lint
pnpm build
pnpm audit --prod
```

État du livrable : 9 tests passent, le typage strict passe, le build Next.js 16.2.12 compile le workflow, et l’audit de dépendances de production ne signale aucune vulnérabilité connue.

## Sécurité

- secrets uniquement côté serveur ;
- propriété vérifiée sur chaque projet et mission ;
- mission persistée avant génération ;
- validation structurée des sorties LLM ;
- autorisations MCP limitées par portée ;
- outils MCP identifiés par empreinte de nom, description et schémas ;
- redirections MCP refusées par défaut ;
- connexions MCP distantes limitées à HTTPS en production ;
- ancienne implémentation conservée sous `legacy-v0/` et jamais importée.
