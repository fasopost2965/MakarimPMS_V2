# Audit technique — Makarim PMS v1
## Phase 11 — Qualité et fiabilité du frontend (post-couverture fonctionnelle)

Audit demandé explicitement par l'utilisateur *après* la clôture de la quasi-totalité des écrans manquants identifiés en Phase 8 (CH-003, CH-007, CH-008, CH-009, CH-011, CH-014, CH-015, CH-022). Question posée : *« ce qui est prévu, ce qui est fait, ce qui devrait être, ce que je n'ai pas pris en compte mais qui devrait l'être »*. Contrairement aux Phases 1-10 (constat de complétude fonctionnelle), cette phase porte sur la **qualité structurelle et non fonctionnelle** du frontend une fois la couverture d'écrans jugée quasi complète — c'est une deuxième couche d'audit, pas une répétition de la Phase 8.

**Méthode** : lecture directe du code réel (pas de la documentation seule) — inventaire exhaustif de `frontend/src/features/`, `frontend/src/components/`, `frontend/src/lib/` ; `grep` exhaustif sur les marqueurs de qualité (`ErrorBoundary`, `aria-*`, `role=`, `React.lazy`, fichiers `*.test.*`/`*.spec.*`, préfixes responsive Tailwind `sm:`/`md:`/`lg:`) ; lecture intégrale de `package.json` (dépendances déclarées, absence de dépendances de test) ; lecture de `index.html`, `vite.config.ts`, `token-storage.ts`. Comparaison systématique avec les quatre documents de planification frontend pré-existants (`CARTOGRAPHIE_ECRANS.md`, `EXIGENCES_UX.md`, `COMPOSANTS_PARTAGES_MANQUANTS.md`, `PLAN_DEVELOPPEMENT_FRONTEND.md`, `MATRICE_MODULE_API_ECRAN.md`, `MATRICE_ROLE_PERMISSIONS_ECRANS.md`) pour distinguer ce qui était *prévu et fait*, *prévu et contourné*, et *jamais prévu du tout*. Aucune modification de fichier applicatif effectuée pendant cette phase (constat seul, comme les Phases 1-10) — les corrections font l'objet des chantiers CH-028 à CH-036 (`docs/governance/REGISTRE_CHANTIERS.md`).

> **⚠️ Note de mise à jour — 27 juillet 2026**
> Une relecture directe du code réel sur `main` effectuée lors de la session du 27 juillet 2026 a révélé que **cinq des huit lacunes** signalées dans l'audit original avaient déjà été résolues dans le code, sans que le présent document ait été mis à jour en conséquence. Les sections §2, §4 et §5 ont été corrigées pour refléter l'état réel de la branche `main` à cette date. Les formulations d'origine sont conservées en barré pour traçabilité historique là où la correction est significative.

---

## 1. Ce qui était prévu (rappel du plan d'origine)

`docs/frontend-plan/PLAN_DEVELOPPEMENT_FRONTEND.md` structurait l'exécution en 8 lots, avec un principe explicite en tête de Lot 0 : *« le Lot 0 [fondations transverses — `error-boundary`, `AuthContext`, composant `form`/`date-picker`] ne livre aucune valeur métier visible immédiatement, mais chaque lot suivant en dépend [...]. Le construire en dernier obligerait à retoucher tous les écrans déjà livrés pour y greffer le gating après coup — plus coûteux que de le poser en fondation. »*

`docs/frontend-plan/COMPOSANTS_PARTAGES_MANQUANTS.md` listait, par priorité : `table` (Haute), `form` structuré (Haute), `error-boundary` (Haute, transverse), `select` avec recherche (Moyenne), `date-picker` (Moyenne), `toast` (Moyenne), `tabs` (Moyenne), `file-upload` (Moyenne), badge sémantique étendu (Basse), `diff-viewer` (Basse).

