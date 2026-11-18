# Rapport d'inspection — Installation Flex PMS

**Date de l'inspection :** 18/11/2026  
**Poste analysé :** Poste client Windows (`192.168.100.140`)  
**Mode d'inspection :** Lecture seule (aucun fichier système ou applicatif modifié)

---

## 1. Résumé exécutif

- **Chemin exact de l'installation active de Flex PMS :** `E:\Creativekeys\Flex PMS 9`
  - **Exécutable principal :** `E:\Creativekeys\Flex PMS 9\Flex PMS.exe` (version `9.0.54.0`, éditeur **Creativekeys**).
  - Confirmé comme l'installation de production active (exports comptables/réservations récents jusqu'en juillet/août 2026 dans ce répertoire).
  - Une autre version PMS est également présente sur le Bureau : `E:\Creativekeys\Flex PMS 28.06\CSPMS.exe` (version `1.0.267.0`, datée de 2022–2023).
- **Technologie détectée :** **WINDEV (PC SOFT)** — **exécutables compilés natifs x86 (32 bits)** (aucun code source présent sur la machine).
  - **Flex PMS 9** (`Flex PMS.exe`, `Flex CS.exe`, `Flex Caisse.exe`) : compilé avec **WINDEV 20** (runtime `wd200*.DLL`, bibliothèque `Flex PMS.wdl`, analyse `FlexPMS.wda` / `FlexPMS.wdd`).
  - **CS PMS (`Flex PMS 28.06`)** : compilé avec **WINDEV 23** (runtime `wd230*.DLL`, incluant `wd230hf.DLL`, `wd230maria.DLL`, `wd230msql.DLL` et `libmariadb.dll`).
- **Emplacement et moteur de base de données :**
  - **Moteur :** **HFSQL Client/Serveur** (HyperFileSQL C/S — PC SOFT).
  - **Serveur distant :** `192.168.100.200`, port TCP **`4900`** (test de connectivité réussi : `TcpTestSucceeded = True`).
  - **Base de données active :** `HOTEL_DATA` (utilisateur `admin`).
  - **Ressources et configurations partagées :** `\\192.168.100.200\Creativekeys\Flex PMS 18\commun`.
  - Ce PC (`192.168.100.140`) est un **poste client** : aucun moteur de base de données ni service Flex n'est installé localement.

---

## 2. Raccourcis (Bureau et Menu Démarrer)

Aucun raccourci Flex/PMS n'a été trouvé dans le Menu Démarrer (utilisateur ou global) ni sur le Bureau public.  
Sur le Bureau de l'utilisateur (`C:\Users\HP\Desktop`), 4 raccourcis Creativekeys/Flex sont présents :

| Raccourci | Exécutable cible | Version | Répertoire de travail |
| :--- | :--- | :--- | :--- |
| `C:\Users\HP\Desktop\Flex PMS - Raccourci.lnk` | `E:\Creativekeys\Flex PMS 9\Flex PMS.exe` | 9.0.54.0 | `E:\Creativekeys\Flex PMS 9` |
| `C:\Users\HP\Desktop\CS PMS.lnk` | `E:\Creativekeys\Flex PMS 28.06\CSPMS.exe` | 1.0.267.0 | `E:\Creativekeys\Flex PMS 28.06` |
| `C:\Users\HP\Desktop\Flex CS - Raccourci.lnk` | `E:\Creativekeys\Flex CS\Flex CS.exe` | 23.3.48.0 | `E:\Creativekeys\Flex CS` |
| `C:\Users\HP\Desktop\Flex Caisse - Raccourci.lnk` | `E:\Creativekeys\Flex pos\Flex Caisse.exe` | 18.0.30.0 | `E:\Creativekeys\Flex pos` |

---

## 3. Inspection des lecteurs et dossiers

