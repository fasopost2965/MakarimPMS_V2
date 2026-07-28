# Changelog Frontend

Ce document trace les dernières modifications majeures effectuées sur le frontend.

## Composants partagés : table, tabs, toast (CH-032)
- **Composants UI** : Implémentation et consolidation de la bibliothèque de composants partagés dans `frontend/src/components/ui/` (`table.tsx`, `tabs.tsx`, `toast.tsx`).
- **Mutualisation** : Adoption de composants standardisés sémantiques et accessibles (`@base-ui/react` pour les onglets et les notifications toast, éléments HTML natifs robustes pour la table).
- **Statut** : Déjà livré et opérationnel, validé par l'audit réel du code et l'absence de régression.


## Migration des jetons JWT vers les cookies HTTPOnly (CH-026E)
- **Sécurité & Stockage** : Suppression totale du stockage des jetons d'accès et de rafraîchissement JWT dans le `localStorage`.
- **Cookies HTTPOnly** : Les tokens sont désormais gérés via des cookies sécurisés `HttpOnly`, `Secure`, `SameSite` posés par le backend (`AuthCookieService`).
- **Client API** : Ajout systématique de `credentials: "include"` sur les requêtes `fetch` (`api-client.ts`) et isolation du jeton CSRF en mémoire vive (`token-storage.ts`).

## Refonte du Formulaire de Réservation (Lot 2)
- **Composant `CreateReservationDialog.tsx`** :
  - Refonte approfondie du flux en 4 étapes guidées (1. Chambre & Dates, 2. Client CRM & Facturation Société, 3. Prestations & Tarifs, 4. Confirmation & Acompte).
  - Ajout d'une barre de résumé persistant (bannière de contexte) visible sur les étapes 2 à 4 pour réduire la charge cognitive et permettre de vérifier instantanément la chambre, les dates et le client.
  - Conservation totale de l'état de saisie lors de la navigation entre les étapes (prévention de la perte de données).
  - Responsive mobile + desktop optimisé avec des zones tactiles confortables, des sélecteurs natifs fluides et des cartes de résumé financier en temps réel.
  - Intégration transparente avec le module CRM clients (`GuestPicker`) et la gestion des sociétés pour la facturation entreprise.

## Dernière mise à jour (Facturation, Paramètres & Cadrage Formulaires)

- **Composant `InvoicePrintModal.tsx`** :
  - Refonte visuelle complète du template de facture (format A4).
  - Correction de l'incohérence d'adresse : les informations légales de l'hôtel (raison sociale, catégorie, adresse, ICE, RC, IF) ne sont plus codées en dur, mais récupérées dynamiquement via `getHotelConfig()` (`/frontend/src/features/parameters/api.ts`).
  - Ajout du logo et des informations de contact dynamiques.
  - Affichage détaillé des lignes facturées avec typographie monospace pour les montants.
  - Calcul et affichage clair du sous-total, de la mention TVA incluse, et du Total TTC net à payer.
  - Fonctionnalité d'impression native déclenchant l'aperçu PDF du navigateur, isolant proprement le contenu via une balise iframe pour préserver les styles Tailwind CSS à l'impression.
- **Types `types.ts`** :
  - Ajout de la propriété `libelle` optionnelle sur l'objet `folio` dans `InvoiceDetail`.
- **Cadrage des sous-lots (Formulaires & Documents)** :
  - Lot 1 : Cohérence des documents / source de vérité paramètres hôtel (terminé pour la facture, à auditer sur les autres PDF/documents).
  - Lot 2 : Formulaires métier & préremplissage (réservation, fiche de police, etc.).
  - Lot 3 : Amélioration UX & responsive des formulaires critiques (structure, groupement logique, messages d'erreur).

## Branding Frontend (CH-029)
- **Vérification** : Inspection de `frontend/index.html` et des actifs statiques dans `frontend/public/`.
- **État constaté** : Le chantier est déjà entièrement livré dans le code réel (`<html lang="fr">`, `<title>Hôtel Makarim Tetouan</title>`, `<link rel="icon" type="image/jpeg" href="/logo-makarim.jpg" />` et présence effective de `/logo-makarim.jpg` dans `frontend/public/`).
- **Conclusion** : Aucune modification de code n'a été nécessaire.

## État des connexions (Backend <-> Frontend)

- Les requêtes vers l'API sont toutes centralisées via `frontend/src/lib/api-client.ts`.
- L'URL de l'API est dynamiquement injectée via la variable d'environnement `VITE_API_URL` (sinon, elle utilise un reverse proxy par défaut vers `/api`).
- La gestion du `X-CSRF-Token` et l'interception automatique des erreurs `401` pour le renouvellement du jeton (refresh token) sont fonctionnelles.
- **Conclusion** : Le couplage back/front est sain et prêt pour la production.

