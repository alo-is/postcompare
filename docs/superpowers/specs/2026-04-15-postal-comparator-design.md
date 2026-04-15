# PostCompare.eu — Design Spec V1

## Objectif

Comparateur de tarifs postaux européens. L'utilisateur choisit un type d'envoi (lettre ou colis), un poids, un pays d'origine et un pays de destination. Le site classe les postes nationales européennes par prix en euros, avec délais et produit comparé.

Le site est **neutre** (pas de recommandation commerciale) et **thématisé postal** (ambiance papier kraft, tons chauds).

## Périmètre V1

- **32 pays** : UE 27 + AELE (Suisse, Norvège, Islande, Liechtenstein) + Royaume-Uni
- **Opérateurs** : postes nationales uniquement (La Poste, Deutsche Post, Royal Mail, Correos, etc.)
- **Prestations** : lettres standard + colis standards (national et international)
- **V2 prévue** : ajout des transporteurs privés (UPS, GLS, DHL Express, FedEx...)

## Stack technique

- **Framework** : Astro (site statique avec composants interactifs)
- **Composants interactifs** : React (formulaire, filtrage côté client)
- **Données** : fichiers YAML dans le repo, validés par JSON Schema en CI
- **Contribution** : via GitHub Issues / Pull Requests
- **i18n** : 3 langues (FR, EN, DE) via le système i18n intégré d'Astro
- **Déploiement** : Vercel ou Netlify (build statique)

## Architecture des données

### Structure des fichiers

```
data/
  operators/
    la-poste-fr.yaml
    deutsche-post-de.yaml
    royal-mail-gb.yaml
    correos-es.yaml
    ...
  schema/
    operator.schema.json    # JSON Schema pour validation
  countries.yaml            # Liste des 32 pays avec metadata
  exchange-rates.yaml       # Taux de change EUR pour pays hors zone euro
```

### Schéma YAML d'un opérateur

```yaml
operator:
  id: "la-poste-fr"           # Identifiant unique (nom du fichier)
  name: "La Poste"            # Nom affiché
  country: "FR"               # Code ISO 3166-1 alpha-2
  currency: "EUR"             # Devise locale
  website: "https://www.laposte.fr"
  logo: "la-poste-fr.svg"     # Dans assets/logos/
  last_updated: "2026-04-01"  # Date de dernière vérification

letters:
  domestic:
    - name: "Lettre verte"
      max_weight_g: 20
      price_eur: 1.29
      delivery_days: [2, 4]     # [min, max]
    - name: "Lettre verte"
      max_weight_g: 100
      price_eur: 2.58
      delivery_days: [2, 4]
  international:
    zones:
      - name: "Europe"
        countries: ["DE", "ES", "IT", "BE", "NL", "PT", "AT", "CH", "GB"]
        rates:
          - max_weight_g: 20
            price_eur: 1.80
            delivery_days: [3, 7]
          - max_weight_g: 100
            price_eur: 3.60
            delivery_days: [3, 7]

parcels:
  domestic:
    - name: "Colissimo"
      max_weight_kg: 1
      price_eur: 6.40
      delivery_days: [2, 3]
      tracking: true
    - name: "Colissimo"
      max_weight_kg: 5
      price_eur: 8.95
      delivery_days: [2, 3]
      tracking: true
  international:
    zones:
      - name: "Europe"
        countries: ["DE", "ES", "IT", "BE", "NL", "PT", "AT", "CH", "GB"]
        rates:
          - max_weight_kg: 1
            price_eur: 9.50
            delivery_days: [3, 5]
            tracking: true
          - max_weight_kg: 5
            price_eur: 18.50
            delivery_days: [3, 5]
            tracking: true
```

### Règles de données

- Les prix sont toujours en **EUR**. Pour les pays hors zone euro (GB, CH, SE, NO, etc.), la conversion se fait au moment de la collecte avec le taux de `exchange-rates.yaml`.
- Les délais sont en **[min, max] jours ouvrables**.
- Le champ `last_updated` permet de signaler les données potentiellement obsolètes.
- Les zones internationales regroupent les pays selon la grille tarifaire de chaque opérateur.

### Validation

Un JSON Schema (`data/schema/operator.schema.json`) valide la structure de chaque fichier YAML. La validation tourne en CI (GitHub Actions) à chaque PR.

## Design visuel

### Direction artistique

