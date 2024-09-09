# yc-i18n-transformers

Transform source code related to [`i18n`](https://github.com/yandex-cloud/i18n) staff. During transforming process, keysets with translations will be emitted. No more manual manipulation with `.json` files

## Prerequisites:

- you know that `node.js` is and have one installed

## Tool description and options:

```sh
npx yc-i18n-transformers --help
```

## Usage:

- for example, during development process you have received the following code:

  ```tsx
  // src/Button.tsx

  // this import needed to understand where the import of i18n functions should be from
  // I18NCODEMOD - implementation of this function is at your discretion
  import { I18NCODEMOD } from "~/utils/i18n";

  const Button = () => (
    <Button>
      {I18NCODEMOD("example.keyset", "parrot", "Попугай", "Parrot")}
    </Button>
  );
  ```

  > You can also omit the first argument (keyset name) and bind the keyset name from the `-b` (bind) option.
  >
  > ```tsx
  > // assume that kayset name come from cli args
  > const Button = () => (
  >   <Button>{I18NCODEMOD("parrot", "Попугай", "Parrot")}</Button>
  > );
  > ```
  >
  > ```sh
  > npx yc-i18n-transformers -s ui -n I18NCODEMOD -b 'zoo'
  > ```

- in you project root directory run command:

  ```sh
  npx yc-i18n-transformers -s src -n I18NCODEMOD -p "i18n@<keyset>"
  ```

- source files will be formatted into this code:

  ```tsx
  // src/Button.tsx
  import i18n from "~/utils/i18n";

  const Button = () => <Button>{i18n("example.keyset", "parrot")}</Button>;
  ```

- and files with keysets will be emitted near the transformed file

  ```diff
      src
      │   Button.tsx
  +   └───i18n@example.keyset
  +       │   ru.json
  +       │   en.json
  +       │   keyset.json
  +       │   context.json
  ```

  > Use `-k` option to emit/edit keysets on one dir: `npx yc-i18n-transformers -s src/ui -n I18NCODEMOD -k "src/i18n-keysets"`

  ```diff
      src
      └───ui
      │   │   Button.tsx
  +   └───i18n-keysets
  +       └───example.keyset
  +           │   ru.json
  +           │   en.json
  +           │   keyset.json
  +           │   context.json
  ```

## Quick try

```sh
git clone https://github.com/IsaevAlexandr/yc-i18n-transformers.git
cd yc-i18n-transformers/examples/singleKeysetDir
npx yc-i18n-transformers -s ui -k i18n/keysets -n i18nCODEMODE
```

## development

```sh
npm i
# for local development try this commands
npm run dev --  -s examples/singleKeysetDir -n i18nPartial -b foo.bar -k examples/singleKeysetDir/i18n-keysets
npm run dev --  -s examples/singleKeysetDir -n i18nCODEMODE -k examples/singleKeysetDir/i18n-keysets
npm run dev --  -s examples/singleKeysetDir -n i18nCODEMODE -p "i18n@<keyset>"
npm run dev --  -s examples/singleKeysetDir -n i18nCODEMODE -k examples/singleKeysetDir/i18n-keysets --include js

npm run dev --  -s examples/tsFormatter -n i18nPartial -b foo.bar -k examples/tsFormatter/i18n-keysets -f json
npm run dev --  -s examples/tsFormatter -n i18nCODEMODE -k examples/tsFormatter/i18n-keysets --format json
npm run dev --  -s examples/tsFormatter -n i18nCODEMODE -p "i18n@<keyset>" --format json
npm run dev --  -s examples/tsFormatter -n i18nCODEMODE -k examples/tsFormatter/i18n-keysets -i js -f json
```