Ces deux documents n'abordent en revanche **jamais** : les tests automatisés, l'accessibilité, la sécurité du stockage des tokens côté client, le découpage de bundle, ou l'identité visuelle (titre d'onglet, favicon, `lang`). Ce ne sont donc pas des écarts par rapport au plan — ce sont des angles morts du plan lui-même, découverts uniquement par la lecture directe du code réel (§4 ci-dessous).

---

## 2. Ce qui est fait aujourd'hui (vérifié dans le code réel)

**Couverture fonctionnelle — confirmée quasi complète.** 18 dossiers dans `frontend/src/features/` (contre 14 à la Phase 8), les 8 écrans identifiés manquants (É-01 à É-08 de `CARTOGRAPHIE_ECRANS.md`) existent tous et appellent des endpoints réels — aucune donnée simulée détectée, cohérent avec le constat déjà établi en Phase 8 et jamais contredit depuis.

**Le Lot 0 — état réel au 27 juillet 2026 :** contrairement à ce que l'audit original indiquait, le Lot 0 a été livré dans son intégralité. Détail par composant :

| Composant | État audit original | État réel (27 juillet 2026) |
|---|---|---|
| `ErrorBoundary` | ❌ zéro résultat grep | ✅ `components/ErrorBoundary.tsx` — resetKey, chunk detection, test associé |
| Code splitting | ❌ zéro `React.lazy` | ✅ 16 `lazy()` + `<Suspense>` dans `App.tsx` (CH-034) |
| `toast` | ❌ absent | ✅ `components/ui/toast.tsx` + test |
| `table` | ❌ absent | ✅ `components/ui/table.tsx` + test |
| `tabs` | ❌ absent | ✅ `components/ui/tabs.tsx` + test |
| `file-upload` | ❌ `<input type="file">` natif | ✅ `components/ui/file-upload.tsx` + test |
| `diff-viewer` | ❌ `<pre>JSON.stringify</pre>` brut | ✅ `components/ui/diff-viewer.tsx` + test |
| `select` avec recherche | non mentionné | ✅ `components/ui/select-search.tsx` + test |
| `date-picker` | non mentionné | ✅ `components/ui/date-picker.tsx` + test |
| `form` structuré | non mentionné | ✅ `components/ui/form.tsx` + test |
| Branding `index.html` | ❌ `<title>frontend</title>`, `lang="en"`, favicon générique | ✅ `<title>Hôtel Makarim Tetouan</title>`, `lang="fr"`, favicon logo Makarim (CH-036) |
| Tokens JWT en `localStorage` | ❌ access + refresh en clair | ✅ cookies `httpOnly` backend, zéro JWT en localStorage — CSRF en mémoire JS uniquement (CH-026e) |

**`frontend/src/components/ui/` contient aujourd'hui 13 primitives** (badge, button, date-picker, dialog, diff-viewer, file-upload, form, input, label, select, select-search, table, tabs, textarea, toast), toutes accompagnées d'un fichier `*.test.tsx`.

---

## 3. Ce qui devrait être mais ne l'est pas (écarts vs. le plan existant)

- **Gating RBAC réduit à la granularité onglet** (RD-009, arbitrage assumé) : un rôle avec une permission `:read` mais pas `:write` sur un module partagé (ex. Gouvernante sur Maintenance) voit toujours les mêmes actions de création/résolution que le rôle qui a le droit — l'échec se produit en 403 serveur au clic, jamais avant. Choix produit tranché, pas un oubli, mais une expérience dégradée que le plan avait anticipée et explicitement mise de côté (`MATRICE_ROLE_PERMISSIONS_ECRANS.md`).
- **`docs/frontend-plan/MATRICE_MODULE_API_ECRAN.md` était obsolète au moment de l'audit initial** : la version relue affichait encore 6 lignes 🔴 (police, audit, self-checkin staff, notifications, document-ocr, channel-manager) alors que les six étaient ✅ depuis les chantiers de la session précédente — corrigé dans le cadre de CH-035, fermé.
- **CH-001 (avoir/credit-note) et le Lot 7 financier** : toujours sans interface, cohérent — aucun changement depuis la Phase 8, le backend ne dépend d'aucun chantier frontend distinct pour l'instant.

