# Task 2 — Verified current postal rates

## Scope completed

- Updated only the verified values for bpost, PostNL, Posti, Posten Norge, ELTA,
  Hrvatska pošta, and Lietuvos paštas.
- Added official operator-level sources and the supplied effective/retrieval dates.
- Isolated PostNL's verified EUR1 destinations (`BE`, `DK`, `DE`, `FR`, `IT`,
  `LU`, `AT`, `ES`, `SE`) from pre-existing, unverified European destinations.
- Marked PostNord Denmark letter services unavailable from `2026-01-01` and
  made the comparison engine omit unavailable letter services.
- Removed the four discontinued Italian `Posta 1` domestic tiers. No
  `Postapriority Internazionale` entry existed in the baseline; active
  `Postamail Internazionale` entries were retained.
- Replaced only Posti's duplicate domestic `<=50g` entries; its higher tiers
  were left untouched. Croatia's unverified parcel tiers above 2 kg were also
  left untouched.

## TDD evidence

The regression tests were written before the tariff and engine changes. The
breaks they target are: a wrong published rate, a verified PostNL rate leaking
to unverified destinations, discontinued Italian product visibility, missing
source/date provenance, and unavailable letters appearing in comparisons.

### RED

Command (Docker only, using `postcompare_2027_node_modules`):

```sh
docker run --rm -v "$PWD":/app -v postcompare_2027_node_modules:/app/node_modules -w /app node:22 npm test -- tests/current-rates.test.ts tests/comparison-engine.test.ts
```

Result: exit 1; 2 test files failed, 10 tests failed, and 12 passed. The
failures matched the intended missing behaviour: bpost returned `2.90` rather
than `3.07`, PostNL returned old Europe prices, Posti still had two `<=50g`
tiers, Posten returned `2.38`, PostNord did not expose availability metadata,
Italian `Posta 1` remained, ELTA returned `0.90`, Croatian/Lithuanian `<=50g`
tiers were absent, and the comparison engine still returned an unavailable
letter service.

### GREEN

Same focused Docker command after the minimal implementation:

```text
Test Files  2 passed (2)
Tests       22 passed (22)
```

## Final verification

```sh
docker run --rm -v "$PWD":/app -v postcompare_2027_node_modules:/app/node_modules -w /app node:22 npm test
```

```text
Test Files  4 passed (4)
Tests       64 passed (64)
```

```sh
docker run --rm -v "$PWD":/app -v postcompare_2027_node_modules:/app/node_modules -w /app node:22 npm run validate
```

```text
All 32 operator files and postal changes valid.
```

The test runner emitted its existing Vite `configLoader: 'native'` migration
warning. Validation used `npx tsx` inside Docker and emitted npm's notice that
it installed `tsx@4.23.12` in the dedicated Docker node_modules volume; no npm
command ran on the host.

## Files changed

- `data/operators/bpost-be.yaml`
- `data/operators/postnl-nl.yaml`
- `data/operators/posti-fi.yaml`
- `data/operators/posten-norge-no.yaml`
- `data/operators/postnord-dk.yaml`
- `data/operators/poste-italiane-it.yaml`
- `data/operators/elta-gr.yaml`
- `data/operators/hrvatska-posta-hr.yaml`
- `data/operators/lietuvos-pastas-lt.yaml`
- `src/lib/comparison-engine.ts`
- `tests/comparison-engine.test.ts`
- `tests/current-rates.test.ts`
- This report

## Auto-review

- `git diff --check` returned no whitespace errors.
- Confirmed PostNL's newly priced EUR1 zone contains exactly the nine verified
  destinations and leaves the remaining prior countries in a separate,
  unchanged-rate zone.
- Confirmed the Norway change is limited to the Europe letter `<=50g` tier;
  parcel zones are untouched.
- Confirmed Croatia replaces only domestic parcel `0.5kg`/`1kg` with the
  verified universal `<=2kg` tier and preserves its higher tiers without
  claiming they were revalidated.
- Confirmed `Postamail Internazionale` remains while `Posta 1` is absent.
- No blocking issues found.

## Commit

`HEAD` — `fix: refresh verified postal rates`

## Fix round 1 — PostNord unavailability provenance

Added the missing operator-level source proving the end of PostNord Denmark's
letter service, with the exact official URL, retrieval date `2026-08-10`, and
effective date `2026-01-01`.

### TDD RED

```sh
docker run --rm -v "$PWD":/app -v postcompare_2027_node_modules:/app/node_modules -w /app node:22 npm test -- tests/current-rates.test.ts
```

Result: exit 1; 1 failed and 8 passed. The targeted assertion reported
`operator.sources` as `undefined` instead of the expected PostNord source.

### GREEN and verification

The same targeted command passed: 1 file and 9 tests passed.

```sh
docker run --rm -v "$PWD":/app -v postcompare_2027_node_modules:/app/node_modules -w /app node:22 npm test
```

Result: 5 files and 70 tests passed.

```sh
docker run --rm -v "$PWD":/app -v postcompare_2027_node_modules:/app/node_modules -w /app node:22 npm run validate
```

Result: all 32 operator files and postal changes valid. The existing Vite
migration warning and Docker-local `npx tsx` installation notice were unchanged.

### Files and auto-review

- `data/operators/postnord-dk.yaml`
- `tests/current-rates.test.ts`
- This report

`git diff --check` returned no errors. The YAML source fields exactly match the
review-provided values, the test asserts all four fields, and no rate or
availability value changed in this round.

Commit: `HEAD` — `fix: cite PostNord letter closure`

## Fix round 2 — Exact official PostNord title

Replaced the shortened English title with the official Danish page title:
`PostNord leverer sit sidste brev ved udgangen af 2025: Det betyder det for
dig`. The URL, retrieval/effective dates, rates, and availability metadata were
not changed.

### TDD RED

```sh
docker run --rm -v "$PWD":/app -v postcompare_2027_node_modules:/app/node_modules -w /app node:22 npm test -- tests/current-rates.test.ts
```

Result: exit 1; 1 failed and 8 passed. The diff showed only the expected title
mismatch between the shortened English value and the exact Danish title.

### GREEN and verification

- Targeted test: 1 file and 9 tests passed.
- Full test suite: 5 files and 70 tests passed.
- `npm run validate`: all 32 operator files and postal changes valid.

All npm commands ran in Docker with the `postcompare_2027_node_modules` volume.
The existing Vite migration warning and Docker-local `npx tsx` installation
notice were unchanged.

### Files and auto-review

- `data/operators/postnord-dk.yaml`
- `tests/current-rates.test.ts`
- This report

`git diff --check` returned no errors. The YAML and assertion use the exact
review-provided title; URL and dates are byte-for-byte unchanged. No tariff or
availability field changed.

Commit: `HEAD` — `fix: use official PostNord source title`
