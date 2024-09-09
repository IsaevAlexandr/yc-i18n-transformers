import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { run as jscodeshift } from "jscodeshift/src/Runner";
import globby from "globby";
import { KEYSET_REPLACE_KEYWORD } from "./const";

const FILES_EXTENSIONS_TO_TRANSFORM = ["js", "ts", "jsx", "tsx"];

const argv = yargs(hideBin(process.argv))
  .help()
  .option("source", {
    alias: "s",
    require: true,
    type: "array",
    description:
      'specify dir where to find codemods to replace with "i18n" function call',
  })
  .option("keysets", {
    alias: "k",
    type: "string",
    description:
      'Specify root dir for you keysets. For example "src/keysets. If keysets dir isn\'t specified, assume that keysets folder placed in the same folder with transformed file"',
  })
  .option("pattern", {
    alias: "p",
    type: "string",
    default: KEYSET_REPLACE_KEYWORD,
    description: `specify pattern to keyset folder. For example "i18n@${KEYSET_REPLACE_KEYWORD}" will be replaced with "i18n@some.keyset.name"`,
  })
  .option("format", {
    alias: "f",
    type: "string",
    default: "ts",
    choices: ["ts", "json"],
    description:
      "Specify the storage format of your keysets. For example, you can store keyset in json or typescript formats.",
  })
  .option("name", {
    alias: "n",
    type: "string",
    require: true,
    description: 'Codemode function name to replace with "i18n"',
  })
  .option("bind", {
    alias: "b",
    type: "string",
    description:
      "Allow to use codemode function without keyset name. Keyset name will be taken from this option",
  })
  .option("include", {
    alias: "i",
    type: "array",
    description: `What files include to transform. Default is (${FILES_EXTENSIONS_TO_TRANSFORM.join(
      "|"
    )}). For example:\n\t-i (js|ts)`,
  })

  .demandOption(
    "source",
    "Specify source file directory. You can specify multiple paths here. For example:\n\t-s src/some/path/to\n\t-s src/path src/more/path"
  )
  .demandOption(
    "name",
    "You need to specify function name to replace. For example:\n\t-n i18nSomeFn"
  )
  .strict().argv;

const start = async () => {
  // implicit usage of those variables in "updateKeysets" file
  process.env.CODEMODE_FUN_NAME = argv.name;
  process.env.KEYSET_DIRPATTERN = argv.pattern;
  process.env.KEYSET_FORMAT = argv.format;

  if (argv.bind) {
    process.env.TRANSFORM_KEYSET_NAME = argv.bind;
  }

  if (argv.keysets) {
    process.env.KEYSETS_ROOT_DIR = argv.keysets;
  }

  const paths = await globby([
    ...argv.source.map(
      (s) =>
        `${s}/**/*.(${(
          (argv.files as string[]) || FILES_EXTENSIONS_TO_TRANSFORM
        ).join("|")})`
    ),
  ]);

  try {
    await jscodeshift(
      path.join(
        __dirname,
        `transform.${process.env.NODE_ENV === "dev" ? "ts" : "js"}`
      ),
      paths,
      {
        verbose: 0,
        parser: "tsx",
        runInBand: true,
      }
    );
  } catch (e) {
    console.error(e);
  }
};

start();
