# Rapport d'état — Vague 4 : Qualité & fiabilité frontend

**Date de création** : 27 juillet 2026  
**Source auditée** : `docs/audits/PHASE_11_FRONTEND_QUALITE.md`  
**Périmètre** : fiabilité structurelle, sécurité, performance, accessibilité et branding du frontend React (`frontend/src/`)  
**Statut de la vague** : 🟡 **En cours d'initialisation** — fiches créées, aucun chantier terminé à ce jour

---

## Résumé exécutif

L'audit Phase 11 a établi que la **couverture fonctionnelle frontend est complète** (18 features câblées, zéro donnée simulée, zéro écran vide) mais que **5 lacunes structurelles** ramènent le score de qualité à 6,5/10, bloquant la mise en production sans risque réel.

La Vague 4 cible exclusivement ces lacunes. Elle ne touche **aucune fonctionnalité métier** — son périmètre est strictement limité à la fiabilité, la sécurité, la performance, l'accessibilité et l'identité visuelle du frontend.

Les Vagues 1 (bloquants backend), 2 (importants backend), 3 (interfaces manquantes) sont intégralement terminées : CH-001 à CH-027 sont tous au statut `terminé`.

---

## Tableau de bord Vague 4

| ID | Titre court | Priorité | Effort | Statut | Dépendances |
|---|---|---|---|---|---|
| CH-031 | ErrorBoundary global | 🔴 P0 | 2h | à faire | — |
| CH-035 | Branding (title / lang / favicon) | 🔴 P0 | 1h | à faire | — |
| CH-034 | Tokens JWT → cookies httpOnly | 🔴 P0 | ~1 sprint | à faire | — |
| CH-032 | Code splitting React.lazy | 🟠 P1 | ½ journée | à faire | — |
| CH-028 | Composants UI manquants (tabs, file-upload, diff-viewer) | 🟠 P1 | 2–3 jours | à faire | — |
| CH-029 | Composant `<DataTable>` partagé | 🟠 P1 | 1 jour | à faire | CH-028 |
| CH-030 | Composant `<Toast>` / feedback inline | 🟠 P1 | ½ journée | à faire | CH-028 |
| CH-033 | Accessibilité aria / focus management | 🟡 P2 | continu | à faire | — |
| CH-036 | Tests frontend Vitest + Testing Library | 🟡 P2 | long terme | reporté assumé | CH-031 |

**Avancement Vague 4** : 0 / 9 terminés (0 %)  
**Bloquants P0 terminés** : 0 / 3

---

## Détail des priorités

### 🔴 P0 — À traiter avant toute recette utilisateur réelle

**CH-031 — ErrorBoundary global**  
Une exception de rendu dans n'importe quel onglet provoque un écran blanc complet. Toute l'application tombe, pas seulement l'onglet concerné. Effort minimal (2h), impact maximal — c'est le premier chantier à traiter.

**CH-035 — Branding**  
`<title>frontend</title>` (valeur Vite par défaut), `<html lang="en">` alors que l'UI est 100 % française, favicon shadcn générique. Le logo officiel existe déjà en `frontend/src/assets/brand/logo-makarim-source.jpg` mais n'est câblé nulle part. Effort : 1h.

**CH-034 — Tokens JWT → cookies httpOnly**  
`token-storage.ts` stocke access token ET refresh token en clair dans `localStorage`. Toute injection XSS peut exfiltrer les deux jetons. Migration vers cookies httpOnly/SameSite=Strict. Effort : ~1 sprint (coordination backend/frontend). Référencé RD-016 — jamais résolu.

### 🟠 P1 — À traiter avant go-live

**CH-032 — Code splitting React.lazy**  
`App.tsx` importe 18 features en top-level statique (0 occurrence de `React.lazy`). Tout utilisateur télécharge les chunks RH, channel-manager, audit et OCR même s'il n'y accède jamais. Lazy-load par onglet = ½ journée de refactoring.

**CH-028 / CH-029 / CH-030 — Composants UI manquants**  
`components/ui/` ne contient que 6 primitives. Manquent : `tabs`, `file-upload`, `diff-viewer` (CH-028), `DataTable` partagé (CH-029), `Toast`/feedback inline (CH-030). Conséquences visibles aujourd'hui : `AuditPage` affiche les diffs via `<pre>{JSON.stringify(...)}</pre>`, `DocumentOcrPage` utilise un `<input type="file">` brut sans zone de dépôt, `StockPage` simule des onglets via `useState` + boutons ad hoc.

### 🟡 P2 — Amélioration continue

**CH-033 — Accessibilité**  
2 fichiers sur 38 `.tsx` utilisent un attribut `aria-*`, 0 utilise `role=`, aucun plugin `eslint-plugin-jsx-a11y`. Aucune gestion de focus sur les dialogues. Travail continu, non bloquant pour le go-live mais impactant pour l'usage quotidien sous pression à la réception.

**CH-036 — Tests frontend**  
Zéro fichier `*.test.*` ou `*.spec.*` dans `frontend/src/`. Reporté formellement : le projet a une couverture e2e backend complète (27 suites) mais 0 test frontend. Consigné comme écart assumé — à planifier sur un horizon post-go-live.

---

## Dépendances inter-chantiers

```
CH-028 (composants UI)
  └─► CH-029 (DataTable)      : DataTable est un composant UI, CH-028 doit être ouvert en premier
  └─► CH-030 (Toast)          : même logique

CH-031 (ErrorBoundary)        : aucune dépendance — à traiter en premier
CH-034 (JWT → cookies)        : coordination backend (header Set-Cookie) + frontend simultanée
CH-035 (branding)             : aucune dépendance — à traiter en deuxième
CH-036 (tests)                : dépend idéalement de CH-031 (tester ErrorBoundary en premier)
```

---

## Critères de clôture de la Vague 4

La Vague 4 est déclarée **terminée** quand toutes les conditions suivantes sont remplies :

1. ✅ CH-031 terminé : aucun écran blanc possible sur exception de rendu isolée
2. ✅ CH-035 terminé : `<title>Makarim PMS</title>`, `<html lang="fr">`, favicon Makarim affichée
3. ✅ CH-034 terminé : `localStorage` ne contient plus jamais de token JWT
4. ✅ CH-032 terminé : `React.lazy()` + `Suspense` sur les 18 routes d'onglet
5. ✅ CH-028 + CH-029 + CH-030 terminés : `AuditPage` affiche un vrai diff viewer, `DocumentOcrPage` a une zone de dépôt, `StockPage` utilise un composant `Tabs` partagé
6. ✅ CH-033 : au moins les 3 dialogues critiques (réservation, facturation, check-in) passent la navigation clavier sans souris
7. CH-036 : **non bloquant pour la clôture** — reporté assumé, consigné dans `ECARTS_ASSUMES.md`

---

## Liens

- Audit source : [`docs/audits/PHASE_11_FRONTEND_QUALITE.md`](../audits/PHASE_11_FRONTEND_QUALITE.md)
- Registre des chantiers : [`docs/governance/REGISTRE_CHANTIERS.md`](REGISTRE_CHANTIERS.md) — section Vague 4
- Écarts assumés : [`docs/governance/ECARTS_ASSUMES.md`](ECARTS_ASSUMES.md) — EA-010 (CH-036 reporté)
- Critères go-live : [`docs/governance/CRITERES_GO_LIVE.md`](CRITERES_GO_LIVE.md)