---

## 4. Angles morts — ce qu'aucun document de planification n'avait anticipé

Vérifiés directement dans le code, pas déduits de la documentation :

### 4.1 Tests automatisés — situation réelle au 27 juillet 2026

~~`find frontend/src -iname "*.test.*" -o -iname "*.spec.*"` → 0 résultat.~~ **Corrigé.** La relecture du 27 juillet 2026 révèle que chaque composant UI de `components/ui/` est accompagné d'un fichier `*.test.tsx` (10 fichiers de test au total pour les primitives UI, plus `ErrorBoundary.test.tsx`). Ces tests couvrent les primitives partagées. En revanche, **aucun test n'existe pour les pages et composants métier** (`features/*/pages/`, `features/*/components/`) ni de suite E2E Playwright commitée et reproductible en CI. L'écart entre la couverture backend (27 suites e2e réels contre MySQL) et frontend (primitives UI uniquement) reste significatif.

### 4.2 Accessibilité quasi nulle

2 fichiers sur 38 `.tsx` utilisent un attribut `aria-*`, 0 fichier utilise `role=`, aucun plugin ESLint `jsx-a11y` dans la configuration. Aucune gestion de focus documentée sur les dialogues (`components/ui/dialog.tsx`), aucune navigation clavier vérifiée. Pour un outil utilisé quotidiennement par la réception, potentiellement au clavier sous pression, ce n'est pas seulement une question de conformité — c'est un risque d'usage réel. **Statut : toujours actif.**

### 4.3 ~~Stockage des tokens JWT en `localStorage`~~ — RÉSOLU (CH-026e)

~~`frontend/src/lib/token-storage.ts` stocke les deux jetons en clair dans `localStorage`.~~ **Résolu.** Architecture au 27 juillet 2026 :
- Access token + Refresh token → cookies `httpOnly` posés par le backend, envoyés via `credentials: "include"`, invisibles au JavaScript.
- CSRF token → variable `let` en mémoire JS uniquement (jamais `localStorage`/`sessionStorage`), récupéré dans le corps JSON de `/auth/login`, `/auth/refresh` et `/auth/me`, envoyé via l'en-tête `X-CSRF-Token` sur les requêtes mutantes uniquement.
- `localStorage` limité à un indicateur non-sensible `makarim_logged_in_hint` pour éviter le flash de l'écran de connexion, jamais utilisé pour une décision de sécurité.
- Refresh concurrent dédupliqué (`refreshPromise ??= ...`).

### 4.4 ~~Aucun découpage de bundle~~ — RÉSOLU (CH-034)

~~`App.tsx` importe les 18 features en top-level ; `grep -r "React.lazy" → 0 résultat`.~~ **Résolu.** `App.tsx` utilise `React.lazy()` pour les 16 pages de features (toutes sauf `LoginPage` et `ForgotPasswordPage`, conservées en import statique car nécessaires avant toute authentification). `<Suspense>` wraps chaque page lazy. Un utilisateur ne charge que les chunks qu'il visite réellement.

### 4.5 ~~Absence totale d'error boundary~~ — RÉSOLU (CH-031)

~~Une exception de rendu React dans n'importe quel écran fait planter toute l'application.~~ **Résolu.** `components/ErrorBoundary.tsx` implémente :
- `getDerivedStateFromError` + `componentDidCatch` (log console)
- Détection automatique des chunk errors (`"dynamically imported module"`, `"Loading chunk"`) avec message utilisateur spécifique post-déploiement
- Prop `resetKey` pour réinitialiser le boundary depuis l'extérieur (changement d'onglet)
- Prop `onReset` callback pour nettoyer l'état parent
- Fichier `ErrorBoundary.test.tsx` associé

