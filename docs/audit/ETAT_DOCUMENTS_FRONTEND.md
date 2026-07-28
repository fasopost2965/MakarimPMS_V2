# État des Documents & Impressions Frontend (Makarim PMS)

Ce document répertorie l'ensemble des composants d'impression, d'export PDF ou de génération de documents administratifs dans l'application frontend (`frontend/src`), ainsi que leur état d'intégration avec la configuration dynamique de l'hôtel (`HotelConfig`).

## 1. Synthèse de l'Audit

| Composant / Fichier | Type de Document | Source Données Hôtel | État Actuel | Remarques / Action Requise |
|---|---|---|---|---|
| `InvoicePrintModal.tsx` | Facture client (A4) | Dynamique (`getHotelConfig`) | ✅ Corrigé | Affiche raison sociale, catégorie, adresse, ICE, RC et IF dynamiques issus de la table `HotelConfig`. |
| `PoliceRecordForm.tsx` / Fiche police PDF | Fiche signalétique police | À vérifier / Statique | 📋 À auditer | Doit reprendre les en-têtes officiels de l'établissement et les données d'identité du client. |
| `WorkOrderPrintModal.tsx` | Bon de travail maintenance | À vérifier | 📋 À auditer | Vérifier l'en-tête de l'hôtel et les informations de l'intervenant/chambre. |
| `PayslipPreviewDialog.tsx` | Fiche de paie employé (RH) | À vérifier | 📋 À auditer | Doit reprendre la raison sociale de l'hôtel employeur et les mentions légales RH. |

## 2. Détail par Composant

### `InvoicePrintModal.tsx` (`/frontend/src/features/billing/components/InvoicePrintModal.tsx`)
- **Objectif** : Génération et impression des factures clients et notes de frais.
- **Source Hôtel** : `getHotelConfig()` (API backend `/parameters/hotel`).
- **Champs dynamiques affichés** : Raison sociale (`raisonSociale`), Étoiles (`categorieEtoiles`), Adresse (`adresse`), ICE, RC, IF.
- **Statut** : Conforme (source de vérité unique des paramètres de l'hôtel respectée).

### `PoliceRecordForm.tsx` (`/frontend/src/features/police/components/PoliceRecordForm.tsx`)
- **Objectif** : Saisie et impression de la fiche de police hôtelière réglementaire marocaine.
- **Prochaine étape (Lot 2 / Lot 3)** : Harmoniser l'en-tête pour utiliser la configuration dynamique de l'hôtel et fiabiliser le préremplissage depuis le dossier client (`Guest`) et le séjour (`Stay`).

---
*Document créé dans le cadre de la mission de cadrage et d'audit des formulaires et documents (MakarimPMS_V2).*
