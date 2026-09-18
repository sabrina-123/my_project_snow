# Rapport de tests - ShopNow Test Platform

**Date :** 18 septembre 2026  
**Projet :** ShopNow Test Platform  
**Branche :** `master`  
**Dernier commit connu :** `296fe1a Complete tests and Jenkins pipeline`

## 1. Objet du rapport

Ce rapport présente la stratégie de test mise en place pour ShopNow :

- tests unitaires avec Mocha et Chai ;
- tests d'intégration HTTP avec Supertest ;
- tests End-to-End avec Selenium WebDriver et Chrome/Chromium ;
- génération de couverture au format LCOV avec NYC ;
- intégration de l'analyse SonarQube dans Jenkins ;
- vérification de la capacité des tests à détecter une régression.

## 2. Architecture testée

```text
Mocha
  +-- Tests unitaires
  +-- Supertest -> API Express
  +-- Selenium WebDriver -> Chrome/Chromium -> interface ShopNow
```

L'application est une API Express qui sert également les pages statiques de la boutique. Les routes principales testées sont :

- `GET /` ;
- `GET /api/health` ;
- `GET /api/products` ;
- `GET /api/products/:id` ;
- `POST /api/login` ;
- `POST /api/register`.

## 3. Inventaire des tests

```text
tests/
├── unit/
│   ├── smoke.test.js
│   └── user-validation.test.js
├── integration/
│   ├── api.test.js
│   └── http-api.test.js
└── e2e/
    └── navigation.test.js
```

### Tests unitaires

Les tests unitaires vérifient :

- le fonctionnement de base de Mocha et Chai ;
- le refus d'un mot de passe inférieur à 8 caractères lors de l'inscription.

### Tests d'intégration API

Les tests d'intégration vérifient les codes HTTP, les propriétés des réponses et les messages métier.

| Fonctionnalité | Cas nominal | Cas d'erreur |
|---|---|---|
| Page d'accueil | `GET /` retourne `200` et du HTML | N/A |
| Santé de l'API | `GET /api/health` retourne `{ status: "ok" }` | N/A |
| Liste produits | `GET /api/products` retourne une liste non vide | N/A |
| Produit par identifiant | `GET /api/products/1` retourne le produit attendu | `404` pour produit inexistant ou identifiant invalide |
| Route API | Routes existantes accessibles | `404` pour `/api/unknown` |
| Connexion | Identifiants valides, y compris une casse différente | `401` pour mot de passe incorrect, email vide ou paramètre absent |
| Inscription | Mot de passe minimal de 8 caractères accepté | `400` pour champ absent ou mot de passe trop court ; `409` pour email déjà utilisé |

## 4. Tests End-to-End

Le fichier `tests/e2e/navigation.test.js` utilise Selenium WebDriver avec Chrome sous Windows et Chromium sous Linux/Jenkins. Le navigateur est lancé en mode headless dans l'environnement CI.

### Scénario de navigation et d'achat

Le scénario réalise le parcours suivant :

```text
Accueil
  -> Connexion valide
  -> Catalogue
  -> Détail du produit 1
  -> Ajout au panier
  -> Panier
  -> Quantité 1 -> 2
  -> Vérification du total 2599.98
  -> Quantité minimale 1
  -> Suppression
  -> Panier vide
```

Le test utilise des sélecteurs `data-testid`, des attentes explicites Selenium et vérifie des résultats réels : pages visibles, URLs, nom du produit, quantité, compteur, total exact et nombre d'articles égal à zéro.

### Scénario de connexion incorrecte

Le second scénario E2E utilise un email valide avec un mauvais mot de passe. Il vérifie :

- la présence et la visibilité du message d'erreur ;
- le texte `Email ou mot de passe incorrect` ;
- le maintien de l'utilisateur sur `/login.html`.

## 5. Résultats d'exécution

### Couverture unitaires et intégration

Commande exécutée :

```powershell
npm.cmd run test:coverage
```

Résultat :

```text
23 passing
Statements : 100%
Branches   : 100%
Functions  : 100%
Lines      : 100%
```

Le rapport est généré dans :

```text
coverage/lcov.info
coverage/lcov-report/index.html
```

### Suite complète

Commande exécutée :

```powershell
npm.cmd test
```

Résultat validé :

```text
26 passing
```

Cela comprend les tests unitaires, les tests d'intégration et les trois scénarios E2E.

## 6. Analyse des lignes couvertes

Après ajout du test de cycle de vie du serveur et du test de route frontend inconnue, aucune ligne ni branche du fichier `app/src/server.js` n'est signalée comme non couverte par NYC.

Le démarrage de production est séparé dans `app/start.js`. Le serveur applicatif reçoit un port explicite, ce qui permet de tester son démarrage sur un port éphémère sans dépendre d'un port déjà utilisé.

## 7. Test de détection de régression

Une mutation temporaire a été introduite dans le prix du produit 1 : `1299.99` a été remplacé par `1200`.

Le test E2E a détecté la régression :

```text
Résultat obtenu : 2400.00
Résultat attendu : 2599.98
2 passing, 1 failing
```

La valeur correcte `1299.99` a ensuite été restaurée. Après restauration :

```text
3 passing
```

La suite complète est également repassée avec `26 passing`.

## 8. Pipeline Jenkins

Le `Jenkinsfile` exécute les étapes suivantes :

1. installation avec `npm ci` ;
2. tests unitaires ;
3. tests d'intégration ;
4. tests E2E ;
5. génération de la couverture LCOV ;
6. archivage de `coverage/lcov.info` ;
7. analyse SonarQube.

Le scanner utilise l'URL réseau Docker :

```text
http://sonarqube:9000
```

Cette URL est nécessaire depuis le conteneur Jenkins. L'URL navigateur reste `http://localhost:9090`.

## 9. SonarQube

La configuration `sonar-project.properties` analyse :

- les sources dans `app/src` ;
- les tests dans `tests` ;
- le rapport `coverage/lcov.info` ;
- sans inclure `node_modules` ni `coverage` dans les sources.

Le serveur Jenkins doit être configuré avec le nom `SonarQube`, et l'outil doit être nommé `SonarQube Scanner` pour correspondre au `Jenkinsfile`.

## 10. Conclusion et suites recommandées

La stratégie actuelle couvre les principaux parcours nominaux et négatifs, ainsi que la détection d'une régression fonctionnelle réelle. Les tests sont reproductibles grâce au nettoyage du `localStorage`, à l'utilisation d'un port libre pour le serveur E2E et au mode headless Chrome/Chromium.

Améliorations possibles :

- ajouter une règle métier de quantité maximale, puis la tester explicitement ;
- produire des rapports JUnit XML si Jenkins doit publier les résultats détaillés ;
- couvrir le démarrage du processus principal dans un test séparé si cette ligne doit apparaître dans la couverture ;
- pousser les dernières modifications locales avant de relancer Jenkins.