import { FileInfo, API, Options } from "jscodeshift";
import { DataForKeysets, updateKeysets } from "./updateKeysets";

const CODEMODE_FUN_NAME = process.env.CODEMODE_FUN_NAME;
const TRANSFORM_KEYSET_NAME = process.env.TRANSFORM_KEYSET_NAME;
const TARGET_FN_NAME = "i18n";

const printOptions = {
  quote: "single",
  trailingComma: true,
  objectCurlySpacing: false,
};

export default async function (file: FileInfo, api: API, options: Options) {
  const j = api.jscodeshift;
  const root = j(file.source);

  root
    // find all imports that match with codemod func name
    .find(j.ImportDeclaration, {
      specifiers(value): boolean {
        return !!value?.find((path) => path.local?.name === CODEMODE_FUN_NAME);
      },
    })
    .forEach((path) => {
      // removing the function name from the imports
      path.node.specifiers = path.node.specifiers?.filter(
        (path) =>
          path.type === "ImportSpecifier" &&
          path.local?.name !== CODEMODE_FUN_NAME
      );

      // if there is no i18n import, add it
      if (
        !path.node.specifiers?.find(
          (path) =>
            path.type === "ImportSpecifier" &&
            path.local?.name === TARGET_FN_NAME
        )
      ) {
        path.node.specifiers?.push(
          j.importSpecifier(j.identifier(TARGET_FN_NAME))
        );
      }
    });

  const data: DataForKeysets = {};

  root
    // find all places there codemod func called
    .find(j.CallExpression, {
      callee: { name: CODEMODE_FUN_NAME },
    })
    .forEach((path) => {
      // get information about arguments

      let params = null;

      if (TRANSFORM_KEYSET_NAME) {
        path.node.arguments.unshift(j.stringLiteral(TRANSFORM_KEYSET_NAME));
      }

      const [keyset, keyName, ru, en] = path.node.arguments.reduce<
        (string | string[])[]
      >((acc, path) => {
        if (path.type === "StringLiteral") {
          acc.push(path.value);
        }
        if (path.type === "ArrayExpression") {
          path.elements.values();

          acc.push(
            path.elements.reduce<string[]>((acc, pa) => {
              if (pa.type === "StringLiteral") {
                acc.push(pa.value);
              }
              return acc;
            }, [])
          );
        }

        if (path.type === "ObjectExpression") {
          params = path;
        }

        return acc;
      }, []);

      if (!data[keyset as string]) {
        data[keyset as string] = {
          path: file.path,
          keyData: {},
        };
      }

      const newKeyData = {
        ru: ru ?? "",
        en: en ?? "",
      }

      const currentKeyData = data[keyset as string].keyData[keyName as string];

      if (
          currentKeyData && (
              currentKeyData?.ru !== newKeyData?.ru ||
              currentKeyData?.en !== newKeyData?.en
          )
      ) {
        throw new Error(`Conflict for keyName: "${keyName}" check usage!`);
      }

      // store keysets data in temporal object
      data[keyset as string].keyData[keyName as string] = newKeyData;

      const args = path.node.arguments.slice(0, 2);

      if (params) {
        args.push(params);
      }
      // replace codemod function with original
      j(path).replaceWith(j.callExpression(j.identifier(TARGET_FN_NAME), args));
    });

  // update keysets files with collected data
  if (Object.keys(data).length > 0) {
    updateKeysets(data);
  }

  return root.toSource(options.printOptions || printOptions);
}
