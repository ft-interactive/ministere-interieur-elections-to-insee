# Ministère de L'Intérieur Election Geocode to INSEE Translation Table

This repo generates a translation table mapping the weird coding scheme used by
the French Ministère de L'Intérieur to the commonly-used INSEE codes predominantly used
in geographical software.

## Usage:

1. Install:
  ```sh
  $ npm install ft-interactive/ministere-interieur-elections-to-insee --save
  ```

2. Require `government-to-insee.json` in your code:

  ES6 modules (Dependent upon transpiler/packager being able to import JSON):
  ```javascript
  import * as translationTable from 'ministere-interieur-elections-to-insee';
  ```

  CommonJS `require()`:
  ```javascript
  const translationTable = require('ministere-interieur-elections-to-insee');
  ```

3. Check translation table for government code to get corresponding INSEE code:

  ```
  const paris_1er_Arrondissement_INSEE = translationTable['75056AR01']; // Returns '75101'
  ```

## Building:

It's inevitable that some boundary changes will occur before the next French election. To rebuild
the table, you need to do a few things:

1. Clone repo:

  ```sh
  $ git clone https://github.com/ft-interactive/ministere-interieur-elections-to-insee
  ```

2. Install dependencies:

  npm:
  ```sh
  $ npm install
  ```

  Yarn:
  ```sh
  $ yarn install
  ```

3. Download the latest versions of the commune and arrondissement shapefiles from:
https://www.data.gouv.fr/en/datasets/decoupage-administratif-communal-francais-issu-d-openstreetmap/

You want the latest "Export simple" and "Arrondissements Municipaux" files.

4. Move the .shp and .dbf files from each zipfile into `data/`

5. Copy `referencePR/listeregdptcom.xml` from http://elections.interieur.gouv.fr/ into `data/`

6. Create the JSON sources from the data:

```sh
$ npm run convert-communes-shp && npm run convert-arrondissements-shp && npm run create-sources
```

7. Generate the translation table:

```sh
$ npm run create-table
```

### Notes:

1. There is also a CSV version generated at code-translation-table.csv in this repo.
2. The generation process compares the name strings using Dice's coefficient and reports a warning
when this is less than 0.4. Any such results are saved in `data/possibly-dubious-codes`.
