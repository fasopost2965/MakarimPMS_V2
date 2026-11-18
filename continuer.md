# Continuité du Projet — MakarimPMS_V2 (Hôtel Makarim Tétouan)

*Point de reprise officiel pour tout développeur ou agent IA reprenant le travail sur `MakarimPMS_V2` avant la mise en production sur `pms.hotelmakarim.ma`.*

---

## Point d'étape — Audit Terrain & Reverse Engineering Flex PMS 9 (18/11/2026)

### 1. Contexte & Branche d'audit GitHub

Un audit fonctionnel, technique et fiscal complet de l'ancien système de production (**Flex PMS 9** — WINDEV 20 / HFSQL C/S `HOTEL_DATA` sur `192.168.100.200:4900`) a été réalisé sur place à l'Hôtel Makarim (Tétouan).

- **Dépôt GitHub :** `https://github.com/fasopost2965/MakarimPMS_V2.git`
- **Branche dédiée aux livrables d'audit :** **`audit-flex-pms`** *(isolée de `origin/main` pour préserver la propreté du code source applicatif)*.
- **Emplacement des 5 livrables d'audit sur `audit-flex-pms` :**
  - `RAPPORT_AUDIT_FLEX_PMS.md` : Cartographie de l'infrastructure locale, postes clients, partages SMB et serveur HFSQL (`192.168.100.200:4900`).
  - `Audit_Makarim/docs_audit/01_fonctionnalites_et_ecrans.md` : Inventaire des 9 modules, 92 entrées de menu / 91 fenêtres (`FEN_*`), 41 états internes (`ETAT_*`), 173 requêtes (`REQ_*`) et analyse colonne par colonne des 26 exports comptables/fiscaux réels 2019–2026.
  - `Audit_Makarim/docs_audit/02_modele_donnees_et_architecture.md` : Rétro-ingénierie du dictionnaire de données (`FlexPMS.wdd` — 90 tables HFSQL, 12 contraintes FK), passerelle POS (`COM_TICKET_TO_PMS.fic` / `COM_CHAMBRE_DISPO.fic`) et droits utilisateurs (`GPU_*`).
  - `Audit_Makarim/docs_audit/03_regles_metiers_critiques.md` : Machines à états des réservations, folios (jusqu'à 5 folios/chambre), groupes, délogements, Night Audit, fiscalité DGI Maroc et matrice RBAC cible (6 rôles).
  - `Audit_Makarim/docs_audit/04_gap_analysis_v2_vs_flex.md` : Analyse d'écarts complète par couche (**Prisma / NestJS / React**) entre **Flex PMS 9** et le code réel de **`origin/main`** (NestJS + Prisma + MySQL 8 + React/Vite) + plan d'exécution P0 en 4 lots sans régression sur les 32 migrations existantes ni sur les contraintes `CHECK` MySQL 8 (`CH-025`).
- **Scripts d'inspection lecture seule sur `audit-flex-pms` :** `Audit_Makarim/scripts/` (`inspect_windev_metadata.py` + 9 scripts PowerShell d'extraction et d'analyse ; le script d'extraction ODBC/CSV en lecture seule pour le *Clean Cutover* sera livré en Lot 4).

---

### 2. Les 7 Axes d'Arbitrage Métier & Architecture Validés (Avant Go-Live VPS)

Les décisions suivantes ont été validées après entretien terrain avec la réception et croisement direct avec le code source de `origin/main` :

1. **RBAC Réception / Caisse / Night Audit (P0) :**
   - Correction du blocage critique dans `seed.ts` : accorder à `Réception` les droits `billing:read`, `billing:write`, `payments:write`, `reporting:read` (opérationnel) et `groups:*` afin de permettre l'encaissement, la facturation et le check-out au comptoir (`CH-005`).
   - Isolation des permissions sensibles (`billing:credit-note`, `billing:consolidate-company`, `night-audit:execute`) et ajout du rôle **`Night Auditor`**.
