# Audit Fonctionnel & Technique — Flex PMS 9 (Hôtel Makarim Tétouan)
## 01. Inventaire des Fonctionnalités, Écrans, États d'Impression, Requêtes et Exports

**Date d'audit :** 18/11/2026  
**Périmètre analysé :** Copie isolée en lecture seule dans `./sources/` (`Flex PMS 9`, `Manuel de formation`, `Etats et requêtes`)  
**Application cible :** Flex PMS Manager / Flex PMS 9 (`Flex PMS.exe` v9.0.54.0, WINDEV 20, éditeur Creativekeys)  
**Établissement :** Hôtel Makarim — Bd. Al-Okhouane, Quartier AL WIQAYA, BP. 93020, Tétouan, Maroc (`RC: 25149` · `ICE: 002270052000083` · `CNSS: 1322850`)

> **Note méthodologique :** L'environnement d'analyse étant dépourvu d'interpréteur Python, l'ensemble des extractions automatisées (lecture XML/images des `.docx`, parsing des fichiers HFSQL `.fic`/`.mmo`, scan binaire de `Flex PMS.wdl` et des `.wde`, lecture OLEDB `Microsoft.ACE.OLEDB` des `.xls` et `RichTextBox` des `.rtf`) a été réalisé par des scripts PowerShell/.NET reproductibles stockés dans `./scripts/`, dans le strict respect de la règle de lecture seule sur `./sources/` et sans aucune connexion au serveur `192.168.100.200`.

---

## Table des matières

