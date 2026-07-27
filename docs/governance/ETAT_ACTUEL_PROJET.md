# État actuel du projet — Makarim PMS v1 (vision post-audit, non commerciale)

*Dernière mise à jour : 27 juillet 2026 — clôture documentaire Vague 4 (fiches CH-028 à CH-036). Voir `REGISTRE_CHANTIERS.md` pour le détail de chaque fiche.*

## Ce qu'est le projet

PMS interne pour l'Hôtel Makarim (3 étoiles, 24 chambres, Tétouan) — pas de logique SaaS multi-tenant, mono-établissement par conception. Monorepo NestJS + Prisma + MySQL 8 (backend) et React + Vite + TS + Tailwind (frontend), pensé pour un déploiement Docker Compose sur VPS.

## Périmètre réel actuel (backend, 21 modules confirmés par lecture du code)

`auth`, `rooms`, `parameters`, `reservations`, `stay`, `housekeeping`, `maintenance`, `guests` (+ `companies`), `billing`, `payments`, `dashboard`, `audit`, `police`, `notifications`, `self-checkin`, `booking-engine`, `document-ocr`, `reporting`, `hr`, `stock`, `channel-manager`.

*(Note : `docs/modules/MODULES_INDEX.md` en déclare 13-17 selon les documents — désynchronisé du code réel, voir `ECARTS_DOC_VS_CODE.md` et chantier CH-018.)*

## Ce qui est prêt (audité, éprouvé, sans écart critique détecté)

