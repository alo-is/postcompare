# Tarifs postaux européens 2027 — conception hybride

Date : 2026-08-10
Statut : approuvé

## Objectif

Mettre à jour uniquement les tarifs courants dont l'écart est démontré par une source officielle, puis publier les changements 2027 connus sans les utiliser dans le comparateur avant leur date d'effet.

Le site doit distinguer clairement :

- les changements 2027 confirmés par un opérateur ;
- les aperçus ou calendriers de publication sans grille tarifaire définitive ;
- les tarifs actuellement applicables, qui restent la seule source du comparateur et des classements.

## Données

### Tarifs courants

Les fichiers `data/operators/*.yaml` restent la source des prix applicables. Le schéma reçoit deux ajouts légers :

- `operator.sources`, liste des sources officielles utilisées, avec URL, date de consultation et, lorsque connue, date d'effet ;
- `letters.available`, `letters.unavailable_since` et `letters.notice`, pour représenter l'arrêt complet d'un service sans conserver des résultats comparables trompeurs.

Un service de lettres marqué indisponible est absent du comparateur et présenté comme arrêté sur la page opérateur. Les tarifs historiques peuvent rester dans le YAML pour préserver le contexte, mais ils ne sont plus affichés comme tarifs actifs.

Les corrections 2026 sont limitées aux produits strictement comparables et documentés : Belgique, Pays-Bas, Finlande, Norvège, Danemark, Italie, Grèce, Croatie et Lituanie. Les valeurs ambiguës, les zonages non équivalents et les données impossibles à vérifier restent inchangés.

### Annonces 2027

Un fichier séparé `data/postal-changes-2027.yaml`, validé par `data/schema/postal-change.schema.json`, contient :

- l'opérateur et le pays concernés ;
- le statut `confirmed` ou `preview` ;
- la portée `consumer` ou `business` ;
- les dates d'annonce, de consultation et d'effet lorsqu'elles sont connues ;
- la source officielle ;
- un résumé localisé en français, anglais et allemand ;
- soit des variations chiffrées avec ancien prix, nouveau prix et pourcentage, soit des changements structurels localisés.

La page grand public n'affiche que les annonces de portée `consumer`. La préannonce PostNord Danemark est conservée comme donnée de recherche `business`, mais exclue du bulletin, du compteur d'accueil et des alertes opérateur destinés aux particuliers. Royal Mail Subscription Mail, offre spécialisée de courrier en nombre, reste entièrement hors du jeu de données. Les changements confirmés de La Poste et Deutsche Post sont publiés.

## Chargement et règles métier

`src/lib/data-loader.ts` expose un chargeur typé pour les annonces 2027 et des helpers pour retrouver celles d'un opérateur.

Le moteur de comparaison conserve sa logique actuelle, avec une garde explicite : si la famille de services demandée est indisponible, aucun résultat n'est retourné. Les annonces futures ne sont jamais lues par le moteur de comparaison.

La validation contrôle le schéma des opérateurs et des annonces, puis ajoute des vérifications sémantiques minimales : identifiants d'opérateurs référencés existants, cohérence des dates, pourcentage conforme aux deux prix lorsqu'ils sont présents, URL officielle et traductions complètes.

## Interface

### Page `/[lang]/tarifs-2027`

La page dédiée comprend :

- une introduction précisant la date de dernière vérification et que les tarifs futurs ne sont pas encore appliqués au comparateur ;
- un bloc « changements confirmés » avec les hausses françaises chiffrées et les changements structurels allemands ;
- un bloc « annonces à venir » uniquement lorsqu'au moins un aperçu grand public existe ;
- une source officielle et une date d'effet ou une mention explicite lorsqu'elle n'est pas encore publiée ;
- une note méthodologique indiquant que l'absence d'annonce trouvée n'est pas une garantie d'absence de changement ultérieur.

La page est accessible depuis la navigation principale dans les trois langues.

### Accueil

Un encart éditorial compact annonce que les premiers changements 2027 sont suivis, présente le nombre d'annonces confirmées et renvoie vers la page dédiée. Il ne remplace pas le formulaire principal.

### Pages opérateur

Les opérateurs concernés affichent une alerte contextuelle vers la page 2027. Les services entièrement arrêtés affichent une notice d'indisponibilité à la place des tableaux correspondants. Les sources des tarifs courants sont visibles en bas de page.

## Présentation et accessibilité

Les statuts ne reposent pas uniquement sur la couleur : chaque carte porte un libellé textuel. Les liens de source ont un intitulé explicite. Les dates utilisent les mêmes données ISO mais sont formatées selon la langue. La hiérarchie visuelle reprend les cartes, bordures et espacements existants sans créer un second système graphique.

La direction visuelle prolonge le système « patrimoine postal » existant : papier `#FAF4E8`, encre `#1A0F07`, rouge postal `#9B2335`, bleu aéropostal `#1E3A5F` et laiton `#B8860B`, avec Playfair Display pour les titres et Source Serif 4 pour le texte. La signature de la page est un bulletin postal daté : une ligne temporelle verticale relie les dates d'effet et transforme les annonces en avis officiels plutôt qu'en cartes marketing génériques.

```text
┌──────────────── bulletin 2027 ────────────────┐
│ titre + date de vérification                    │
│ avis : les prix futurs ne sont pas comparés    │
├── 01 JAN ─ France ─ changements chiffrés ──────┤
│           Allemagne ─ changements structurels  │
├── À VENIR ─ Danemark ─ aperçu officiel ────────┤
└──────────────── méthodologie ───────────────────┘
```

Les effets décoratifs restent limités à cette ligne de bulletin et aux filets aéropostaux déjà présents. Le responsive replie la date au-dessus du contenu, conserve un ordre de lecture linéaire, rend le focus clavier visible et respecte `prefers-reduced-motion`.

## Tests et critères d'acceptation

- Tous les YAML opérateurs et le fichier d'annonces passent leurs schémas.
- Les contrôles sémantiques échouent sur une annonce orpheline ou incohérente.
- Le comparateur ignore les lettres PostNord Danemark arrêtées.
- Les annonces 2027 ne modifient aucun résultat courant.
- Les trois variantes statiques de la page 2027 sont générées.
- Les pages France, Allemagne et Danemark présentent la bonne alerte.
- Les commandes npm de validation, test et build sont exécutées exclusivement dans Docker.

## Hors périmètre

- Reconstituer des historiques complets par date d'effet pour les 32 opérateurs.
- Inventer des prix 2027 non publiés ou extrapoler une hausse.
- Uniformiser les zonages colis quand les produits opérateurs ne sont pas comparables.
- Publier des offres B2B spécialisées dans la page destinée aux particuliers.
