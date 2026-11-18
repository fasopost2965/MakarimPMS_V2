# Audit & Reverse Engineering  Flex PMS 9 (Hôtel Makarim)

## Contexte Technique
- Application legacy compilée sous **WINDEV 20** (`Flex PMS.exe`, `Flex PMS.wdl`, analyse `FlexPMS.wdd` / `FlexPMS.wda`).
- Base de données : **HFSQL Client/Serveur** (`HOTEL_DATA` sur `192.168.100.200:4900`).
- Environnement d'audit : copie isolée dans `./sources/`.

## Règles Strictes
1. **Lecture seule absolue** sur `./sources/` et interdiction totale de se connecter en écriture au serveur `192.168.100.200`.
2. **Méthode d'extraction WINDEV** : Utilise des scripts Python dans `./scripts/` pour extraire les métadonnées lisibles (chaînes UTF-16LE / ASCII, noms de fenêtres `FEN_*`, états `ETAT_*`, requêtes `REQ_*`, tables et rubriques depuis `FlexPMS.wdd` et `Flex PMS.wdl`), analyser les documents du `Manuel de formation`, et inspecter les exports Excel/PDF existants.
3. **Livrables** : Produis des spécifications fonctionnelles et techniques exhaustives en français dans `./docs_audit/`.
