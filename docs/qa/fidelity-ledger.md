# Fidelity ledger — Living Intent Canvas

Référence : `docs/reference/intent-studio-concept.png`  
Rendu : `docs/qa/intent-studio-desktop.png`  
Viewport natif vérifié : `1536 × 1024`  
Viewport mobile vérifié : `390 × 844`

| Point contrôlé | Référence | Rendu | Décision |
|---|---|---|---|
| Hiérarchie | rail, topbar, canevas, inspecteur, dock | même structure et même ordre | conforme |
| Copie centrale | titre, intention, champs, clarification | chaînes principales identiques | conforme |
| Palette | ivoire, forêt, sauge, ambre, graphite | tokens et usages sémantiques correspondants | conforme |
| Conteneurs | canevas ouvert, carte structurée, dock flottant | aucune grille de cartes ajoutée | conforme |
| Fil vivant | Skills remplis, MCP contouré | distinction et connexion conservées | conforme |
| Inspecteur | raison, entrée, sortie, permissions | contenu dynamique selon le Skill sélectionné | conforme et fonctionnel |
| Dock | destination, mode, sortie, compilation | visible sans recouvrir le Fil vivant | écart corrigé |
| Typographie | sans arrondie Poppins | Poppins 400/500/600 embarquée et métriques ajustées | conforme |
| Mobile | non montré dans la référence | rail escamotable, dock compact, aucun overflow | extension cohérente |
| Mouvement | transitions calmes liées aux états | pulse d’exécution et reveal du résultat, reduced-motion respecté | conforme |

## Diff de copie au-dessus de la ligne de flottaison

Les chaînes fonctionnelles centrales sont conservées. Deux libellés ont été précisés volontairement :

- `Skill` devient `Skill Nümtema` dans l’inspecteur pour identifier clairement le registre ;
- `Voir la documentation` devient `Voir le manifeste du Skill`, formulation plus exacte pour la future architecture.

Le compteur `5 éléments compris sur 6` explicite l’état de compréhension déjà représenté visuellement en sauge et ambre. Aucun claim commercial, KPI ou badge décoratif n’a été ajouté.

## Validation fonctionnelle

- palette de commandes ouverte par `Ctrl/Cmd + K` ;
- sélection de `verifier` reflétée dans l’inspecteur ;
- sélection `Cursor` propagée au dock ;
- compilation locale terminée en `Prompt Pack v0.5` ;
- vues Prompt, Variables et Tests disponibles ;
- navigation mobile ouverte ;
- zéro erreur console et zéro réponse HTTP en erreur pendant le parcours ;
- absence de débordement horizontal sur desktop et mobile.
