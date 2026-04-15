# PostCompare.eu

Comparateur gratuit et open source des tarifs postaux de 32 pays europeens.

**[www.postcompare.eu](https://www.postcompare.eu/fr/)**

## Fonctionnalites

- Comparaison de tarifs **lettres** et **colis** entre 32 pays europeens (UE27 + AELE + UK)
- Recherche par **type**, **poids**, **pays d'origine** et **destination**
- Trajet inverse affiche automatiquement
- Options affichees : assurance, recommande, signature, suivi
- **3 langues** : francais, anglais, allemand
- Fiche detaillee par operateur postal
- Donnees open source en YAML, contributions bienvenues

## Pays couverts

Allemagne, Autriche, Belgique, Bulgarie, Chypre, Croatie, Danemark, Espagne, Estonie, Finlande, France, Grece, Hongrie, Irlande, Islande, Italie, Lettonie, Liechtenstein, Lituanie, Luxembourg, Malte, Norvege, Pays-Bas, Pologne, Portugal, Republique tcheque, Roumanie, Royaume-Uni, Slovaquie, Slovenie, Suede, Suisse

## Stack technique

- [Astro](https://astro.build/) + [React](https://react.dev/) (composants interactifs)
- TypeScript
- Donnees YAML validees par JSON Schema
- Deploye sur GitHub Pages

## Structure du projet

```
data/
  operators/          # Un fichier YAML par operateur postal
  schema/             # JSON Schema de validation
  countries.yaml      # 32 pays avec noms trilingues
  exchange-rates.yaml # Taux de change EUR
src/
  components/         # Composants Astro + React
  i18n/               # Traductions FR/EN/DE
  lib/                # Moteur de comparaison, types, data loader
  styles/             # CSS theme postal
  pages/              # Pages Astro
```

## Contribuer

### Signaler un prix incorrect

Ouvrez une [Issue](../../issues/new?template=price-update.yml) en precisant l'operateur, le produit et le prix correct avec la source.

### Corriger directement

1. Forkez le depot
2. Modifiez le fichier YAML dans `data/operators/`
3. Verifiez le schema : `npm run validate`
4. Ouvrez une Pull Request

### Format des donnees

Chaque operateur est un fichier YAML conforme au schema `data/schema/operator.schema.json`. Exemple :

```yaml
operator:
  id: "la-poste-fr"
  name: "La Poste"
  country: "FR"
  currency: "EUR"
  website: "https://www.laposte.fr"
  logo: "la-poste-fr.svg"
  last_updated: "2026-01-01"

letters:
  domestic:
    - name: "Lettre verte"
      max_weight_g: 20
      price_eur: 1.52
      delivery_days: [2, 4]
      options:
        - name: "Recommande R1"
          price_eur: 3.00
```

## Developpement

```bash
npm install
npm run dev       # Serveur de dev sur localhost:4321
npm test          # Tests unitaires
npm run validate  # Validation des YAML
npm run build     # Build statique
```

## Licence

MIT