Lecteurs détectés : `C:\`, `E:\`, `Z:\` (mappé sur `\\192.168.100.200\Partage`). (`F:\` non monté ; `C:\inetpub` vide).

### Lecteur `E:\`
- **`E:\Creativekeys\`** (répertoire principal des applications sur ce poste) :
  - `E:\Creativekeys\Flex PMS 9` — **installation active de Flex PMS** (WINDEV 20, fichiers d'export 2020–2026)
  - `E:\Creativekeys\Flex PMS 9 old` — ancienne copie de Flex PMS 9 (2020–2022)
  - `E:\Creativekeys\Flex PMS 28.06`, `Flex PMS 14.05`, `Flex PMS.24.05` — versions de `CSPMS.exe` (WINDEV 23, 2022–2023)
  - `E:\Creativekeys\Flex CS` — gestion commerciale Creativekeys (WINDEV 20)
  - `E:\Creativekeys\Flex pos` — module caisse / POS (WINDEV 20)
  - `E:\Creativekeys\Imagescollection` — ressources graphiques
- **`E:\data\`** :
  - `E:\data\bdpms_demo` et `E:\data\bdgc_test` — bases HFSQL Classic (`.fic`/`.ndx`/`.mmo`) de démonstration/test datées du `28/06/2022`, liées à `CSPMS.exe`.

### Lecteur `C:\`
- `C:\ckFlex` — contient `param.ini` (paramètres POS).
- `C:\Flex CS` — ancienne copie locale de Flex CS (2022).
- `C:\ProgramData\Creativekeys` — contient `flex.ini` (métadonnées d'installation Flex CS) et un dossier `Flex CS`.
- `C:\Program Files\Microsoft SQL Server\110\Shared` & `C:\Program Files (x86)\Microsoft SQL Server\110\Shared` — uniquement des bibliothèques partagées SQL Server 2012 (aucune instance locale).
- `C:\Program Files` et `C:\Program Files (x86)` — aucun dossier Flex/Creativekeys.

### Partages réseau (`192.168.100.200`)
- **`\\192.168.100.200\Creativekeys`** (accessible en lecture) : contient `Flex PMS 18` (`commun`, `Etats et requêtes`, `Flex PMS 9`), `Flex PMS 28.06`, `Flex CS`, `Flex pos`, `Flex Manager`, `Flex Manager 19`, `Backup_14052022`, `PosSys`, `Logiciel`, `Manuel de formation`.
- **`Z:\` (`\\192.168.100.200\Partage`)** : contient une copie `Z:\Flex PMS.24.05` et des fichiers/dossiers administratifs (`RECAP PMS SYSTEM`, factures, tarifs, réservations).

---

## 4. Services Windows et processus en cours

- **Services Windows liés à Flex PMS ou à un SGBD local :** **Aucun** (aucun service HFSQL/Manta, SQL Server, MySQL/MariaDB, Firebird, PostgreSQL, Oracle ou IIS installé ni actif sur ce PC).
- **Processus en cours liés à Flex PMS ou à un SGBD :** **Aucun** lors de l'inspection.
- **Vérification réseau vers le serveur HFSQL :**
  - Cible : `192.168.100.200` — Port TCP `4900` (port par défaut HFSQL Client/Serveur).
  - Résultat : **Ouvert et joignable** (`TcpTestSucceeded = True`).

---

## 5. Fichiers de configuration et stockage des données

### `E:\Creativekeys\Flex PMS 9\config.ini` (configuration active)
```ini
[Provider]
Source=hfsql
[Connexion]
Server=192.168.100.200
User=admin
pass=
[Data]
Dataname=HOTEL_DATA
[Acces]
Emplacement=\\192.168.100.200\Creativekeys\Flex PMS 18\commun
Tempo =E:\Creativekeys\Flex PMS 9\tempo
```

### `E:\Creativekeys\Flex PMS 9\Flex PMS.REP` (registre HFSQL)
Ce fichier référence :
- **Serveur actif HFSQL Client/Serveur :** `192.168.100.200:4900` → bases `HOTEL_DATA` et `FORMATION`.
- **Ancien serveur HFSQL (historique) :** `192.168.100.250:4900` → bases `HOTEL_A44` et `formation`.
- **Fichiers HFSQL Classic partagés (`.fic`) :** `\\192.168.100.200\Creativekeys\Flex PMS 18\commun\configuration\...` et `\\192.168.100.200\Creativekeys\Flex PMS 18\commun\Communication\...` (`COM_TICKET_TO_PMS.fic`, `COM_CHAMBRE_DISPO.fic`).

### Autres fichiers de configuration détectés
- `E:\Creativekeys\Flex PMS 9\legal\licence.ini` & `flex.ini` : licence `Flex PMS` (`IDLicence=712`, `NbrLicence=5`).
- `E:\Creativekeys\Flex PMS 28.06\CSPMS.REP` : pointait vers des fichiers HFSQL Classic locaux (`bdpms_demo`).
- `E:\Creativekeys\Flex pos\partage.ini` : `Emplacement=\\192.168.100.200\Creativekeys\Flex CS\sf_data` (`DOSSIER=2`).
- `C:\Flex CS\partage.ini` : `Emplacement=\\192.168.100.200\Creativekeys\Flex CS\sf_data`.
- `E:\Creativekeys\Flex CS\partage.ini` : `Emplacement=E:\Creativekeys\Flex CS\sf_data`.
- `C:\ckFlex\param.ini` : configuration POS (`IDPOS=1`, `HauteurLigne=89`, `LargeurColonne=89`).
- `C:\ProgramData\Creativekeys\flex.ini` : suivi d'installation `Flex CS` (`Version=23.3.48.0`, dernier lancement le `05/01/2023`).