1. [Inventaire complet des modules, écrans et fonctionnalités (Manuels de formation & Registre applicatif)](#1-inventaire-complet-des-modules-écrans-et-fonctionnalités)
   - [1.1 Synthèse du corpus « Manuel de formation »](#11-synthèse-du-corpus--manuel-de-formation-)
   - [1.2 Ergonomie générale & Architecture de l'interface](#12-ergonomie-générale--architecture-de-linterface)
   - [1.3 Cartographie complète par module fonctionnel](#13-cartographie-complète-par-module-fonctionnel)
2. [Inventaire exhaustif des états d'impression et requêtes](#2-inventaire-exhaustif-des-états-dimpression-et-requêtes)
   - [2.1 États externes WINDEV (`.wde`) dans `./sources/Etats et requêtes/`](#21-états-externes-windev-wde-dans-sourcesetats-et-requêtes)
   - [2.2 Modèles d'impression configurés (`MODEL_IMPRESSION.fic`)](#22-modèles-dimpression-configurés-model_impressionfic)
   - [2.3 Requêtes SQL externes (`.sql`) et requêtes personnalisées (`sys_requetes`)](#23-requêtes-sql-externes-sql-et-requêtes-personnalisées-sys_requetes)
   - [2.4 États intégrés (`ETAT_*`) compilés dans `Flex PMS.wdl`](#24-états-intégrés-etat_-compilés-dans-flex-pmswdl)
   - [2.5 Requêtes intégrées (`REQ_*`) compilées dans `Flex PMS.wdl`](#25-requêtes-intégrées-req_-compilées-dans-flex-pmswdl)
3. [Analyse approfondie des fichiers d'export réels (2025–2026)](#3-analyse-approfondie-des-fichiers-dexport-réels-20252026)
   - [3.1 Inventaire exhaustif des 26 fichiers d'export 2025–2026](#31-inventaire-exhaustif-des-26-fichiers-dexport-20252026)
   - [3.2 Structure des rapports comptables — Colonnes utilisées et règles de calcul](#32-structure-des-rapports-comptables--colonnes-utilisées-et-règles-de-calcul)
   - [3.3 Structure des rapports d'occupation et de réservations](#33-structure-des-rapports-doccupation-et-de-réservations)
   - [3.4 Synthèse des règles métier réelles, anomalies et exigences de refonte](#34-synthèse-des-règles-métier-réelles-anomalies-et-exigences-de-refonte)

---

## 1. Inventaire complet des modules, écrans et fonctionnalités

### 1.1 Synthèse du corpus « Manuel de formation »

Le dossier `./sources/Manuel de formation/` contient **5 documents Word (`.docx`)** datés du `04/06/2019` (18,1 Mo au total), totalisant **97 captures d'écran applicatives** :

| Fichier | Taille | Captures | Périmètre couvert | Observations |
| :--- | :---: | :---: | :--- | :--- |
| `Introduction Flex PMS.docx` | 468 Ko | 9 | Présentation générale, Administration, Cardex, Constantes, Interface Visual Planning / Floor Planning / Disponibilités | Vue d'ensemble des modules de paramétrage et de l'écran principal. |
| `Manuel de formation Flex PMS Reservation.docx` | 5,69 Mo | 34 | Module Réservation : Visual Planning, Disponibilités, Réservation individuelle (saisie, Cardex, arrangements, services, arrhes, modification, corbeille, verrouillage), Réservation groupe (dossier groupe, pré-rooming list, attribution en masse, clôture, dossiers en cours) | Guide pas-à-pas très illustré. Référence un « manuel de formation FrontOffice » absent du dossier. |
| `Manuel Caisse Flex PMS.docx` | 673 Ko | 7 | Caisse (Mise à jour 8) : Saisie rapide de transactions, Facturation & Check-Out individuel, règlements/déductions, notes (globale/normale/compacte), transferts, libération chambre, Départ groupe, Reprise de facture | Document le plus riche sur les règles métier de caisse et de facturation. |
| `Manuel de formation Flex PMS Caisse&CheckOut.docx` | 5,96 Mo | 24 | Module Caisse & Check Out : Menu Front Office/Caisse, Visual Planning, Saisie des extras, Encaissement (client & compte permanent), Facturation & Check-Out (10 boutons d'action), Départ groupe | Guide illustré (captures de juillet 2017). |
| `Manuel de formation Flex PMS Facturation.docx` | 5,74 Mo | 23 | Module Facturation | Contenu textuel quasi identique à `Caisse&CheckOut.docx` (hors section « Départ groupe » et 1 capture en moins). |

> **Complément technique :** Les manuels de formation ne couvrent pas en détail les modules *Main courante (Night Audit)*, *Gouvernante*, *Back Office (Trésorerie)*, *États* et *Add-on WIFI*. Pour garantir un inventaire **100 % exhaustif**, l'analyse des manuels a été systématiquement croisée avec le registre interne de navigation (`sys_groupe.FIC`, `sys_registre.FIC` — **92 entrées de menu** — et `sys_registre.mmo` — **91 appels d'écrans WLanguage `FEN_*`**) extrait de `./sources/Flex PMS 9/commun/configuration/sa/`.

---

### 1.2 Ergonomie générale & Architecture de l'interface

Flex PMS 9 est une application desktop MDI (Multi-Document Interface) structurée autour d'une fenêtre cadre (`Flex PMS Manager`) composée de **5 zones** (observées dans `Introduction Flex PMS.docx` et les captures d'écran) :

1. **Barre de menus supérieure & Barre de commande :** Menus `Fichier`, `Fenêtre`, `Outils`, `?` + champ de lancement rapide `<Commande>`.
2. **Panneau latéral gauche (3 onglets) :**
   - **`Menu`** (`MENU_PRINCIPALE`) : arborescence hiérarchique complète des modules métier (Administration, Réservation, Front Office, Caisse, Main courante, Gouvernante, Back Office, États, Add-on WIFI). *(Note : les captures de formation montrent aussi « Gestion des stocks » et « Comptabilité » présents dans l'édition suite complète, non activés dans le `sys_groupe.FIC` de Makarim.)*
   - **`Sélection rapide`** (`MENU_SELECTION_RAPIDE`) : raccourcis vers les tâches quotidiennes fréquentes (`P_RACCOURCI.fic`).
   - **`Messages`** (`FEN_CHAT`) : messagerie interne en temps réel entre utilisateurs/postes connectés (avec historique archivé en XML/XSL dans `backup/chat/`).
3. **Zone centrale MDI :** Affiche les écrans ouverts en fenêtres filles, avec en écran pivot le **Visual Planning** (calendrier horizontal chambres × jours par semaines, codes couleur d'état et icônes de garantie/occupant) et sa **barre d'outils supérieure** (navigation `<<` / `>>`, `Actualiser`, barre de recherche globale).
4. **Bandeau inférieur du Visual Planning (Tableau de disponibilité par type de chambre) :** Affiche par jour (sur 1 mois glissant) le nombre de chambres physiques disponibles à la vente pour chaque type de chambre (`DOUBLE`, `TRIPLE`, `QUADRUPLE`, `TWIN`, etc.) ainsi que le total disponible.
5. **Volet latéral droit (2 onglets) :**
   - **`Information`** : aperçu rapide de la réservation sélectionnée sans ouvrir la fiche (`N° Réservation`, `Garantie (Total)`, `T. Séjours Prévisionnel`, `Piste`, `Nbr. Nuits`, `Arrivée`, `Départ`, `Message`, `Note`, `Code Client`, cases `Fumeur`/`Habitué`, `Client`, `Occupant`, `Pax/chb`, `Enfants`, `Nationalité`, `Langue 1/2`, `Classification`, `Segment`).
   - **`Filtres`** : filtrage dynamique du Visual Planning par **étage** et/ou **type de chambre**.
6. **Barre d'état inférieure :** Affiche l'écran actif, l'utilisateur connecté (ex. `sa`, `SUPPORT TECHNIQUE`), la date système et l'heure.

---

### 1.3 Cartographie complète par module fonctionnel

#### Module 1 — Administration (Paramétrage & Référentiels)

Documenté dans `Introduction Flex PMS.docx` et complété par `sys_registre.FIC/.mmo` (**28 écrans**) :

| Sous-menu | Libellé menu | Écran WINDEV (`FEN_*`) | Description & fonctionnalités |
| :--- | :--- | :--- | :--- |
| **Général** | Général | `FEN_Fiche_Hotel` | Identification et coordonnées juridiques de l'établissement (raison sociale, adresse, BP, téléphone, fax, email, site web, slogan, RC, ICE, CNSS, logo). |
| **Information général** | Nationalité | `FEN_Table_Nationalités` | Référentiel des nationalités (alimentation du Cardex, fiche de police, statistiques de fréquentation). |
| | Langue | `FEN_Table_Langue` | Langues parlées par les clients (Langue 1 / Langue 2 dans le Cardex). |
| | Segmentation | `FEN_Table_Segment` | Nature / segment commercial du client (Walk-in, Agence, Tour-Opérateur, Société, Centrales de réservation, etc.). |
| | Classification | `FEN_Table_Classification` | Classification client (ex. `STD`, `BASIC`, `VIP`). |
| | Piste commerciale | `FEN_Table_Piste` | Canal / origine d'acquisition complétant la segmentation (Direct, Booking, Expedia, E-mailing, Téléphone, etc.). |
| | Remises | `FEN_Table_Remises` | Barème des remises applicables sur les services/arrangements. |
| | Compte trésorerie | `FEN_Table_Trésorerie` | Paramétrage des caisses et comptes bancaires (ex. `CAISSE RECEPTION`). |
| | Cours de change | `FEN_Table_TCHNG` | Taux de change du jour par devise (consultable depuis la saisie de réservation et les arrhes). |
| **Hôtel** | Vue hôtel | `FEN_Table_Vues_chambre` | Référentiel des vues et situations des chambres (piscine, mer, jardin, montagne, boulevard). |
| | Type de chbre | `FEN_Table_Type_chambre` | Catégories de chambres (ex. `DBL`, `TWN`, `TRP`, `QDR`, `GLSTD`, `GLSUP`, `TSTD`, `TSUP`). |
| | Chambre *(Ctrl+A)* | `FEN_Table_Chambres` | Référentiel des chambres, suites et salles de conférence (numéro, étage, type, vue, nature, situation, capacité max, description, tarif de base, statut actif/inactif). |
| **Cardex** | Client | `FEN_Table_F_CPTFACTURATION` | Répertoire des comptes de facturation / débiteurs : agences, sociétés, intermédiaires, conventions et arrangements contractuels, ICE/RC, adresse de facturation (ex. `CL00001` Individuel Hôtel, `CL00014` ECOMED, etc.). |
| | Occupant | `FEN_Table_F_CLIENT` | Fiches individuelles d'identité des clients hébergés (nom, prénom, type/N° pièce d'identité CIN/Passeport, nationalité, date de naissance, adresse, langues, fumeur/habitué, historique commentaires). |
| **Constants** | Contrôle des chambres | `FEN_Table_P_CCHBRE` | Paramétrage des règles/codes de contrôle des chambres. |
| | État des chambres | `FEN_Table_P_ECHBRE` | Codes d'états housekeeping/occupation (`LS` Libre Sale, `LP` Libre Propre, `OC` Occupée, `HS` Hors Service, etc.). |
| | Libellé tâches | `FEN_Table_P_LIBTACH` | Référentiel des tâches gouvernante / entretien. |
| | Services | `FEN_Table_P_SERVICES` | Catalogue des services, produits et points de vente (ex. `HEB` / `LSTD` Hébergement, `PD` Petit-déjeuner, `REST` Restaurant, `TPT` Taxe Promotion Touristique, `TS` Taxe de séjour, `LBB` Lit bébé, buanderie, extras, taux TVA). |
| | Groupe des services | `FEN_Table_F_GRPSRV` | Regroupement analytique des services (Hébergement, Restauration, Taxes, Extras). |
| | Arrangement *(Ctrl+A)* | `FEN_Table_P_EARRANG` | Packages / pensions prédéfinis combinant hébergement + repas (BB/DP/PC) + taxes selon saison/convention (ex. `BB-SGL`, `BB-DBL`, `CNBSSP`). |
| | Codes journaux | `FEN_Table_CodeJournal` | Codes journaux comptables/trésorerie (ex. `CAI` Caisse). |
| | Série | `FEN_Table_P_SERIE1` | Séries de numérotation des pièces : Facture (`N°/AA`), Note, Avoir, etc. |
| | Mode de règlement | `FEN_Table_P_MODERGL` | Moyens de paiement acceptés (Espèces `ESP`, Carte Crédit `CC`, Chèque, Virement, Crédit/Débiteur divers). |
| | Plan comptable | `FEN_PlanComptable` | Plan comptable général pour imputation comptable des services et règlements. |
| | Sections analytiques / Codes affaires | `FEN_Table_F_SECTION_ANALYTIC` | Ventilation analytique. |
| | Libellé pré-enregistré | `FEN_Table_P_LIB` | Libellés standards pour opérations de caisse/facturation. |
| | Groupe de facturation / Libellé de facturation | `FEN_Table_F_GROUPFACTURATION` | Regroupements de lignes pour l'édition compacte ou groupée des factures/notes (`HEBERGEMENT`, `REPAS`, `TAXES`). |
| | Groupe de nationalité | `FEN_Table_GROUPNAT` | Regroupement des nationalités par zones géographiques pour statistiques. |
| **Configuration** | Sup. temporaires | *(Script `HSupprimeTout(T_CHRSV)`)* | Purge de la table temporaire de réservation de chambres (`T_CHRSV`). |
| | Services composants | `FEN_ServicesComposants` | Composition de services / articles composés. |
| | Structure de fichier | `FEN_Table_FICHIER_DONNEES` | Inspection/paramétrage des structures de fichiers d'import/données. |
| | Importation des données | `FEN_IMPORTATION` | Utilitaire d'import de données externes. |
| | Requête SQL | `FEN_ExecuterSql` | Console d'exécution directe de requêtes SQL sur la base HFSQL. |
| | Réajustement des cumuls | `FEN_RECALCULESYT` | Recalcul des tables de synthèse/cumuls d'occupation (`F_SYT1`, etc.). |
| | Importer modèle d'impression | `FEN_IMPORT_MODEL` | Gestion et importation des modèles d'états externes `.wde` (`MODEL_IMPRESSION.fic`). |

---

#### Module 2 — Réservation (Individuel & Groupe)

Documenté en détail dans `Manuel de formation Flex PMS Reservation.docx` (34 captures) et `Introduction Flex PMS.docx` (**9 écrans**) :

| Sous-menu | Libellé menu | Écran WINDEV (`FEN_*`) | Fonctionnalités détaillées & Règles métier |
| :--- | :--- | :--- | :--- |
| **Planification** | Visual planning | `FEN_VISUEL_PLANNING` | Planning graphique chambres × dates ; clic droit contextuel (`Modifier la réservation sélectionnée`, `Saisie rapide de la transaction`, etc.) ; navigation mensuelle (`<<`, `>>`), actualisation, filtres par étage/type, volet d'information rapide et grille de disponibilité en pied de page. |
| | Floor planning | `FEN_FloorPlanning` | Vue par étage (boutons `1`, `2`, `3`, `4`, `99` + sélecteur de date + `Charger`) affichant chaque chambre sous forme de carte : statut d'occupation (bandeau couleur), état housekeeping (liseré supérieur), occupant, dates, nuits, pax, badge type de chambre, boutons d'accès direct `Ouvrir` et `Extrat`. |
| | Disponibilité par Type chbre | `FEN_TYPECHBRE_DISPO` | Tableau croisé dynamique des disponibilités par type de chambre et par date (nombre de chambres physiques disponibles, événements, options, total à la vente sur 1 mois). |
| **Individuel** | Saisir | `FEN_RESERV_DISPO` *(puis fiche Réservation)* | 1) Sélection de la période (`Arrivée`, `Nuits`, `Départ`) et recherche d'une chambre disponible (`Chercher`).<br>2) Fiche de réservation complète :<br>• **Séjour & chambre :** dates, type, N° chambre, alerte automatique en cas de dépassement de capacité (3 choix : demander lit supplémentaire à la gouvernante, changer de chambre, ignorer).<br>• **Occupant principal & Conjoint / Liste des occupants :** recherche obligatoire dans le **Cardex** (ou création via `Nouveau`), ajout d'occupants multiples (Adultes/Enfants, pièce d'identité, nationalité, date de naissance, adresse, case occupant principal `Prp.`).<br>• **Classification client :** Segmentation + Origine/Piste.<br>• **Préfacturation / Arrangement :** sélection du `Client / Facturation` (société/agence/individuel), choix d'un arrangement prédéfini, cases `Petit déjeuner` / `Déjeuner` / `Dîner`, bouton `Appliquer l'arrangement`. Modification unitaire (`Qté`, `Prix`, `Remise %`), ajout/suppression de services, bouton `Voir le cours de change`, calcul du `Total prévisionnel`.<br>• **Options :** `Message`, `Observation`, `Lib. Occup.`, `Garantie`, case **`Verrouiller la réservation`** (empêche le déplacement de chambre), traçabilité (`Créé par`, `Dernière modif. par`). |
| | Saisie d'arrhes | `FEN_ARRHES` | Enregistrement d'un acompte / garantie sur réservation (`N° Réservation`, `N° Chambre`, `Client`, `Folio`, `Occupant`, `Mode de règlement`, `Trésorerie`, `Libellé`, `Montant`, calcul du reste en MAD et en %, consultation cours de change) + impression des documents liés (Fiche de police, Lettre de confirmation, Bulletin de réservation). |
| | Modification | `FEN_SELECTION_RSV` | Recherche multicritères des réservations (`Chercher`), ouverture (`Ouvrir`), création (`Nouvelle réservation`), annulation (`Marquer annulée`), accès à la **`Corbeille`** (liste des réservations annulées) avec fonction **`Réactiver`** pour restaurer une réservation annulée. |
| **Groupe** | Saisie dossier groupe | `FEN_DOSSIER_GROUPE` / `FEN_RESERV_GROUP` | Création d'un dossier groupe : choix des dates + `Chercher disponibilité` (tableau de dispo par type/jour), identification du `Master group.`, `Client`, `Segmentation`, `Origine`, `Message/Note/Libellé`, `Garantie`, `Verrouiller`, puis saisie de la **Pré-rooming list** (`Nbr Chbre`, `Type Chambre`, `Pax/Chbre`, `Arrangement`, `Nationalité`, contrôle automatique de non-dépassement de disponibilité, calcul `Total Pax` et `Total prévisionnel`). |
| | Rooming liste | *(onglet/écran Rack & attribution en masse)* | Gestion de la **Rooming list (Rack)** du groupe : **attribution des chambres en masse**, clôture / dé-clôture du dossier groupe, recherche, annulation et corbeille des groupes. |
| | Dossiers en cours | `FEN_DOSSIER_GROUPE_OPENED` | Suivi et modification des dossiers groupes ouverts / en cours. |

---

#### Module 3 — Front Office (Réception)

Identifié dans les captures des manuels (`25_image25.png`, `Introduction Flex PMS.docx`) et `sys_registre.FIC/.mmo` (**7 écrans**) :

| Sous-menu | Libellé menu | Écran WINDEV (`FEN_*`) | Fonctionnalités principales |
| :--- | :--- | :--- | :--- |
| **Général** | État d'hôtel en cours | `FEN_TAUX_OCCUPATION` | Tableau de bord temps réel de l'occupation du jour (chambres occupées, arrivées, départs, disponibles, taux d'occupation). |
| | Cardex | `FEN_Table_F_CLIENT` | Accès direct réception aux fiches clients/occupants. |
| | Messages | `FEN_CHAT` | Messagerie / consignes entre réceptionnistes et services connectés. |
| **Arrivées** | Walking in | `FEN_WALKIN_DISPO` | Prise en charge rapide d'un client de passage sans réservation préalable (sélection chambre disponible + check-in direct). |
| | Check in | `FEN_CHECK_IN` | Enregistrement des arrivées prévues individuelles (attribution/vérification chambre, fiche de police, passage en statut présent). |
| | Délogement | `FEN_DELOG` | Changement de chambre en cours de séjour (transfert de l'occupant et du folio vers une autre chambre). |
| **Arrivées groupe** | Groupes | `FEN_CHECKIN_BLOCK` | Check-in en masse / par bloc des chambres d'un groupe arrivé. |
| | Groupes en cours | `FEN_GROUPE_ENCOURS` | Suivi des groupes actuellement présents dans l'établissement. |

---

#### Module 4 — Caisse & Check-Out

Documenté de manière approfondie dans `Manuel Caisse Flex PMS.docx`, `Manuel de formation Flex PMS Caisse&CheckOut.docx` et `Manuel de formation Flex PMS Facturation.docx` (**4 écrans principaux**) :

| Libellé menu | Écran WINDEV (`FEN_*`) | Fonctionnalités détaillées & Règles métier |
| :--- | :--- | :--- |
| **Saisie transactions** *(Saisie rapide)* | `FEN_SAISIE_TRANSACTION` | Saisie rapide en rafale d'une même prestation/extra (minibar, parking, restaurant…) sur plusieurs chambres depuis un seul masque, ou via clic droit sur le Visual Planning (`Saisie rapide de la transaction`). Champs : `N° Résa` / `Folio` (`0=Extra`, `1=Société`, etc.), `Chambre`, `Bénéficiaire`, `Qté`, `Prix unitaire`, `Montant`. Boutons `Voir arrangement lié à cette réservation` et `Copier arrangement lié à cette réservation` (facturation rapide du forfait). |
| **Encaissement** | `FEN_ENCAISSEMENT` | Deux modes : **Encaissement compte client** (règlement sur note de séjour) et **Encaissement compte permanent** (règlement de comptes débiteurs/sociétés/salons). |
| **Facturation & Check out** | `FEN_checkOut` / `FEN_NOTE` | Écran cœur de la caisse individuelle. **Filtres :** `Num. chambre`, `Cpt Facturation`, `Occupant`, radio `Tout / Individuel / Groupe`, case clients en départ.<br>**Grille supérieure :** chambres/réservations (`No Chbre`, `No RSV`, `Occupant`, `Société/Groupe`, `Arrivée`, `Départ`, `NTS`, `Pax/chb`, `Message`).<br>**Grille inférieure :** transactions facturées (`Date`, `Type`, `Code`, `Libellé`, `Qté`, `P.U`, `TVA`, `Montant`, cadenas de verrouillage, `Bénéficiaire`, `Folio`), sélecteur `<Tous les Folios>` et totaux séparés pour **5 Folios (`Folio 1` à `Folio 5`)** + `Total`.<br>**10 actions métier :**<br>1. **`Facturer`** : ajout de nouvelles prestations.<br>2. **`Déduction`** : saisie d'une déduction de CA ou de règlement (en montant négatif) avec **commentaire obligatoire et explicite** pour piste d'audit comptable / commissaires aux comptes.<br>3. **`Transfert`** : transfert de lignes sélectionnées d'une note source vers **une autre chambre présente** ou vers **un compte permanent / Master groupe ou salon** (avec choix d'utiliser une facture existante ou d'en créer une nouvelle).<br>4. **`Folio`** : réaffectation d'une ligne entre les folios 1 à 5 (séparation hébergement société vs extras personnels).<br>5. **`Libellé`** : modification/personnalisation du libellé d'une ligne.<br>6. **`Imprimer`** : édition du relevé de compte (`ETAT_JOURNALCLIENT`) ou d'une **Note** (sans valeur fiscale) selon 3 présentations : **Note globale**, **Édition normale**, **Édition compacte** (regroupe les prestations en une ligne avec commentaire personnalisé).<br>7. **`Nettoyer`** : nettoyage/réorganisation des lignes de la note.<br>8. **`Paiement`** : saisie d'un ou plusieurs règlements (apparaissent en négatif en déduction du solde ; le système pré-remplit le solde total à régler).<br>9. **`Solder`** : validation de l'adresse de facturation obligatoire et génération de la **Facture finale** (mention `FACTURE`, numéro séquentiel, mode de règlement, récapitulatif TVA, montant en lettres).<br>10. **`Départ Client`** : libération automatique de la chambre dès que la note est soldée + possibilité d'ajouter un commentaire de satisfaction/insatisfaction au Cardex client. *(Bouton `Ouvrir fiche de réservation` également disponible.)* |
| **Check out groupe** | `FEN_CHECKOUT_BLOCK` | Départ en bloc de toutes les chambres d'un groupe (`N° Réservation`, `Arrivée`, `Départ`, `Groupe`). Permet de **retirer certaines chambres** du départ immédiat (double-clic pour les laisser présentes). Options de facturation des extras : radio **`Centralisation globale des extras`** ou **`Centralisation par chambre des extras`**. Boutons `Marquer Départ du groupe`, `Afficher les extras chambre sélectionnée`, `Départ`. |

---

#### Module 5 — Main Courante (Clôture journalière / Night Audit)

Identifié dans `sys_groupe.FIC` (« Main courante / End of day / Fin del día ») et `sys_registre.FIC/.mmo` (**1 écran central**) :

| Libellé menu | Écran WINDEV (`FEN_*`) | Fonctionnalités principales |
| :--- | :--- | :--- |
| **Night audit** | `FEN_END_OF_DAY` | Clôture journalière hôtelière (End of Day) : passation automatique des nuitées et arrangements de la journée dans le journal des ventes (`F_JNLV`), contrôle des arrivées non présentées (No-Show) et départs non effectués, mise à jour de la date hôtel et des tables de synthèse/occupation (`REQ_SUP_OCC_EOD`, `REQ_RECALCULE_OCC_CHAMBRE`). |

---

#### Module 6 — Gouvernante (Housekeeping)

Identifié dans `Introduction Flex PMS.docx` et `sys_registre.FIC/.mmo` (**4 écrans**) :

| Libellé menu | Écran WINDEV (`FEN_*`) | Fonctionnalités principales |
| :--- | :--- | :--- |
| **État de chambre** | `FEN_Table_EtatChambres` | Consultation et mise à jour en temps réel de l'état ménage/occupation des chambres (`LS`, `LP`, `OC`, `HS`, etc.) et suivi des tâches gouvernante. |
| **Lost and found** | `FEN_Table_F_LOSTFOUND` | Gestion des objets trouvés / perdus (enregistrement, chambre, date, description, statut de restitution). |
| **Chambre hors vente** | `FEN_CHBRE_HORSVENTE` | Mise hors vente temporaire (travaux, maintenance, blocage technique — `REQ_Chbre_hv`, `REQ_TCHRE_HV`) impactant la capacité active vendable (ex. 25 chambres totales / 24 actives à Makarim). |
| **Séparer/Grouper chambre** | `FEN_SeparerChbre` | Gestion des chambres communicantes / modulables (fusion en suite ou séparation en chambres indépendantes). |

---

#### Module 7 — Back Office & Trésorerie

Documenté en partie dans `Manuel Caisse Flex PMS.docx` (Reprise de facture + capture `06_image6.png`) et complété par `sys_registre.FIC/.mmo` (**6 écrans**) :

| Sous-menu | Libellé menu | Écran WINDEV (`FEN_*`) | Fonctionnalités détaillées |
| :--- | :--- | :--- | :--- |
| **Facturation** | Reprise de facture | `FEN_Factures` | Consultation, modification, clôture et réimpression de toute facture/note (`Type doc.`, `Compte`, période `Du / Au`, filtres : `Tous comptes / Compte permanent / Compte comptant`, `Soldée / Ouverte`, `Facturée / En attente`, `Présent / Départ`). Vue maître/détail avec onglets **`Lignes`** et **`Règlement`**, totaux en pied de grille, export direct vers Excel (`Table REQ_DOC ...xls`). Permet de traiter : factures soldées, transférées au back-office, en attente de transfert débiteurs divers, factures salons/groupes (master), factures au comptant et comptes permanents. |
| | Facturation | `FEN_Facturation` | Facturation différée / back-office (regroupement de notes de sociétés/agences sur compte débiteur en facture globale périodique, ex. facturation trimestrielle ECOMED). |
| **Opération trésorerie** | Encaissement | `FEN_OPERATION_CAISSE(1)` | Saisie d'une entrée de caisse / banque hors check-out direct. |
| | Décaissement | `FEN_OPERATION_CAISSE(-1)` | Saisie d'une sortie de caisse / dépense / remboursement. |
| | Virement Compte à Compte | `FEN_OPERATION_CAISSE(2)` | Transfert de fonds entre comptes de trésorerie (ex. versement caisse réception → banque). |
| | Journal / Interrogation trésorerie | `FEN_INT_CAISSE` | Consultation, pointage et édition des mouvements de trésorerie par journal, compte et mode de règlement. |

---

#### Module 8 — États, Statistiques & Requêteur

Extrait intégralement de `sys_registre.FIC/.mmo` (**20 écrans de restitution/analyse**) :

| Sous-menu | Libellé menu | Écran WINDEV (`FEN_*`) | Domaine métier |
| :--- | :--- | :--- | :--- |
| **Racine États** | Gestionnaire des requêtes | `FEN_GESTIONNAIRE_REQUETTE` | Exécution et paramétrage de requêtes SQL personnalisées (`sys_requetes.fic/.mmo`, `sys_param_req.fic`). |
| | Dossier groupe | *(Vue dossier groupe)* | Synthèse imprimable d'un dossier groupe. |
| **Ventes et encaissements** | Main courante | `FEN_ET_MAIN_COURANTE` | État journalier de la main courante hôtelière. |
| | Détail des ventes | `FEN_ET_DETAIL_VENTE` | Journal détaillé des ventes par prestation / chambre / folio. |
| | État de chiffre d'affaire | `FEN_ET_CHIFFRE_AFFAIRE` | Synthèse du CA par période et axe d'analyse. |
| | Analyse des ventes - Services | `FEN_ET_ANALYSEVENTE` | Ventilation du CA par service / famille de services. |
| | Analyse des ventes - Chambres | `FEN_ET_ANALYSEVENTE_CHAMBRES` | Ventilation du CA par chambre / type de chambre. |
| | Extras d'hôtel | `FEN_ET_EXTRA_HOTEL` | Suivi des extras facturés (appliqués / comptables). |
| | Documents en cours | `FEN_ET_LST_DOCUMENT` | Liste des factures et notes ouvertes / en cours. |
| | Contrôle trésorerie | `FEN_ET_CONTROLE_TRESORERIE` | Contrôle de caisse et ventilation des encaissements par mode de règlement. |
| **Réservation** | Disponibilité par Type chbre | `FEN_TYPECHBRE_DISPO` | Prévisionnel de disponibilités par catégorie de chambre. |
| | Préparation restaurant | `FEN_ET_RESTAURANT` | Prévisionnel des couverts (petits-déjeuners, déjeuners, dîners) selon les arrangements en cours. |
| | Liste des réservations | `FEN_ET_LST_RESERV` | État des réservations sur une période. |
| | Liste des arrivées | `FEN_ET_LST_ARRIVEE` | Arrivées effectives et prévues du jour / jusqu'au. |
| | Liste des départs | `FEN_ET_LST_DEPART` | Départs effectifs et prévus du jour / jusqu'au. |
| | Liste des annulations | `FEN_ET_LST_ANNULATION` | Historique des réservations annulées. |
| | Liste des no-show | `FEN_ET_LST_NOSHOW` | Liste des non-présentations (No-Show). |
| | Liste des groupes | `FEN_ET_LST_GROUPE` | Récapitulatif des réservations groupes. |
| **Gouvernante** | État des chambres et tâche gouvernante | `FEN_ET_CONTROLE_GOUV` | Feuille de contrôle gouvernante (statut des chambres, départs, recouches, tâches). |
| **Clients** | Grand livre client | `FEN_ET_GRAND_LIVRE_TIERS` | Historique détaillé des factures, notes et règlements par compte client (`Table REQ_GrandLivreClient.xls`). |
| | Balance des clients / Situation clients | `FEN_ET_BALANCECLIENT` | Balance âgée / soldes débiteurs clients (`REQ_BalanceClient`). |
| **Statistiques** | Analyse d'occupation / Occupation et analyse hôtel | `FEN_ET_OCCUPATION` / `FEN_OCC` | Statistiques journalières et annuelles d'occupation (`# Total`, `# Active`, `# Bloqué`, `# Disponible`, `# Vendu`, `Taux d'occupation`). |
| | État nationalités | `FEN_ET_NATIONALITE` | Statistiques arrivées / nuitées par nationalité (déclarations statistiques tourisme). |

---

#### Module 9 — Add-on WIFI

Présent dans `sys_registre.FIC/.mmo` (**2 écrans**) :

| Sous-menu | Libellé menu | Écran WINDEV (`FEN_*`) | Fonctionnalité |
| :--- | :--- | :--- | :--- |
| **Add-on, WIFI** | Type de code WIFI | *(Paramétrage durées/profils)* | Définition des profils de vouchers Wi-Fi. |
| | Codes WIFI | `FEN_Table_WF_CODES` | Stock et attribution automatique de codes Wi-Fi aux clients (`REQ_GETCODEWIFI`, `REQ_CONTEURCODEWIFI`), imprimables sur la fiche de bienvenue. |

---

## 2. Inventaire exhaustif des états d'impression et requêtes

### 2.1 États externes WINDEV (`.wde`) dans `./sources/Etats et requêtes/`

Le dossier `./sources/Etats et requêtes/` (plus la sous-copie dans `./sources/Flex PMS 9/Etats et requêtes/`) contient **49 fichiers `.wde`**, correspondant à **34 modèles distincts** (identifiés par empreinte MD5) et **15 copies/doublons** répartis entre la racine, les sous-dossiers `Facturation/`, `Note/`, `Reservation/`, `E/` (variantes « E » / avec règlements ou sans entête) et `old/`.

> **Note technique :** Les fichiers `.wde` portent les signatures WINDEV compilées `01F180062h` (WINDEV 18), `01F200066p` (WINDEV 20) et `20F200067s` (WINDEV 20 — modèles personnalisés Makarim du `09/07/2019`). Le dossier contient également 3 images graphiques d'habillage (`pic.png` et 2 fonds baroque `.jpg`/`.png` datés de juin–juillet 2019) et 1 tableau croisé Excel (`Reservation/Tableau croisé dynamique.xls`).

#### A. États de Réservation, Accueil & Police (9 fichiers uniques)

| Chemin relatif (`./sources/Etats et requêtes/`) | Taille | Dernière modif. | Version WD | MD5 | Usage fonctionnel |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `Reservation/Confirmation_Reservation.wde` | 43 160 o | 09/07/2019 | WD20 | `4BD607FB` | Lettre / attestation de confirmation de réservation (avec arrhes/acompte versé, durée, total, reste à payer). |
| `Reservation/ETAT_BulletienReservation.wde` | 54 573 o | 09/07/2019 | WD20 | `E054210C` | **Bulletin de réservation Makarim** (logo Hôtel Makarim, N° résa, origine, nationalité, dates, nuitées, pax/enfants, type chambre, arrangement, total, piste d'audit créateur/modif., pied juridique). Confirmé par `ETAT_BulletienReservation.rtf` et le PDF 2025. |
| `Reservation/Fiche_de_bienvenue_mAKARIM.wde` | 72 584 o | 09/07/2019 | WD20 | `BDCAD99E` | **Fiche de bienvenue personnalisée Hôtel Makarim** (accueil client au check-in, infos séjour, Wi-Fi). |
| `E/Fiche_de_bienvenue.wde` | 71 116 o | 13/05/2018 | WD20 | `C15A908D` | Variante standard « E » de la fiche de bienvenue. |
| `ETAT_BIENVENU_A44.wde` | 46 209 o | 29/03/2018 | WD20 | `2923D4C0` | Ancien modèle de fiche de bienvenue (hérité de la base modèle `A44`). |
| `E/Bulletin_individuel.wde` | 59 652 o | 13/05/2018 | WD20 | `C452FD56` | Bulletin individuel d'inscription / fiche client (variante `E`). |
| `ETAT_BULLETIN_INDIV.wde` | 59 983 o | 23/12/2017 | WD20 | `2F9D7BE7` | Bulletin individuel d'inscription (modèle racine). |
| `Fiche_police.wde` | 40 420 o | 29/03/2018 | WD20 | `F1580735` | **Fiche de police réglementaire marocaine** (identité client, CIN/Passeport, nationalité, provenance/destination, profession, chambre, dates). |
| `ETAT_FPOLICE_A44.wde` | 46 516 o | 03/01/2018 | WD20 | `AB634E60` | Ancienne variante fiche de police (`A44`). |

#### B. États de Facturation (13 fichiers, dont 11 uniques)

| Chemin relatif (`./sources/Etats et requêtes/`) | Taille | Dernière modif. | Version WD | MD5 | Usage fonctionnel |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `Facturation/ETAT_FACTURE.wde` *(copie identique à la racine)* | 40 827 o | 04/01/2018 | WD20 | `E8831261` | Facture détaillée standard (lignes de prestations, TVA, taxes TPT+TS, total TTC en chiffres et lettres). |
| `Facturation/ETAT_FACTURE_E.wde` | 38 295 o | 18/01/2018 | WD20 | `E5ABC02C` | Facture standard — variante `E` (probablement pour papier à en-tête pré-imprimé ou version allégée). |
| `ETAT_FACTURE_ARRANG.wde` *(racine)* | 36 601 o | 04/01/2018 | WD20 | `FF950478` | Facture regroupée par arrangement (`REQ_IMP_FACTURE_GRP_ARRANG`), révision 17h12. |
| `Facturation/ETAT_FACTURE_ARRANG.wde` | 36 038 o | 04/01/2018 | WD20 | `FE9EBF67` | Facture par arrangement (révision antérieure 13h47). |
| `Facturation/ETAT_FACTURE_ARRANG_E.wde` | 33 961 o | 18/01/2018 | WD20 | `55C88EBE` | Facture par arrangement — variante `E`. |
| `Facturation/ETAT_FACTURE_GROUPE.wde` *(copie identique à la racine)* | 36 256 o | 04/01/2018 | WD20 | `23712AA1` | Facture consolidée Groupe (`REQ_IMP_FACTURE_GROUPE`). |
| `Facturation/ETAT_FACTURE_GROUPE_E.wde` | 33 056 o | 18/01/2018 | WD20 | `C7DC7905` | Facture Groupe — variante `E`. |
| `ETAT_FACTURE_CPT.wde` *(racine)* | 25 217 o | 15/12/2017 | WD20 | `28738900` | Facture comptable / compte client (`REQ_IMP_FACTURE_CPT`) — version WD20. |
| `Facturation/ETAT_FACTURE_CPT.wde` | 20 741 o | 15/08/2017 | WD18 | `13D54EA2` | Facture comptable — ancienne version WD18. |
| `ETAT_DOCUMENT.wde` *(racine)* | 27 395 o | 23/12/2017 | WD20 | `2FDBC29D` | État générique de document commercial (`REQ_IMP_DOCUMENT`) — version WD20. |
| `Facturation/ETAT_DOCUMENT.wde` | 24 424 o | 23/05/2017 | WD18 | `C627354B` | État générique de document — ancienne version WD18. |
| `Facturation/fac.wde` | 20 566 o | 16/08/2017 | WD18 | `D7A8C902` | Modèle de facture simplifié / brouillon historique (WD18). |

#### C. États de Notes & Relevés de compte (27 fichiers, dont 14 uniques)

| Chemin relatif (`./sources/Etats et requêtes/`) | Taille | Dernière modif. | Version WD | MD5 | Usage fonctionnel |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `E/Note_Standard.wde` | 47 341 o | 13/05/2018 | WD20 | `1F48AEC3` | Note / Facture présentation standard (synthèse par groupe : `HEBERGEMENT`, `REPAS`, `TAXES`) — version `E` (avec logo/pied). |
| `E/Note_Standard_Reglement.wde` | 50 907 o | 13/05/2018 | WD20 | `B928E6F8` | Note standard **incluant le détail des règlements**. |
| `E/Note_Detail.wde` | 47 575 o | 13/05/2018 | WD20 | `B550FDBB` | Note / Facture détaillée ligne par ligne — version `E`. |
| `E/Note_Detail_Reglement.wde` | 51 126 o | 13/05/2018 | WD20 | `B3AF7E30` | Note détaillée **incluant les règlements**. |
| `E/Note_Groupe.wde` | 48 882 o | 26/04/2018 | WD20 | `D33BF45F` | Note / Facture consolidée pour dossier groupe — version `E`. |
| `E/Note_Groupe_Reglement.wde` | 52 693 o | 13/05/2018 | WD20 | `DF09552D` | Note groupe **incluant les règlements**. |
| `Note/Note_Standard.wde` *(4 copies identiques : racine, `Note/`, `old/`, `Flex PMS 9/Etats et requêtes/`)* | 32 728 o | 29/03/2018 | WD20 | `B0511D81` | Note standard (modèle mars 2018 sans sous-bloc règlement). |
| `Note/Note_Detail.wde` *(4 copies identiques : racine, `Note/`, `old/`, `Flex PMS 9/Etats et requêtes/`)* | 32 762 o | 29/03/2018 | WD20 | `B6D5A704` | Note détaillée (modèle mars 2018). |
| `Note/Note_Groupe.wde` *(4 copies identiques : racine, `Note/`, `old/`, `Flex PMS 9/Etats et requêtes/`)* | 33 957 o | 29/03/2018 | WD20 | `19047C5B` | Note groupe (modèle mars 2018). |
| `Note/ETAT_NoteStandard.wde` *(copie identique à la racine)* | 33 462 o | 21/02/2018 | WD20 | `B30DAB2B` | Ancien modèle Note standard (fév. 2018). |
| `Note/ETAT_NoteDetail.wde` *(copie identique à la racine)* | 33 769 o | 21/02/2018 | WD20 | `D4B9D4A0` | Ancien modèle Note détaillée (fév. 2018). |
| `Note/ETAT_NoteGroupe.wde` *(copie identique à la racine)* | 33 748 o | 21/02/2018 | WD20 | `CACCB8CA` | Ancien modèle Note globale/groupe (fév. 2018). |
| `Note/ETAT_NoteGroupe2.wde` | 33 837 o | 10/03/2018 | WD20 | `40E26981` | Variante Note groupe v2 (mappée sur « standard » dans `MODEL_IMPRESSION.fic`). |
| `Note/ETAT_NoteGroupe2_hm.wde` | 30 401 o | 23/02/2018 | WD20 | `B70E703C` | Variante Note groupe v2 spécifique **Hôtel Makarim** (`_hm`, mappée sur « global » dans `MODEL_IMPRESSION.fic`). |

---

### 2.2 Modèles d'impression configurés (`MODEL_IMPRESSION.fic`)

L'extraction de `commun/configuration/sa/MODEL_IMPRESSION.fic` révèle les **15 associations actives** entre catégories d'impression et fichiers `.wde` :

- **Facturation :** `Facture comptable` → `ETAT_FACTURE_CPT.wde` · `FACTURE GROUPE` / `Facture standard` → `ETAT_FACTURE_GROUPE.wde` · `facture` → `ETAT_FACTURE.wde` · `fac_std` / `fac_detail` / `fac_grp` → `ETAT_FACTURE_ARRANG.wde`
- **Note :** `Note Detail` → `ETAT_NoteDetail.wde` · `NoteGlobale` → `ETAT_NoteGroupe.wde` · `global` → `ETAT_NoteGroupe2_hm.wde` · `standard` → `ETAT_NoteGroupe2.wde`
- **Réservation :** `Bulletin Individuel A44` → `ETAT_BULLETIN_INDIV.wde` · `Fiche police A44` → `ETAT_FICHE_POLICE.wde` · `kawtar` → `ETAT_FPOLICE_A44.wde`

---

### 2.3 Requêtes SQL externes (`.sql`) et requêtes personnalisées (`sys_requetes`)

#### A. Fichiers `.sql` trouvés dans `./sources/Etats et requêtes/` (3 requêtes uniques)

1. **`solde clients.sql`** *(également dupliqué dans `old/` et `Flex PMS 9/Etats et requêtes/` — 02/05/2017)* — Balance globale factures / règlements / soldes par compte de facturation (`F_FC`) :
```sql
SELECT
  CPT_FAC AS CPT,
  COMPLEMENT_FC AS INTITULE,
  SUM(TOTALTTC_FC) AS FACTURES,
  SUM(TOTALTTC_FC - RESTEAPAYE_FC) AS REGLEMENTS,
  SUM(RESTEAPAYE_FC) AS SOLDE
FROM F_FC
GROUP BY CPT_FAC, COMPLEMENT_FC
```

2. **`PrixMoyenneDeVente.sql`** *(29/07/2019)* — Calcul du Prix Moyen de Vente (PM / ADR HT hors taxes de séjour de 11 MAD/pax) sur les chambres réservées à une date donnée (`F_RML`) :
```sql
SELECT AVG((prix / nbr_nuits) - (11 * nbr_pax_rl)) AS PM
FROM F_RML
WHERE prix <> 0
  AND code_etatgh = 'RSV'
  AND '20190807' BETWEEN arrivee_gh AND depart_gh
```

3. **`TablePrixMoyenneDeVente.sql`** *(29/07/2019)* — Détail par chambre du Prix Moyen HT (`F_RML`) :
```sql
SELECT
  NUM_CHAMBRE AS Chambre,
  CODE_TYPE_CHAMBRE AS Type,
  IDGESTHOT AS Reservation,
  Arrivee_gh AS Arrivée,
  Depart_gh AS Depart,
  NBR_NUITS AS Nuitée,
  NBR_PAX_RL AS Pax,
  Occupant AS Occupant,
  IDNationalités AS Nationalité,
  prix AS Total,
  ((prix / nbr_nuits) - (11 * nbr_pax_rl)) AS PrixMoyenneHT
FROM F_RML
WHERE prix <> 0
  AND code_etatgh = 'RSV'
  AND '20190730' BETWEEN arrivee_gh AND depart_gh
```

#### B. Requêtes personnalisées stockées dans le Gestionnaire de requêtes (`sys_requetes.fic/.mmo` & `sys_param_req.fic`)

| Catégorie | Nom de la requête | Paramètres (`sys_param_req.fic`) | Requête SQL extraite (`sys_requetes.mmo`) |
| :--- | :--- | :--- | :--- |
| **Cardex > Client** | Liste les clients | `{NOM}` *(Chaîne : « Nom a chercher »)* | `SELECT * FROM F_CLIENT WHERE F_CLIENT.PRENOM_CLIENT LIKE {NOM}` |
| **Référentiel** | Nationalités | *(aucun)* | `SELECT * FROM Nationalités` |
| **Listes** | Liste des chambres facturées | *(aucun)* | `SELECT F_JNLV.DATE_JV, NUM_CHAMBRE, COUNT(NUM_CHAMBRE) FROM F_JNLV WHERE code_srv = 'LSTD' GROUP BY F_JNLV.DATE_JV, NUM_CHAMBRE` |
| **Listes / Requête système** | Liste des chambres occupées / État de chambre (Admin) | `{date}` *(Date : « Entrer date de controle »)*, `{NumChbre}` *(« Entrer Num Chambre »)* | Jointure `F_RML` × `F_RSV` sur `IDGESTHOT` filtrée par `ARRIVEE_GH <= {date} AND DEPART_GH >= {date} AND NUM_CHAMBRE = {NumChbre}` (retourne 26 colonnes : `IDROOMING_LIST`, `CODE_ETATGH`, `ARRIVEE_GH`, `DEPART_GH`, `NBR_PAX_RL`, `NBR_ENFANT_RL`, `NUM_CHAMBRE`, `CODE_TYPE_CHAMBRE`, `CODE_CLIENT`, `IDGESTHOT`, `IDNationalités`, `CODE_ARRANG`, `PRIX`, `Occupant`, `NBR_NUITS`, `CPT_FAC`, `MESSAGE_RL`, `DEPARTPREVU_GH`, champs d'audit, `IDPiste`, `IDSegment`, `SOCIETE_GH`). |

---

### 2.4 États intégrés (`ETAT_*`) compilés dans `Flex PMS.wdl`

L'extraction binaire de `Flex PMS.wdl` a révélé **41 états d'impression internes** nativement intégrés à l'exécutable :

| Domaine métier | Nombre | Liste exhaustive des états internes (`ETAT_*`) |
| :--- | :---: | :--- |
| **Réception — Arrivées, Départs, Présents & Réservations** | 16 | `ETAT_ARREVE`, `ETAT_ARREVEPREVU`, `ETAT_ARREVEETPREVU`, `ETAT_ARRIVEEPREVUjuquau`, `ETAT_DEPART`, `ETAT_DEPARTPREVU`, `ETAT_DEPARTETPREVU`, `ETAT_DEPARTPREVUjuquau`, `ETAT_PESENT` *(présents)*, `ETAT_NSHOW`, `ETAT_LST_ARRIVEES`, `ETAT_LST_DEPART`, `ETAT_LST_RESERVATION`, `ETAT_LST_ANNULATION`, `ETAT_LST_NOSHOW`, `ETAT_Confirmation_Reservation`, `ETAT_Demande_d_arrhes` *(total 17 avec Demande d'arrhes)* |
| **Main courante, CA & Ventes** | 9 | `ETAT_MAIN_COURANTE`, `ETAT_CA_CHAMBRE`, `ETAT_CA_TYPECHAMBRE`, `ETAT_CA_CPTFAC`, `ETAT_CA_SEGMENTATION`, `ETAT_CA_PISTECOMMERCIALE`, `ETAT_EXTRASHOTEL`, `ETAT_EXTRASHOTEL_APPLI`, `ETAT_EXTRASHOTEL_CPT` |
| **Caisse, Trésorerie & Clients** | 6 | `ETAT_JNL_TRESO`, `ETAT_JNL_TRESO_CPT`, `ETAT_JNL_TRESO_GRP_MODE` *(confirmé par export RTF)*, `ETAT_JNL_TRESO_JOURS`, `ETAT_JNL_CPT`, `ETAT_JOURNALCLIENT` *(confirmé par capture `17_image17.png` : « Détail des ventes et encaissement client »)* |
| **Facturation & TVA** | 3 | `ETAT_PIED_FAC`, `ETAT_PIED_FAC1`, `ETAT_RAPORT_CORRECTIONTVA` |
| **Gouvernante (Housekeeping)** | 1 | `ETAT_CONTROLE_GOUV` *(feuille de contrôle gouvernante)* |
| **Restauration (Prévisions)** | 1 | `ETAT_Restaurant` *(état de préparation restaurant / couverts)* |
| **Statistiques (Arrivées / Nuitées)** | 3 | `ETAT_STATISTIQUE_ENTETE`, `ETAT_STATISTIQUE_ARRIVEES`, `ETAT_STATISTIQUE_NUITEES` |
| **Technique / Style** | 1 | `ETAT_style` *(feuille de style commune des états)* |

---

### 2.5 Requêtes intégrées (`REQ_*`) compilées dans `Flex PMS.wdl`

L'extraction de `Flex PMS.wdl` a identifié **173 requêtes internes (`REQ_*`)**, organisées par domaine fonctionnel :

- **Réservations, Rooming list & Groupes (24) :** `REQ_RSV`, `REQ_RESERVATION`, `REQ_ETATRSV`, `REQ_LISTE_RSV`, `REQ_Lst_resevation`, `REQ_LISTE_RSV_GROUPE`, `REQ_LISTE_RSV_GROUPE_OPENED`, `REQ_Groupe_Arrive`, `REQ_Groupe_Encours`, `REQ_ConteurEtatRSVGroupe`, `REQ_RML`, `REQ_RML_RSV_CHBRE`, `REQ_NbreRmlRSV`, `REQ_FirstDateRML`, `REQ_LastDateRML`, `REQ_GET_NEXT_RSV`, `REQ_GET_PREVIOUS_RSV`, `REQ_STX_RESERVATION_CLIENT`, `REQ_Etat_Conf_reservation`, `REQ_FICHEPOLICE`, `REQ_FICHEWELCOME`, `REQ_RECHERCHE_CLIENT`, `REQ_RECHERCHE_OCCUPANT2`, `REQ_RECHERCHE_VISUELPLANNING`.
- **Arrivées, Départs, Présents & No-Show (16) :** `REQ_ARREVE3`, `REQ_ARREVE31`, `REQ_ARREVE32`, `REQ_ARREVE33`, `REQ_DEPART`, `REQ_DEPART2`, `REQ_DEPART2_copie`, `REQ_DEPART3`, `REQ_DEPART31`, `REQ_DEPART32`, `REQ_DEPART33`, `REQ_CONT_DEPART_PREVU`, `REQ_Lst_depart`, `REQ_PRESENT`, `REQ_LST_NSHOW`, `REQ_TCHBRE_NSH`.
- **Planning, Chambres, Disponibilités & Gouvernante (24) :** `REQ_Planning`, `REQ_ChambrePlanning`, `REQ_AffichageFloor`, `REQ_FloorPlanning`, `REQ_FloorPlanning2`, `REQ_Etages`, `REQ_CHAMBRE_DISPO`, `REQ_CHBREOCC`, `REQ_CHBRES`, `REQ_CHBRES1`, `REQ_ChambreSource`, `REQ_Chbre_hv`, `REQ_TCHRE`, `REQ_TCHRE_ACTIVE`, `REQ_TCHRE_HV`, `REQ_TCHBRE_PARETAT`, `REQ_EtatChambre`, `REQ_ET_CONTROLE_GOUVERNANTE`, `REQ_Global_Vision`, `REQ_To_Par_TypeCh`, `REQ_OCC`, `REQ_EOCC`, `REQ_OccupationYear`, `REQ_RECALCULE_OCC_CHAMBRE`.
- **Arrangements, Services & Extras (15) :** `REQ_ARRANG_LISTEVALID`, `REQ_ARRANGEMENT_APPLIQUER`, `REQ_ArrangementActive`, `REQ_ARRENGEMENT_ACTIVE`, `REQ_ARRENGEMENT_ACTIVE_svg`, `REQ_ARRENGEMENT_AFFICHE`, `REQ_ARRG_CPTFACTURE`, `REQ_LIGNE_ARRANGEMENT`, `REQ_LAP`, `REQ_LAP_AFFICHE`, `REQ_SERVICES_EXTRA`, `REQ_EXTRAHOTEL`, `REQ_EXTRAHOTEL_APP`, `REQ_EXTRAHOTEL_CPT`, `REQ_Restaurant`.
- **Facturation, Notes, Documents & Folios (34) :** `REQ_DOC`, `REQ_DocEtResv`, `REQ_DETAIL_DOC`, `REQ_DETAIL_DOC_Fac`, `REQ_DETAIL_DOC_Rgl`, `REQ_LIGNE_DOC`, `REQ_LIGNE_FACTURE`, `REQ_AFFICHE_DETAIL`, `REQ_AFFICHER_TRANSACTION_RML`, `REQ_AFFICHER_TRANSACTION_RML_tout`, `REQ_FAC_PERMANENT`, `REQ_FactureGroupe`, `REQ_FC_IDRSV`, `REQ_IMP_DOCUMENT`, `REQ_IMP_FACTURE_CPT`, `REQ_IMP_FACTURE_GROUPE`, `REQ_IMP_FACTURE_GRP_ARRANG`, `REQ_IMPFACTURE_DETAIL`, `REQ_IMPFACTURE_GROUP`, `REQ_PIEDFACTURE`, `REQ_MAJ_TOTAL_FAC`, `REQ_TOTAL_FACTURE`, `REQ_RESTE_A_PAYE_FAC`, `REQ_RGL_FACTURE`, `REQ_NOTE_FACTURE`, `REQ_NoteAFacturer`, `REQ_NoteDetail`, `REQ_NoteGroupe`, `REQ_NoteJournal`, `REQ_NoteNonSolder`, `REQ_NoteReservation`, `REQ_NoteStandard`, `REQ_NbreNoteReservation`, `REQ_TotalHTNoteparTypeService`, `REQ_TotalReglementNote`, `REQ_TotalTTCetHTNote` *(36 requêtes au total)*.
- **Main courante, Journaux de ventes, CA & Trésorerie (24) :** `REQ_MAIN_COURANTE`, `REQ_ET_MAINCOURANT`, `REQ_JNLV`, `REQ_JNLV_FOLIO`, `REQ_JNLV_Trans`, `REQ_JNLVente`, `REQ_JNLVenteChbre`, `REQ_DetailJNL_GRPSRV`, `REQ_GetNotedeJNL`, `REQ_JNL_CLIENT`, `REQ_JNLCPT`, `REQ_JNLCaisse`, `REQ_JNL_TRESORERIE`, `REQ_JNL_TRESORERIE_CLS`, `REQ_JNL_TRESORERIE_CPT`, `REQ_JNL_TRESORERIE_JOURS`, `REQ_JNL_TRESORERIE_MODERGL`, `REQ_EncaissementDuJourRML`, `REQ_CA_Chambre`, `REQ_CA_CPTFAC`, `REQ_CA_PisteCommerciale`, `REQ_CA_Segmentation`, `REQ_CA_TypeChambre`, `REQ_BalanceClient`, `REQ_GrandLivreClient` *(25 requêtes au total)*.
- **Statistiques, Nationalités & Synthèses (16) :** `REQ_ET_NATIONALITE`, `REQ_ET_NAT_ARRVRE`, `REQ_ET_NAT_PRESENT`, `REQ_FINDNAT`, `REQ_FINDNAT_ARR`, `REQ_GroupNatOrdre`, `REQ_JournalNat`, `REQ_RecapEtatNat`, `REQ_TouverNationalite`, `REQ_JNLSYTH`, `REQ_JNLSYTH2`, `REQ_SYTH_ARR`, `REQ_SYTH_PRE`, `REQ_TableOccupationSyth`, `REQ_NumerosOcc_Date`, `REQ_NumerosOcc_Date2`, `REQ_NumerosOcc_Date3`, `REQ_NumerosOcc_DateSansGroup`, `REQ_OCI_RML` *(19 requêtes)*.
- **Purge / Clôture / Technique / WIFI (14) :** `REQ_SUP_LAP`, `REQ_SUP_OCC`, `REQ_SUP_OCC_EOD`, `REQ_SUP_OCI`, `REQ_SUPPR_SYTH`, `REQ_SupprimerChambreTamp`, `REQ_BureauDossier`, `REQ_GroupeRequete`, `REQ_Parametre_requete`, `REQ_MODEL_IMPRESSION`, `REQ_Session`, `REQ_TCHANGE`, `REQ_GETCODEWIFI`, `REQ_CONTEURCODEWIFI`.

---

## 3. Analyse approfondie des fichiers d'export réels (2025–2026)

### 3.1 Inventaire exhaustif des 26 fichiers d'export 2025–2026

Parmi les 53 fichiers d'export présents dans `./sources/Flex PMS 9/` (2019–2026), **26 fichiers datent de la période 2025–2026** (**21 `.xls`**, **4 `.rtf`**, **1 `.pdf`**), reflétant l'exploitation réelle quotidienne de l'Hôtel Makarim jusqu'au **29 juillet 2026** :

| Fichier (`./sources/Flex PMS 9/`) | Date modif. | Format / Structure | Période couverte | Volumétrie & Totaux constatés |
| :--- | :---: | :--- | :---: | :--- |
| `Table REQ_DOC JUILLET 2026.xls` | 29/07/2026 | XLS brut `REQ_DOC` (27 col.) | 01/07 – 29/07/2026 | 81 factures (`260..346 /26`) · **149 373,27 MAD TTC** |
| `Table REQ_DOC MAI 26.xls` | 12/06/2026 | XLS brut `REQ_DOC` (27 col.) | 01/05 – 31/05/2026 | 44 factures (`150..199 /26`) · **48 705,55 MAD TTC** |
| `Table REQ_DOC AVRIL 26.xls` | 07/05/2026 | XLS récap comptable (10 col.) | Avril 2026 | 67 factures (`81..154 /26`) · **142 781,00 MAD TTC** · 33 ICE |
| `Table REQ_DOC Février 2026.xls` | 12/03/2026 | XLS brut `REQ_DOC` (27 col.) | Février 2026 | 25 factures (`36..61 /26`) · **15 276,00 MAD TTC** |
| `Table REQ_ Janvier 2026 DOC.xls` | 08/02/2026 | XLS récap comptable (10 col.) | Janvier 2026 | 34 factures (`1..34 /26` + `338..340 /25`) · 17 ICE |
| `Table REQ_DOC DECEMBRE 2025.xls` | 19/01/2026 | XLS récap comptable (10 col.) | Décembre 2025 | 40 factures (`295..337 /25`) · **57 412,88 MAD TTC** · 27 ICE |
| `Confirmation_Reservation.rtf` | 10/01/2026 | RTF confirmation résa | 15/12 – 22/12/2025 | 1 attestation (7 nuits, 3 500 MAD, Carte Crédit) |
| `ETAT_BulletienReservation.rtf` | 10/01/2026 | RTF bulletin résa (`#14 307`) | 12/01 – 17/01/2026 | 1 bulletin (5 nuits, QDR, 3 pax, 3 500 MAD, `BB-SGL`) |
| `Table REQ_novembre 2025.xls` | 07/01/2026 | XLS récap comptable (10 col.) | Novembre 2025 | 33 factures (`260..294 /25`) · **49 311,58 MAD TTC** · 22 ICE |
| `Table REQ NOVEMBRE 2025.xls` | 07/01/2026 | XLS brut `REQ_DOC` (27 col.) | Novembre 2025 | 34 factures (`260..294 /25`) · **49 311,58 MAD TTC** |
| `Table REQ DECEMBRE.xls` | 07/01/2026 | XLS brut `REQ_DOC` (27 col.) | Décembre 2025 | 42 factures (`295..339 /25`) · **74 536,88 MAD TTC** |
| `Table REQ_DOC NOVEMBRE.xls` | 03/12/2025 | XLS récap comptable (10 col.) | Novembre 2025 | 33 factures (`260..294 /25`) · **49 311,58 MAD TTC** · 22 ICE |
| `Table REQ_DOC MOIS OCTOBRE 2025.xls` | 03/11/2025 | XLS récap comptable (10 col.) | Octobre 2025 | 35 factures (`220..259 /25`) · **100 309,00 MAD TTC** · 21 ICE |
| `HAT.xls` | 02/11/2025 | XLS occupation brute (7 col.) | 01/10 – 01/11/2025 | 32 jours · 347 vendues / 768 actives (moy. 11/j) |
| `Table REQ_DOC septembre 2025.xls` | 13/10/2025 | XLS récap comptable (10+3 col.) | Septembre 2025 | 37 factures (`184..224 /25`) · 24 ICE |
| `Table REQ_DOC MOIS NOVEMBRE.xls` | 09/10/2025 | XLS brut `REQ_DOC` (27 col.) | **Septembre 2025** *(mal nommé)* | 37 factures (`184..224 /25`) · **34 420,15 MAD TTC** |
| `Table F_SYT1.xls` | 04/10/2025 | XLS occupation brute (7 col.) | 01/09 – 30/09/2025 | 30 jours · 342 vendues / 720 actives (`#Total=25`, moy. 11/j) |
| `Table statistique mois septembre.xls` | 02/10/2025 | XLS occupation retraitée (7 col.) | 01/09 – 30/09/2025 | 30 jours · 342 vendues / 720 (`#Total=24`, **TO = 47,50 %**) |
| `bulletin de reservation du anas laghrich.pdf` | 25/09/2025 | PDF bulletin résa (`#13 849`) | 26/09 – 28/09/2025 | 1 bulletin (2 nuits, DBL, 2 pax, 900 MAD, `BB-DBL`) |
| `Table REQ_DOC MOIS Aôut 2025.xls` | 25/09/2025 | XLS récap comptable (10 col.) | Août 2025 | 34 factures (`145..183 /25`) · 12 ICE |
| `STATISTIQUE DU MOIS AÖUT.xls` | 06/09/2025 | XLS occupation brute (7 col.) | 01/08 – 31/08/2025 | 31 jours · 604 vendues / 744 actives (moy. 19/j, **TO ≈ 81,2 %**) |
| `ETAT D'OCCUPATION DU MOIS AÖUT.xls` | 01/09/2025 | XLS occupation brute (7 col.) | 02/08 – 31/08/2025 | 30 jours · 588 vendues / 720 actives (moy. 20/j) |
| `Table REQ_DOC JUILLET 2025.xls` | 14/08/2025 | XLS brut `REQ_DOC` (27 col.) | Juillet 2025 | 56 factures (`89..152 /25`) · **74 885,22 MAD TTC** |
| `facture province Tétouan.rtf` | 14/08/2025 | RTF facture groupe personnalisée | 18/07 – 08/08/2025 | Facture `153 /25` · 4 chambres · 8 techniciens avec CIN · **37 300,00 MAD** |
| `FACTURE PROVINCE TETOUAN.rtf` | 05/08/2025 | RTF facture standard | 18/07 – 01/08/2025 | Facture `155 /25` · Ch. 202 · 14 nuits · 4 pax · **15 400,00 MAD** |
| `Table REQ_DOC DECEMBRE.xls` | 07/01/2025 | XLS brut `REQ_DOC` (27 col.) | Décembre 2024 | 31 factures (`388..419 /24`) · **90 833,87 MAD TTC** |

---

### 3.2 Structure des rapports comptables — Colonnes utilisées et règles de calcul

L'analyse des exports comptables 2025–2026 révèle un **workflow comptable en deux étapes** : un export natif brut de 27 colonnes depuis l'écran *Reprise de facture* (`FEN_Factures` → requête `REQ_DOC`), suivi d'un retraitement manuel dans Excel en un tableau de 10 colonnes destiné au cabinet comptable et à la déclaration TVA.

#### A. Export comptable natif brut `REQ_DOC` (27 colonnes, feuille `A`, ligne finale `Somme`)

| Pos. | En-tête exact | Type / Format observé | Valeurs réelles observées (2025–2026) | Rôle métier & Règle de calcul |
| :---: | :--- | :--- | :--- | :--- |
| `C1` | `Num` | Entier séquentiel | `1` à `346` (2026), `89` à `340` (2025) | Numéro séquentiel annuel de la pièce. Ligne finale = `Somme`. |
| `C2` | *(vide — suffixe)* | Chaîne `/AA` | `/24`, `/25`, `/26` | Suffixe d'exercice fiscal complétant `Num` (ex. `261 /26`). |
| `C3` | `Piece` | Chaîne | `Facture` *(ou `Note` dans les archives)* | Nature de la pièce commerciale issue de `P_SERIE1`. |
| `C4` | `Date` | Date `JJ/MM/AAAA` | `01/07/2026` … `29/07/2026` | Date d'émission fiscale de la facture. |
| `C5` | `Etat` | Entier (`0`) | `0` | Code état technique du document. |
| `C6` | `Total HT` | Monétaire *(bug `€`/`¬`)* | `409,09`, `727,27`, `2 272,73` | Montant HT calculé par **`Total TTC / 1,10`** (TVA 10 %). Sommé en pied. |
| `C7` | `Total TVA` | Monétaire *(bug `€`/`¬`)* | `40,91`, `72,73`, `227,27` | TVA à 10 % = **`Total TTC - Total HT`**. Sommé en pied. |
| `C8` | `Total TTC` | Monétaire *(bug `€`/`¬`)* | `450,00`, `800,00`, `2 500,00` | Net à payer TTC = `Total HT + Total TVA`. Sommé en pied. |
| `C9` | `Compte` | Code `CLxxxxx` | `CL00001` (Individuel), `CL00006` (OTA/Booking), `CL00014` (ECOMED), `CL00023` (SOMAPRED), `CL00025`, `CL00028`, `CL00033`, `CL00043`, `CL00045`, `CL00054`, `CL00058` | Code compte de facturation / débiteur (Cardex Client). |
| `C10` | `Facture permanente` | Booléen `0`/`1` | `0` (individuel), `1` (groupe/compte permanent multi-chambres) | Indique une facture ouverte permanente ou consolidée groupe (ex. `101 - 107 - 204 - 105 - 104 -`). |
| `C11` | `Solder` | Booléen `0`/`1` | `1` (soldée), `0` (impayée / en compte client) | Indique si le reste à payer est nul (`Total TTC + T. Payer = 0`). |
| `C12` | `T. Payer` | Monétaire **négatif** | `-450,00`, `-800,00` *(vide si non réglée)* | Somme des encaissements imputés sur la facture (convention négative Flex PMS). Sommé en pied. |
| `C13` | `T. Taxes` | Monétaire | `4,30`, `8,60`, `12,90`, `17,20`, `25,80`, `34,40`, `43,00`, `64,50` | Taxes touristiques (`TPT + TS`) = **`4,30 MAD × pax × nuits`**. Sommé en pied. |
| `C14` | `T.HT Extrat` | Monétaire *(**TTC réel !**)* | `45,00`, `90,00`, `135,00`, `180,00`, `304,00` *(ou négatif `-10,00` en cas de déduction)* | **Attention — libellé trompeur :** contient le total **TTC** des extras et petits-déjeuners (`45 MAD`/PDJ). Sommé en pied. |
| `C15` | `T.HT Hébergement` | Monétaire *(**TTC réel !**)* | `400,70`, `701,40`, `801,40` | **Attention — libellé trompeur :** contient le total **TTC** hébergement hors taxes de séjour et extras. Sommé en pied. |
| `C16` | `Occupant principale` | Chaîne libre | Nom personne physique ou raison sociale (`Sté: SALIPRO`, `MENASSAT`, `SOMAPRED`) | Bénéficiaire principal ou société facturée *(parfois vide sur factures back-office consolidées `CL00014`)*. |
| `C17` | `Observation` | Chaîne libre | Vide, téléphone, ou contournement manuel (`ICE : 003025365000009 ESP`, `CC`) | Champ libre détourné fin 2024 pour noter ICE et mode de règlement. |
| `C18` | `Chambres` | Liste `NNN -` | `107 -`, `303 -`, `101 - 107 - 204 - 105 - 104 -` | Numéro(s) de chambre(s) rattaché(s) à la facture. |
| `C19` | `N Reservation` | Entier (`0` si back-office) | `13 020` (juil. 2025) → `15 583` (juil. 2026) · `0` pour factures manuelles back-office | Identifiant de la réservation source (`IDGESTHOT`). |
| `C20` | `Folio` | Entier `1`..`5` | `1` *(quasi exclusivement utilisé en production)* | Numéro de folio facturé. |
| `C21` | `Createur` | Nom utilisateur | `Aittamlihat Oumaima`, `TAMAHMACHTE ASMAA`, `EL KAMMAS ADNANE`, `daoud ayoub`, `azouaoui majid`, `ahlam ELMIHYAOUI`, `GHANIM IMANE` | Réceptionniste ayant créé le document. |
| `C22` | `Date creation` | Horodatage `JJ/MM/AAAA HH:MM:SS` | `30/06/2026 17:50:48` | Date/heure exacte de création. |
| `C23` | `Modification` | Nom utilisateur | Idem + `CHENTOUF MOHAMED` | Dernier utilisateur ayant modifié/validé la pièce. |
| `C24` | `Date modif.` | Horodatage | `01/07/2026 12:04:25` | Date/heure de dernière modification. |
| `C25` | `Fermer` | Booléen `0`/`1` | `1` (clôturée), `0` (ouverte / permanente) | Verrouillage/clôture de la facture. |
| `C26` | `Facturer` | Booléen `0`/`1` | `1` | Indique que le document est passé en facture définitive. |
| `C27` | `Objet` | Chaîne `Séjour du ... au ...` | `Séjour du 30/06/2026 au 01/07/2026` *(bug `20/06/2019 au 21/06/2019` si `N Reservation = 0`)* | Libellé d'objet imprimé sur la facture. |

> **Vérification mathématique exacte (confirmée sur 100 % des lignes et totaux de `Table REQ_DOC` 2025–2026) :**
> - `Total HT + Total TVA = Total TTC` (ex. Juillet 2026 : `135 793,88 + 13 579,39 = 149 373,27 MAD`).
> - **`T. Taxes + T.HT Extrat + T.HT Hébergement = Total TTC`** (ex. Juillet 2026 : `1 470,60 + 18 794,00 + 129 108,67 = 149 373,27 MAD` ; ligne `261/26` : `4,30 + 45,00 + 400,70 = 450,00 MAD`).
> - `Total HT = Total TTC / 1,10` → dans le paramétrage actuel de Flex PMS 9, la TVA (10 %) est extraite du TTC global **incluant** `T. Taxes` (4,30 MAD), alors que sur la facture manuelle `facture province Tétouan.rtf` (`14/08/2025`), les taxes sont placées **hors assiette TVA** (`33 486,63 HT + 3 348,67 TVA + 464,70 TAXES = 37 300,00 TTC`).

#### B. Récapitulatif comptable mensuel retraité (10 colonnes — Déclaration TVA & Comptabilité)

Chaque mois (août 2025 → avril 2026), l'équipe retire 19 colonnes de l'export brut et **ajoute manuellement 2 colonnes** indispensables à la comptabilité marocaine (`ICE` et `Mode de paiement`) :

| Pos. | En-tête (variantes constatées) | Origine | Remplissage & Valeurs réelles (août 2025 – avril 2026) |
| :---: | :--- | :--- | :--- |
| `C1`–`C4` | `Num`, *(vide `/AA`)*, `Piece`, `Date` | Export `REQ_DOC` | Conservés à l'identique (`Facture`, `/25` ou `/26`). |
| `C5`–`C7` | `Total HT`, `Total TVA`, `Total TTC` | Export `REQ_DOC` | Conservés avec ligne finale `Somme` (présente sur la majorité des mois, parfois absente ex. janvier 2026 / août 2025 / sept. 2025). |
| `C8` | `Occupant principale` | Export `REQ_DOC` *(souvent corrigé à la main)* | Remplacé manuellement par la raison sociale de l'entreprise lorsque le séjour avait été saisi au nom du salarié (ex. `Sté : IMETAL`, `Société: AGMA`, `FAIZ IMPORT`, `MEGAMAQ`, `ECOMED`). |
| `C9` | `ICE` / `Ice` | **Saisie manuelle** | **35 % à 68 % des factures** comportent un ICE (ex. 33/67 en avril 2026, 27/40 en déc. 2025, 22/33 en nov. 2025, 21/35 en oct. 2025, 24/37 en sept. 2025). Anomalies de saisie constatées : préfixe `:`, longueur 16 chiffres au lieu de 15. |
| `C10` | `Mode de paiement` / `MODE DE PAIMENT` / `Mode de paiment` | **Saisie manuelle** | Répartition observée : **Espèces** (~50 %), **Carte Crédit** (~35–45 %), **Virement** (~5–15 %) et **règlements mixtes saisis en texte libre** (`"Carte crédit 300 espece 20"`, `"500 espece 500 carte crédit"`, `"130 espéce 1050 carte crédit"`, `"1000 Carte credit 50 espece"`, `"Carte Crédit / Virement"`, `"Virement / Espèce"`). |

#### C. Autres structures comptables et pièces imprimées (2024–2025)

- **Factures clients imprimées (`.rtf` / `.pdf`) :**
  - *Modèle standard* (`FACTURE PROVINCE TETOUAN.rtf` du 05/08/2025, `Note_Standard.rtf`, `3.pdf`) : bloc en-tête (`NUMERO /AA`, `DATE`, `PAGES`, code-barres ID interne, dates séjour, `Chambre(s)`, code `Compte`, raison sociale, adresse, `ICE`, `Nbr nuité(s)`, `Nbr PAX`, occupant), tableau synthétique 2 colonnes (`DESIGNATION` : `HEBERGEMENT`, `REPAS`, `TAXES` | `MONTANT`), bloc totaux (`TOTAL TAXES (TPT+TS)`, `TOTAL HT`, `TOTAL TVA`, `TOTAL TTC`), arrêté en toutes lettres en dirhams.
  - *Facture groupe administration personnalisée* (`facture province Tétouan.rtf` du 14/08/2025, 37 300 MAD) : tableau 8 colonnes **édité manuellement hors PMS** (`Nom et Prénom`, `VILLE`, `CIN`, `N° DE CHAMBRE`, `Date de séjour`, `Prix unitaire`, `Nombre de nuitée`, `Total`) + objet administratif détaillé en pied.
- **Détail des lignes et Grand livre client** *(confirmés par `Table REQ_LIGNE_DOC.xls` et `Table REQ_GrandLivreClient.xls`)* :
  - `REQ_LIGNE_DOC` (8 colonnes) : `Nature`, `Code` (`HEB`, `PD`, `REST`), `Libelle`, `Quantité`, `Prix Unitaire`, `%TVA`, `Montant TTC`, `Application` (date).
  - `REQ_GrandLivreClient` (9 colonnes) : `Date`, `Document` (`Note`/`Facture`), `Num`, `Objet`, `Occup. principale`, `N.Réserv.`, `Total doc.`, `Règlement`, `Reste`.

---

### 3.3 Structure des rapports d'occupation et de réservations

#### A. Rapports mensuels d'occupation (`.xls`, 7 colonnes — Août à Octobre 2025)

Cinq fichiers 2025 (`ETAT D'OCCUPATION DU MOIS AÖUT.xls`, `STATISTIQUE DU MOIS AÖUT.xls`, `Table statistique mois septembre.xls`, `Table F_SYT1.xls`, `HAT.xls`) proviennent de l'écran *Occupation et analyse hôtel* (`FEN_ET_OCCUPATION` / table de synthèse `F_SYT1`) :

| Pos. | En-tête exact | Type | Valeurs observées (août – oct. 2025) | Règle de calcul constatée |
| :---: | :--- | :---: | :--- | :--- |
| `C1` | `Date` | Date `JJ/MM/AAAA` | Une ligne par jour du mois + lignes `Somme` et `Moyenne` | Période calendaire mensuelle (30 ou 31 lignes). |
| `C2` | `# Total` | Entier | `25` *(brut `F_SYT1`)* · ramené manuellement à `24` dans le rapport retraité sept. 2025 | Parc physique total (25 chambres ; 1 chambre hors parc actif). |
| `C3` | `# Active` | Entier | `24` | Chambres commercialisables du jour (`720` à `768` chambre-nuits/mois). |
| `C4` | `# Bloqué` | Entier | Vide ou `1` (cumul `1` à `3` chambre-nuits/mois) | Chambres hors vente temporaire (`FEN_CHBRE_HORSVENTE`). |
| `C5` | `# Disponible` | Entier | `0` à `20` | **`# Active - # Bloqué - # Vendu`** (vérifié sur tous les totaux : ex. sept. 2025 `720 - 3 - 342 = 375` ; août 2025 `744 - 3 - 604 = 137` ; oct. 2025 `768 - 1 - 347 = 420`). |
| `C6` | `# Vendu` | Entier | `4` à `24` (pics à `24/24` en août) | Chambres vendues du jour. Ligne `Moyenne` = moyenne arrondie (ex. `19`/j en août, `11`/j en sept. et oct.). |
| `C7` | `Taux d'occupation` | Pourcentage `0,0 %` | `16,7 %` à `100,0 %` | **`# Vendu / # Active`** (ex. `16 / 24 = 66,7 %`, `24 / 24 = 100,0 %`). **Absent de la ligne `Somme` en export brut**, recalculé manuellement dans `Table statistique mois septembre.xls` (`342 / 720 = 47,50 %`). |

#### B. Rapports et documents de réservation (2025–2026)

1. **Bulletin de réservation** (`ETAT_BulletienReservation.rtf` du `10/01/2026` et `bulletin de reservation du anas laghrich.pdf` du `25/09/2025` — issus de `Reservation/ETAT_BulletienReservation.wde`) :
   - **En-tête :** Logo officiel *Hôtel Makarim Tétouan*, titre `Bulletin de réservation`, badge statut (`RSV`).
   - **Bloc réservation (13 champs structurés) :** `Numéro de réservation` (ex. `13 849`, `14 307`), `Origine` (`DIRECTE`), `Mme. Mr` (occupant ou société), `Nationalité` (`MA`), `Date d'arrivée`, `Date départ`, `Durée` (en nuitées), `Nbre de Pax`, `Nbre d'enfant`, `Type de chambre` (`DBL`, `QDR`), `Total réservation`, `Arrangement` (`BB-DBL`, `BB-SGL`), `Message` (ex. demande de chambre spécifique « La chambre 307 vu montagne »).
   - **Bloc piste d'audit (5 champs) :** `Créateur`, `Date de création`, `Modif.`, `Date de modification`, `Date/heure tirage`.
   - **Pied juridique :** Adresse complète, `RC: 25149`, `ICE: 002270052000083`, `CNSS: 1322850`, Tél, Fax, Email.
2. **Attestation / Confirmation de réservation avec acompte** (`Confirmation_Reservation.rtf` du `10/01/2026` — issue de `Reservation/Confirmation_Reservation.wde`) :
   - **Champs :** `Numéro de réservation`, `Mr` / `Mme` (occupants), `Montant` reçu (affiché en négatif `-3 500 MAD` + mode `Carte Crédit` + montant en toutes lettres `###TROIS MILLE CINQ CENTS DIRHAMS###`), `Date d'arrivée`, `Date Départ`, `Durée`, `Total réservation`, `Reste à payer`, date/lieu et signature `LA DIRECTION`.
   - **Anomalie critique :** le texte d'en-tête juridique référence encore un autre établissement (*TAMUDA SKY SARL / hôtel résidence Kabila Vista*).
3. **Exports tabulaires de réservations groupes & disponibilités** *(archives de référence `Flex PMS 9`)* :
   - **Liste de réservations / Rooming list (`Table REQ_LISTE_RSV.xls` & `R.LISTE.xls` — 13 colonnes) :** *(sel)*, `Etat` (`RSV`), `N.Réserv.`, `Type` (`TWN`), `#` (N° chambre), `Arrivée`, `Départ`, `Master group.`, `Pax`, `T.Prévisionnel`, `Message`, `Créateur`, `id enrg.` — retraitée manuellement en `REMING LIST.xls` (7 colonnes : `Type`, `N.CHAMBRE`, `Arrivée`, `Départ`, `Master group.`, `Pax`, `T.Prévisionnel`).
   - **Pré-rooming list (`Table.xls` — 6 colonnes) :** `Nbr Chbre`, `Type chbre`, `Pax/Chbre`, `Nationalité`, `Arrangement`, `Total Pax`.
   - **Disponibilités par type (`Tableau croisé dynamique.xls` — 6 colonnes) :** `Date`, `DOUBLE`, `DOUBLE VUE MONTAGNE`, `QUADRUPLE`, `TRIPLE`, `TRIPLE VUE MONTAGNE` / `TWINS`, `Total`.

---

### 3.4 Synthèse des règles métier réelles, anomalies et exigences de refonte

L'audit chiffré des exports 2025–2026 dégage **8 constats opérationnels majeurs** à intégrer dans le cahier des charges du futur PMS Makarim :

1. **Capacité et rythme d'activité réels :** 25 chambres physiques (**24 actives** sur 3 étages `101–108`, `201–208`, `301–308`), ~30 à 80 factures/mois (~2 560 réservations/an entre juillet 2025 `#13 020` et juillet 2026 `#15 583`), taux d'occupation dépassant **81 % en août** (pics à 100 %) et ~47,5 % en septembre.
2. **Évolution de la fiscalité et des tarifs :** TVA à **10 %** ; taxes touristiques (`TPT + TS`) passées de **11,00 MAD** (2019–2021) à **4,30 MAD/pax/nuit** (2024–2026) ; petit-déjeuner (`PD`) passé de 40 à **45,00 MAD** → impératif de **barèmes datés configurables** (aucune constante en dur).
3. **Clarification fiscale urgente sur l'assiette TVA :** Dans Flex PMS 9, `Total HT = Total TTC / 1,10` inclut `T. Taxes` (4,30 MAD) dans l'assiette TVA, et les colonnes `T.HT Extrat` / `T.HT Hébergement` affichent en réalité des montants **TTC**. Le futur PMS devra séparer clairement HT / TVA / Taxes touristiques hors assiette TVA selon validation de l'expert-comptable.
4. **Suppression du retraitement manuel mensuel comptable :** L'export natif `REQ_DOC` ne contenant ni l'**ICE** ni le **Mode de paiement** (avec ventilation des règlements mixtes Espèces + CB), l'équipe recrée manuellement un fichier Excel de 10 colonnes chaque mois (avec erreurs d'orthographe, ICE mal formatés, et même confusion de nom de fichier comme `Table REQ_DOC MOIS NOVEMBRE.xls` contenant septembre 2025). Le futur PMS devra exporter **nativement** un état comptable complet avec `ICE` (contrôlé sur 15 chiffres), `Mode(s) de règlement` ventilés par montant, `HT / TVA / TPT / TS / TTC` et taux d'occupation mensuel agrégé.
5. **Correction des bugs d'export constatés :**
   - Symbole monétaire **`€` / `¬`** dans les fichiers `.xls` au lieu de **`MAD`** (locale Windows).
   - Date d'objet figée à **`Séjour du 20/06/2019 au 21/06/2019`** sur les factures back-office consolidées sans N° réservation (`N Reservation = 0`, ex. `337 /25` ECOMED).
   - Trous de numérotation visibles dans les exports mensuels et chevauchement d'année civile (`338 /25` datée du `03/01/2026`).
   - En-tête erroné (*TAMUDA SKY SARL / Kabila Vista*) dans `Confirmation_Reservation.rtf`.
6. **Support natif des factures groupes nominatives (Marchés publics / Administrations) :** Prévoir un modèle de facture consolidée incluant la table des occupants (Nom, Prénom, Ville, CIN, Chambre, Dates, PU, Nuitées, Total) pour éviter la ressaisie manuelle sous Word (`facture province Tétouan.rtf`).
7. **Nettoyage du patrimoine de modèles d'édition :** Remplacer les 49 fichiers `.wde` redondants (dont des versions WD18/`A44` obsolètes) par un jeu unique, versionné et paramétré aux coordonnées juridiques d'Hôtel Makarim.
8. **Sécurité & Traçabilité :** Conserver l'audit complet (`Createur`, `Date creation`, `Modification`, `Date modif.`) déjà exploité par l'équipe réception (8 comptes actifs recensés en 2025–2026) et y adjoindre la journalisation des déductions, annulations et réimpressions de factures.
