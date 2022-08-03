import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { run as jscodeshift } from "jscodeshift/src/Runner";
import globby from "globby";
import { KEYSET_REPLACE_KEYWORD } from "./const";

const argv = yargs(hideBin(process.argv))
  .help()
  .option("source", {
    alias: "s",
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
  .option("name", {
    alias: "n",
    type: "string",
    default: "i18nCODEMODE",
    description:
      'ability to override default "i18nCODEMOD" codemod function name to replace',
  })

  .demandOption(
    ["source"],
    "Please provide all parameters to correct work of tool"
  )
  .strict().argv;

const start = async () => {
  // implicit usage of those variables in "updateKeysets" file
  process.env.CODEMODE_FUN_NAME = argv.name;
  process.env.KEYSET_DIRPATTERN = argv.pattern;
  if (argv.keysets) {
    process.env.KEYSETS_ROOT_DIR = argv.keysets;
  }

  const paths = await globby([...argv.source]);

  try {
    await jscodeshift(path.join(__dirname, "transform.js"), paths, {
      verbose: 0,
      parser: "tsx",
      runInBand: true,
    });
  } catch (e) {
    console.error(e);
  }
};

start();