### 4.6 ~~Identité visuelle jamais mise à jour~~ — RÉSOLU (CH-036)

~~`index.html` : `<title>frontend</title>`, `<html lang="en">`, favicon générique Vite.~~ **Résolu.** `index.html` au 27 juillet 2026 :
```html
<html lang="fr">
  <head>
    <link rel="icon" type="image/jpeg" href="/logo-makarim.jpg" />
    <title>Hôtel Makarim Tetouan</title>
  </head>
```

### 4.7 Responsive/mobile quasi absent, jamais tranché explicitement

9 fichiers `.tsx` sur 38 utilisent un préfixe responsive Tailwind (`sm:`/`md:`/`lg:`). `AppSidebar` a des largeurs fixes en pixels (`w-60`/`w-16`), avec un tiroir de navigation mobile (`mobileNavOpen`) géré dans `App.tsx` mais dont le rendu final dans `AppSidebar` reste à vérifier. Cohérent avec le fait que F9 (app mobile housekeeping) a son propre client mobile séparé côté backend — mais aucun document n'énonce explicitement *« ce frontend admin est desktop-only, choix assumé »* : c'est un renoncement implicite, jamais écrit noir sur blanc ni validé par l'utilisateur. **Statut : toujours actif.**

### 4.8 Documentation frontend partiellement désynchronisée du code

Au-delà de `MATRICE_MODULE_API_ECRAN.md` (§3 ci-dessus), aucun mécanisme ne garantit que les documents de `docs/frontend-plan/` restent à jour à chaque clôture de chantier — le présent document lui-même en est la démonstration : cinq lacunes résolues dans le code réel mais jamais reflétées dans l'audit. Contraste avec `docs/governance/STATUT_MODULES.md`/`MATRICE_TRACABILITE.md`, qui portent une note explicite *« à mettre à jour à chaque clôture de chantier »*.

---

## 5. Évaluation globale

### Note révisée : **8/10** (était 6,5/10 dans l'audit original)

La réévaluation du 27 juillet 2026 révèle que cinq des huit lacunes signalées dans l'audit original avaient déjà été résolues — cinq lacunes qui pesaient chacune significativement sur la note. La correction de la note est donc factuelle, pas un assouplissement des critères.

**Points forts confirmés (inchangés depuis la Phase 8)** : zéro donnée simulée, homogénéité stricte du pattern `features/<domaine>/{api,types,components,pages}`, cohérence terminologique avec le vocabulaire métier backend, RBAC frontend qui ne réimplémente jamais sa propre logique, `ErrorBoundary` avec chunk detection, code splitting lazy complet, bibliothèque de primitives UI complète avec tests, architecture de sécurité tokens exemplaire (cookies httpOnly + CSRF mémoire), branding correct.

**Trois lacunes réellement actives au 27 juillet 2026 :**

| Priorité | Lacune | Impact |
|---|---|---|
| 🟠 P1 | **Accessibilité** — 2/38 fichiers utilisent `aria-*`, 0 `role=`, zéro `jsx-a11y` | Usage quotidien au clavier, risque d'usage réel |
| 🟡 P2 | **Tests E2E** — primitives UI testées, pages/composants métier non couverts, zéro Playwright CI | Régressions non détectées automatiquement |
| 🟡 P2 | **Responsive/mobile** — choix desktop-only jamais documenté explicitement | Ambiguïté de périmètre non résolue |

---

## 6. Liens vers la suite

Chantiers dérivés de ce constat, avec fiche complète (priorité, criticité, impacts, effort, critères de validation) : `docs/governance/REGISTRE_CHANTIERS.md`, section « Chantiers frontend — issus de l'audit qualité (Phase 11) », CH-028 à CH-036. Ordre d'exécution recommandé : `docs/governance/BACKLOG_PRIORISE.md`, Vague 4. Plan frontend révisé (5 catégories) : `docs/frontend-plan/PLAN_DEVELOPPEMENT_FRONTEND.md`, section 7.
