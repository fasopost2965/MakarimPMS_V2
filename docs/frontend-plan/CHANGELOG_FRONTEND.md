# Changelog Frontend

Ce document trace les dernières modifications majeures effectuées sur le frontend.

## Dernière mise à jour (Facturation & Impression)

- **Composant `InvoicePrintModal.tsx`** :
  - Refonte visuelle complète du template de facture (format A4).
  - Ajout des informations légales de l'hôtel (Hôtel Makarim, ICE, RC, Patente, IF, CNSS).
  - Ajout du logo et des informations de contact (Téléphone, Email, Adresse).
  - Affichage détaillé des lignes facturées avec typographie monospace pour les montants.
  - Calcul et affichage clair du sous-total, de la mention TVA incluse, et du Total TTC net à payer.
  - Fonctionnalité d'impression native déclenchant l'aperçu PDF du navigateur, isolant proprement le contenu via une balise iframe pour préserver les styles Tailwind CSS à l'impression.
- **Types `types.ts`** :
  - Ajout de la propriété `libelle` optionnelle sur l'objet `folio` dans `InvoiceDetail`.

## État des connexions (Backend <-> Frontend)

- Les requêtes vers l'API sont toutes centralisées via `frontend/src/lib/api-client.ts`.
- L'URL de l'API est dynamiquement injectée via la variable d'environnement `VITE_API_URL` (sinon, elle utilise un reverse proxy par défaut vers `/api`).
- La gestion du `X-CSRF-Token` et l'interception automatique des erreurs `401` pour le renouvellement du jeton (refresh token) sont fonctionnelles.
- **Conclusion** : Le couplage back/front est sain et prêt pour la production.

