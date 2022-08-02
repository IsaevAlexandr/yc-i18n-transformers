import path from "path";
import { KEYSET_REPLACE_KEYWORD, AllowedStatuses } from "./const";
import { Keyset } from "./models/Keyset";

export type DataForKeysets = Record<
  string,
  {
    path: string;
    keyData: Record<string, { ru: string | string[]; en: string | string[] }>;
  }
>;

export const updateKeysets = async (data: DataForKeysets) => {
  // if KEYSETS_ROOT_DIR passed assume that we works with keysets in one directory mode
  const keysetsRootDir = process.env.KEYSETS_ROOT_DIR;
  const pattern = process.env.KEYSET_DIRPATTERN;

  for (const keysetName of Object.keys(data)) {
    const dirName = pattern.replace(KEYSET_REPLACE_KEYWORD, keysetName);
    const pathToKeyset = path.join(
      process.cwd(),
      keysetsRootDir
        ? path.join(keysetsRootDir, dirName)
        : path.join(data[keysetName].path, "..", dirName)
    );

    const keyset = new Keyset(pathToKeyset);

    const batchPayload = Object.entries(data[keysetName].keyData).map(
      ([keyName, { en, ru }]) => {
        return {
          name: keyName,
          context: "",
          en: {
            allowedStatus: AllowedStatuses.REQUIRES_TRANSLATION,
            value: en,
          },
          ru: { allowedStatus: AllowedStatuses.EXPIRED, value: ru },
        };
      }
    );

    keyset.updateKeys(batchPayload);
  }
};