2. **Fiscalité DGI Maroc & Tarification réelle (P0) :**
   - Ajout des compteurs réels `nbAdultes` et `nbEnfants` sur `Reservation` et `Stay` (remplacement du proxy `RoomType.capacite`).
   - Distinction stricte entre `TypeLigneFolio.RESTAURATION` (**10 % TVA**, `TVA_RESTAURATION`, utilisé pour PDJ 45 MAD / DP / PC / restaurant) et `EXTRA` (**20 % TVA**, `TVA_ANNEXE`) — correction du bug tripartite `invoice-calc.ts` (0 % sur `RESTAURATION` et `PAIEMENT` non exclu) vs `solde.ts` & UI (20 % en dur).
   - Correction de l'anomalie historique de Flex PMS : **TPT + TS = 4,30 MAD / adulte / nuit en hors champ TVA (0 %)**, historisé dans `TaxRateConfig`.
   - Format de numérotation fiscale configurable (`NNN/AA` ou `FAC-AAAA-NNNNNN`) via compteur atomique `InvoiceSequence` (suppression de la collision `generateInvoiceNumber(0)`).
3. **Conformité Facture DGI & UI Avoirs (P0) :**
   - Refonte complète de `InvoicePrintModal.tsx` (suppression des constantes factices `ICE: 123456789012345` / `RC: 12345` / Rabat et de tout calcul TVA côté React) : données 100 % serveur depuis `HotelConfig`, mention **ICE (15 chiffres)** obligatoire pour les sociétés, ventilation HT / TVA 10 % / TVA 20 % / TPT+TS / TTC, modes de règlement, arrêté en toutes lettres MAD, 3 formats (*Détaillée*, *Synthétique*, *Pro-forma*) et mention automatique **`DUPLICATA`** sur les réimpressions.
   - Ajout de l'interface frontend d'émission d'Avoirs (`CreditNote`).
4. **B2B / ICE / City Ledger (P0) :**
   - Rattachement `Company` (`companyId`) sur `Reservation` / `Folio` / `Invoice`, ajout de `MoyenPaiement.CHEQUE`, contrôle `plafondCredit`, passage au check-out en `EN_COMPTE`, et facturation mensuelle consolidée **City Ledger** (35 %–68 % du CA mensuel Makarim : ECOMED, SOMAPRED, agences).
