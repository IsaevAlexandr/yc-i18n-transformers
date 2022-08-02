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

- in you project root directory run command:

  ```sh
  npx yc-i18n-transformers -s src/**/*.tsx -n I18NCODEMOD -p "i18n@<keyset>"
  ```

- source files will be formatted into this:

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

  > Use `-k` option to emit/edit keysets on one dir: `npx yc-i18n-transformers -s src/ui/*.tsx -n I18NCODEMOD -k "src/i18n-keysets"`

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
npx yc-i18n-transformers -s ui/**/*.(ts|tsx|js|jsx) -k i18n/keysets -n i18nCODEMODE
```