- **Thème postal / papier kraft** : fond crème (#fdf6e3, #fffef7), bordures en pointillés (#c4a35a), tons chauds
- **Couleur primaire** : rouge postal (#c0392b) pour le header, les CTA, et le meilleur prix
- **Couleur secondaire** : doré/kraft (#8b6914) pour les labels et textes secondaires
- **Typographie** : sérif (Georgia ou similaire) pour les titres, sans-sérif pour le corps
- **Ton** : neutre, informatif, pas de publicité

### Layout responsive

**Desktop (1200px+)** :
- Header rouge avec logo et navigation
- Sidebar gauche (35%) : formulaire de recherche avec champs empilés (type, origine, destination, poids) + bouton "Comparer"
- Zone principale droite (65%) : résultats triés par prix croissant, cartes avec opérateur, produit, prix, délai
- Le meilleur prix est mis en évidence (bordure dorée, prix en rouge)

**Mobile (< 768px)** :
- Header avec menu burger
- Formulaire replié en résumé compact (pilules : "Colis", "FR→DE", "1 kg") avec bouton "Modifier" pour déplier
- Résultats empilés en cartes pleine largeur

**Tablette (768-1199px)** :
- Comme desktop avec proportions ajustées (40/60)

## Internationalisation (i18n)

Le site est disponible en **3 langues** : français (FR), anglais (EN), allemand (DE).

- Routing par préfixe : `/fr/`, `/en/`, `/de/` (FR comme langue par défaut)
- Fichiers de traduction dans `src/i18n/` (un fichier JSON par langue)
- Les données YAML (noms de produits, zones) restent en langue originale de l'opérateur — pas de traduction des noms de produits postaux
- Seule l'interface (labels, boutons, textes de page) est traduite
- Sélecteur de langue dans le header

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Accueil / Comparateur | `/[lang]/` | Formulaire de recherche + résultats |
| Fiche opérateur | `/[lang]/operator/[id]` | Tous les tarifs d'un opérateur, infos, lien officiel |
| À propos | `/[lang]/about` | Explication du projet, neutralité, méthodologie, open source |
| Contribuer | `/[lang]/contribute` | Guide pour signaler un prix incorrect via GitHub Issues/PR |

### Page d'accueil — Comparateur

1. L'utilisateur sélectionne : type (lettre/colis), poids, pays d'origine, pays de destination
2. Le moteur filtre les opérateurs proposant cette prestation pour cette route
3. Pour chaque opérateur, il trouve le tarif applicable (zone + tranche de poids)
4. Tri par prix croissant
5. Affichage : drapeau + nom opérateur, nom du produit, prix EUR, délai min-max

**Cas "national"** (même pays origine/destination) : recherche dans les tarifs `domestic`.
**Cas "international"** : recherche de la zone contenant le pays de destination dans les tarifs `international`.
**Cas "non couvert"** : si un opérateur n'a pas de zone couvrant le pays de destination, il n'apparaît pas dans les résultats.

### Saisie du poids

Le poids est un champ numérique libre (en grammes pour les lettres, en kg pour les colis). Le moteur trouve la tranche tarifaire applicable (premier `max_weight` supérieur ou égal au poids saisi). Si le poids dépasse toutes les tranches d'un opérateur, celui-ci n'apparaît pas dans les résultats.

### Fiche opérateur

Page générée statiquement pour chaque opérateur. Affiche :
- Logo, nom, pays, lien vers le site officiel
- Tableau de tous les tarifs lettres (domestique + international par zone)
- Tableau de tous les tarifs colis (domestique + international par zone)
- Date de dernière mise à jour

## Collecte des données

Les données de chaque poste nationale seront collectées manuellement depuis les sites officiels des opérateurs. La liste des 32 opérateurs à couvrir :

| Pays | Opérateur | Site |
|------|-----------|------|
| FR | La Poste | laposte.fr |
| DE | Deutsche Post | deutschepost.de |
| GB | Royal Mail | royalmail.com |
| ES | Correos | correos.es |
| IT | Poste Italiane | posteitaliane.it |
| NL | PostNL | postnl.nl |
| BE | bpost | bpost.be |
| PT | CTT | ctt.pt |
| AT | Österreichische Post | post.at |
| CH | La Poste Suisse | post.ch |
| SE | PostNord (SE) | postnord.se |
| DK | PostNord (DK) | postnord.dk |
| NO | Posten Norge | posten.no |
| FI | Posti | posti.fi |
| IE | An Post | anpost.com |
| PL | Poczta Polska | poczta-polska.pl |
| CZ | Česká pošta | ceskaposta.cz |
| RO | Poșta Română | posta-romana.ro |
| HU | Magyar Posta | posta.hu |
| GR | ΕΛΤΑ (ELTA) | elta.gr |
| BG | Български пощи | bgpost.bg |
| HR | Hrvatska pošta | posta.hr |
| SK | Slovenská pošta | posta.sk |
| SI | Pošta Slovenije | posta.si |
| LT | Lietuvos paštas | post.lt |
| LV | Latvijas Pasts | pasts.lv |
| EE | Omniva | omniva.ee |
| CY | Cyprus Post | cypruspost.gov.cy |
| LU | POST Luxembourg | post.lu |
| MT | MaltaPost | maltapost.com |
| IS | Íslandspóstur | postur.is |
| LI | Liechtenstein Post | post.li |

Pour les pays hors zone euro, les prix seront convertis en EUR au taux de change du jour de la collecte, indiqué dans `exchange-rates.yaml`.

## Contribution

- Les données sont open source dans le repo GitHub
- Pour signaler un prix incorrect : ouvrir une GitHub Issue avec le template dédié
- Pour corriger directement : ouvrir une PR modifiant le fichier YAML concerné
- La CI valide automatiquement le schéma avant merge
- La page `/contribute` explique le processus pas à pas

## Vérification

Pour tester le projet end-to-end :
1. Lancer `npm run dev` et vérifier que le site s'affiche
2. Tester le comparateur : sélectionner une lettre 20g FR→DE, vérifier que les résultats s'affichent triés par prix
3. Tester un colis 1kg national (FR→FR), vérifier les tarifs domestiques
4. Tester le responsive : redimensionner le navigateur, vérifier le repli du formulaire en mobile
5. Vérifier qu'une fiche opérateur affiche bien tous les tarifs
6. Lancer la validation du schéma YAML : `npm run validate`
7. Vérifier le build statique : `npm run build`
