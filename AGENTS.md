# AGENTS.md — Nümtema Intent Studio

## Mission

Construire un compilateur d’intention, pas un simple allongeur de prompts. Chaque changement doit rapprocher le produit du flux :

```text
Intention → Intent Spec → Skills/MCP → Workflow durable → Prompt Pack → Évaluation
```

## Principes non négociables

- Le Studio reste calme et accessible ; les détails techniques appartiennent au mode avancé.
- Les Skills Nümtema doivent rester visibles, inspectables, versionnés et testables.
- Un outil MCP est visuellement et sémantiquement distinct d’un Skill.
- Aucun faux statut, faux coût, faux workflow ou faux analytics.
- Aucune clé API stockée ou transmise par le navigateur.
- Toute permission sensible propose : refuser, autoriser une fois, autoriser pour le projet.
- Les sorties centrales utilisent des schémas typés et des critères d’acceptation.
- Le backend futur doit avoir une seule orchestration, jamais plusieurs moteurs concurrents.

## Architecture actuelle

- `app/page.tsx` monte le Studio avec le registre serveur comme source unique des Skills.
- `components/intent-studio/intent-studio.tsx` possède l’orchestration d’interface.
- Chaque région majeure possède son composant.
- `lib/contracts.ts` définit les frontières publiques Zod.
- `lib/skills/registry.ts` est la source unique des manifestes Nümtema.
- `lib/db/` contient le schéma et les accès Postgres avec contrôle de propriété.
- `workflows/compile-intent.ts` est l’unique orchestration durable.
- `app/api/mcp/route.ts` expose les outils IDE ; `lib/mcp/client.ts` découvre les serveurs sortants.
- `legacy-v0/` est une archive de référence et ne doit jamais être importée dans le produit actif.

## Qualité

Avant livraison :

```bash
pnpm build
```

Vérifier au minimum :

- viewport desktop `1536 × 1024` ;
- viewport mobile `390 × 844` ;
- absence de débordement horizontal ;
- ouverture de la palette `Ctrl/Cmd + K` ;
- sélection d’un Skill et mise à jour de l’inspecteur ;
- sélection de la plateforme ;
- compilation et apparition du Prompt Pack ;
- respect de `prefers-reduced-motion`.

## Backend actif

Ne pas contourner `startCompilation`, ne jamais appeler le workflow directement et ne jamais introduire de stockage en mémoire pour une mission. Une nouvelle intégration doit conserver les contrats, l’identité propriétaire, les événements persistés et la vérification des permissions MCP.