5. **Co-occupants 1-to-N, Dossiers Groupes & Master Folio (P0) :**
   - Relation **`1-to-N`** entre `Stay` et `PoliceRecord` (gestion complète des co-occupants et fiches de police DGSN).
   - Multi-folios opérationnels (jusqu'à 5 folios/chambre) + transfert atomique de lignes inter-folios, inter-chambres et vers Master Folio.
   - Module **Dossier Groupe** : réservations multi-chambres, pré-rooming, rooming list, attribution en masse, **Master Folio**, check-in / check-out par bloc et **facture groupe nominative avec CIN** (administrations / Province de Tétouan).
6. **Night Audit ACID & Reporting / Exports Comptables Natifs (P0) :**
   - Clôture journalière ACID idempotente (`DailyClosure`) : pré-contrôles arrivées/départs/No-Shows, bascule atomique de date hôtel (`currentBusinessDate`), verrouillage comptable (`closedInAuditId`) de la journée.
   - **Main Courante** et **Contrôle Caisse** ventilés par mode de règlement (`ESP`, `CC`, `CHQ`, `VIR`, `ACOMPTE`, paiements mixtes).
   - **Export comptable mensuel natif** (`xlsx`/`csv`, en MAD) intégrant d'office l'ICE, la ventilation HT / TVA 10 % / TVA 20 % / TPT+TS / TTC et les modes de paiement ventilés (éliminant le retraitement manuel Excel).
   - État **Préparation Restaurant** (prévisionnel des couverts PDJ / DP / PC par chambre).
7. **Intégration Restaurant / POS & Stratégie de Migration (`Clean Cutover`) (P0) :**
   - **POS Phase 1 (Go-Live) :** saisie rapide des consommations restaurant multi-chambres directement dans `MakarimPMS_V2` (`FolioLine.sourceModule = 'RESTAURANT'` + `sourceRef`). *(Phase 2 : mini-module POS intégré ou passerelle API si `Flex Caisse` est maintenu.)*
   - **Clean Cutover :** injection des référentiels réels de l'Hôtel Makarim (**25 chambres / 24 actives `101–308`**, 6 typologies réelles, tarifs/pensions 2026, identité légale `RC 25149` / `ICE 002270052000083` / `CNSS 1322850`, sociétés B2B + ICE, comptes équipe nominatifs), reprise uniquement des **réservations futures** et des **soldes débiteurs ouverts** (Flex PMS 9 restant accessible en lecture seule pour les archives 2018–2026).

---

### 3. Plan de Reprise du Travail — Ordre Exact des 4 Lots P0

Pour reprendre le développement avant la bascule sur `pms.hotelmakarim.ma` :

1. **Créer la branche de travail depuis `origin/main` :**
   ```bash
   git fetch origin
   git checkout -b feat/p0-conformite-makarim origin/main
   ```
2. **Consulter la spécification détaillée des écarts et des 4 lots :**
   ```bash
   git show origin/audit-flex-pms:Audit_Makarim/docs_audit/04_gap_analysis_v2_vs_flex.md
   ```
3. **Exécuter séquentiellement les 4 lots P0 (sans casser les 32 migrations existantes ni les 4 contraintes `CHECK` de `CH-025`) :**
   - **Lot 1 — Migrations Prisma (strictement additives) :** `nbAdultes`/`nbEnfants`, vérification `TypeLigneFolio.RESTAURATION`, `MoyenPaiement.CHEQUE`, `TaxRateConfig`, `HotelConfig` étendu + `currentBusinessDate`, `Invoice` (ventilation fiscale + `printCount`) + `InvoiceSequence` + `InvoiceFolio`, `Company`/City Ledger (`companyId` sur `Reservation`/`Folio`/`Invoice`), `PoliceRecord` 1-to-N (avec index de remplacement avant `DROP INDEX`), Dossier Groupe / Master Folio (`GroupBooking`, `GroupAllocation`), `DailyClosure` + `closedInAuditId` + extensions `AuditEntity`/`AuditAction`.
   - **Lot 2 — Logique métier backend NestJS :** RBAC Réception/Night Auditor, calcul fiscal DGI Maroc unifié (`invoice-calc.ts` + `solde.ts` + `billing.service.ts` + `pricing.service.ts`), transfert inter-folios/chambres/master, City Ledger & factures mensuelles consolidées, `GroupsModule` (pré-rooming, attribution en masse, check-in/out bloc, facture groupe nominative), `NightAuditModule` ACID idempotent, et 4 nouveaux endpoints Reporting (`main-courante`, `cash-control`, `accounting-export`, `restaurant-forecast`).
   - **Lot 3 — Interfaces React réception / caisse / back-office :** refonte `InvoicePrintModal.tsx` (3 formats + `DUPLICATA` + arrêté en lettres) & UI Avoirs (`CreditNote`), saisie rapide restaurant multi-chambres (`sourceModule='RESTAURANT'`), co-occupants police 1-to-N, multi-folios & transferts, rooming list groupe + factures B2B/nominatives avec CIN, City Ledger dans `CompaniesPage.tsx`, assistant `NightAuditPage.tsx`, export comptable mensuel ICE + modes ventilés (`xlsx`/`csv`), état Préparation Restaurant et paramètres légaux complets.
   - **Lot 4 — Script de seed / *Clean Cutover* & Go-Live VPS :** `seed-makarim-prod.ts` non destructif (référentiels réels Makarim `101–308`), `import-cutover.ts` (`--dry-run` sur exports CSV lecture seule : sociétés/ICE, réservations futures et soldes débiteurs ouverts), déploiement pilote sur **`pms.hotelmakarim.ma`** et double run de 7 à 14 jours avant bascule officielle.