- Chaîne opérationnelle quotidienne : réservation → check-in → séjour → housekeeping → check-out.
- RBAC serveur (vérification fraîche en base à chaque requête, fail-closed par défaut).
- Machine à états des chambres, avec rattrapage automatique à la lecture (pas de cron).
- Paiements et acomptes idempotents, correctement rattachés au folio.
- Écrans desktop principaux : réservations, check-in, housekeeping, maintenance, clients, entreprises, RH, stock, reporting, paramètres, notifications, channel-manager, police (formulaire + badge ⚠), self-checkin staff, audit, document-ocr.
- Architecture backend (structure modulaire, validation DTO, gestion d'erreurs, transactions systématiques avec audit).

## Ce qui ne l'est pas

- **Facturation entreprise (city ledger)** : `Company` existe mais est totalement déconnectée du flux transactionnel.
- **Interface CH-001 (avoir/credit-note)** : backend fonctionnel, aucune UI frontend pour créer un avoir depuis un écran de facturation.
- **Qualité structurelle frontend** : cinq lacunes non fonctionnelles identifiées par l'audit Phase 11 (zéro test automatisé, accessibilité quasi nulle, tokens JWT en `localStorage`, aucun code splitting, aucun error boundary) — chantiers CH-028 à CH-033 ouverts, aucun code écrit à ce stade (RD-020).

Résolu depuis (voir `REGISTRE_CHANTIERS.md` pour le détail de chaque implémentation) :
- **Vague 1 — Bloquants** : correction de facture par avoir (CH-001), sécurité réinitialisation mot de passe (CH-002), interface registre de police (CH-003), chiffrement au repos `Guest.pieceIdentite` (CH-004).
- **Vague 2 — Importants** : blocage check-out sur solde impayé (CH-005), filtrage soft-delete centralisé (CH-006), interface frontend self-checkin (CH-007), interface frontend notifications (CH-008), interface frontend channel-manager (CH-009), déduplication client (CH-010), gating RBAC côté interface (CH-011), remboursement acompte imputé (CH-012).
- **Vague 3 — Secondaires** : CH-013 à CH-027 (documentation, synchronisation, dette technique, écrans audit/OCR) — voir `REGISTRE_CHANTIERS.md` pour le statut individuel de chaque fiche.
- **Vague 4 — Frontend qualité structurelle (Phase 11)** : fiches CH-028 à CH-036 **créées et documentées** (27/07/2026). Aucun code écrit à ce stade — exécution en attente d'un feu vert explicite (RD-020). Voir ci-dessous pour le détail.

## Vague 4 — Chantiers frontend qualité structurelle (CH-028 à CH-036)

Issus de l'audit Phase 11 (`docs/audits/PHASE_11_FRONTEND_QUALITE.md`, conduit après clôture de la quasi-totalité des écrans manquants).

| ID | Titre | Priorité | Criticité | Statut |
|---|---|---|---|---|
| CH-028 | Error boundary global React | P0 | Critique | à faire |
| CH-029 | Branding : titre, lang, favicon | P0 | — | à faire |
| CH-030 | Tokens JWT → cookies httpOnly | P0 | Critique sécurité | à faire |
| CH-031 | Code splitting React.lazy par onglet | P1 | Modérée | à faire |
| CH-032 | Composants partagés : table, tabs, toast | P1 | Modérée | à faire |
| CH-033 | Composants partagés : file-upload, diff-viewer | P2 | Faible | à faire |
| CH-034 | Accessibilité aria-* et navigation clavier | P2 | Modérée | à faire |
| CH-035 | Tests automatisés frontend (Vitest + RTL) | P2 | Modérée | à faire |
| CH-036 | Énoncer explicitement la cible responsive | P2 | Faible | à faire |

Ordre d'exécution recommandé : CH-028 → CH-029 → CH-030 (P0, effort croissant), puis CH-031 → CH-032 (P1, effort modéré), puis CH-033 → CH-034 → CH-035 → CH-036 (P2, long terme). Voir `BACKLOG_PRIORISE.md`.

## Risques majeurs (voir `REGISTRE_RISQUES.md` pour le détail)

**Trois risques structurels frontend ouverts** (identifiés par l'audit Phase 11) :
- **R-13** — Crash total de l'application sur toute exception de rendu React (absence d'error boundary — CH-028)
- **R-14** — Vol de session via exfiltration des tokens JWT depuis `localStorage` (CH-030 / RD-016)
- **R-15** — Régression silencieuse en production faute de tests automatisés frontend (CH-035)

Fermés depuis (voir `REGISTRE_RISQUES.md`) : prise de contrôle de compte via token de reset exposé (R-01, CH-002), facture erronée non corrigible (R-02, CH-001), registre de police légal non tenable (R-03, CH-003), fuite de revenus par check-out non contrôlé (R-04, CH-005), contournement blacklist par duplication fiche client (R-05, CH-010), exposition données d'identité (R-06, CH-004), acompte imputé sans chemin de remboursement (R-08, CH-012).

## Conditions minimales pour une mise en production réelle

Voir `CRITERES_GO_LIVE.md` pour la liste complète et vérifiable. En résumé : les 4 chantiers bloquants du registre (CH-001 à CH-004) sont désormais **tous livrés** — plus aucun chantier bloquant ouvert avant une mise en production réelle du seul point de vue de ce registre. Les risques R-13/R-14/R-15 (structurels frontend) sont recommandés avant mise en production mais ne constituent pas des bloquants stricts au sens du registre original.

## Priorités de suite

Voir `BACKLOG_PRIORISE.md` pour l'ordre d'exécution recommandé, et `../backend-plan/PLAN_BACKEND_100_REEL.md` / `../frontend-plan/` pour les plans de développement détaillés. Environnement de développement local opérationnel et documenté dans `../planning/ENVIRONNEMENT_LOCAL.md`.

## Note globale issue des audits

**7/10** (Phases 1-10, complétude fonctionnelle) — architecture et discipline d'écriture nettement au-dessus de la moyenne pour un projet de cette taille ; complétude fonctionnelle de la chaîne financière et de la sécurité périphérique en retrait par rapport à cette qualité de base. Voir `docs/audits/PHASE_10_SYNTHESE_ROADMAP.md`.

**6,5/10** (Phase 11, qualité/fiabilité frontend) — la couverture fonctionnelle du frontend est aujourd'hui bonne (18 features câblées, zéro donnée simulée), mais cinq lacunes structurelles (zéro test automatisé, accessibilité quasi nulle, tokens JWT en `localStorage`, absence de code splitting, absence d'error boundary) pèsent sur la fiabilité en usage réel. Voir `docs/audits/PHASE_11_FRONTEND_QUALITE.md`. Chantiers documentés CH-028 à CH-036 — aucun code écrit à ce stade.
