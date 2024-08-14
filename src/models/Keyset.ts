import fs from "fs";
import path from "path";
import { AllowedStatuses, DEFAULT_KEYSET } from "../const";
import {
  KeysetBase,
  KeysetStatus,
  KeysetValue,
  Lang,
  LangFiles,
  LangPayload,
} from "../types";

export class Keyset implements KeysetBase {
  private readonly _keyset: KeysetValue;

  constructor(private readonly dirPath: string, initialValue?: KeysetValue) {
    this._keyset = this.readSyncKeysetValue(initialValue);
  }

  get value() {
    return this._keyset;
  }

  update = ({ context }) => {
    this._keyset.keyset.context = context;

    this.writeSyncKeyset(this._keyset);

    return this.value;
  };

  private checkConflictUpdateKey = ({ name, context, ...langs }) => {
    let hasConflict = false;

    for (const lang in langs) {
      const currentValue = (langs[lang] as LangPayload)?.value;
      const prevValue = this._keyset[lang][name];
      if (prevValue && currentValue !== prevValue) {
        hasConflict = true;
      }
    }

    return hasConflict;
  }

  private updateKeyState = ({ name, context, ...langs }) => {
    if (this.checkConflictUpdateKey({ name, context, ...langs})) {
      throw new Error(`Conflict for keyName: "${name}" check usage!`);
    }

    this._keyset.context[name] = context;

    for (const key in langs) {
      const langPayload = langs[key] as LangPayload;

      if (typeof langPayload.value !== "undefined") {
        this._keyset[key][name] = langPayload.value;
      }
      if (langPayload.allowedStatus) {
        if (!this._keyset.keyset.status[name]) {
          this._keyset.keyset.status[name] = {
            ru: AllowedStatuses.GENERATED,
            en: AllowedStatuses.GENERATED,
          };
        }

        this._keyset.keyset.status[name][key] = langPayload.allowedStatus;
      }
    }

    return this.value;
  };
  updateKey = (payload) => {
    this.updateKeyState(payload);

    this.writeSyncKeyset(this._keyset);

    return this.value;
  };

  updateKeys = (batchPayload) => {
    for (const payload of batchPayload) {
      this.updateKeyState(payload);
    }

    this.writeSyncKeyset(this._keyset);

    return this.value;
  };

  createKey = ({ name, context, ...langs }) => {
    if (this._keyset.keyset?.status?.[name]) {
      throw new Error(`Key "${name}" already exists`);
    }

    this._keyset.context[name] = context || "";
    for (const lang in Lang) {
      this._keyset[lang][name] = langs?.[lang]?.value || "";
      if (!this._keyset.keyset.status[name]) {
        this._keyset.keyset.status[name] = {} as KeysetStatus;
      }

      this._keyset.keyset.status[name][lang] = langs?.[lang]?.allowedStatus;
    }

    this.writeSyncKeyset(this._keyset);

    return this.value;
  };

  deleteKey = (name) => {
    if (!this._keyset.keyset.status[name]) {
      throw new Error(`Key "${name}" does not exists`);
    }

    delete this._keyset.context[name];
    delete this._keyset.keyset.status[name];

    for (const lang in Lang) {
      delete this._keyset[lang][name];
    }

    this.writeSyncKeyset(this._keyset);

    return this.value;
  };

  private serializeJson = (data: unknown): string =>
    JSON.stringify(data, null, 2) + "\n";

  private sortObjectKeys = (obj: Object) => {
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = obj[key];
        return acc;
      }, {});
  };

  private sortKeysetKeys = (obj: KeysetValue) => {
    obj.en = this.sortObjectKeys(obj.en);
    obj.ru = this.sortObjectKeys(obj.ru);
    obj.keyset.status = this.sortObjectKeys(obj.keyset.status);
    obj.context = this.sortObjectKeys(obj.context);

    return obj;
  };

  private writeSyncKeyset = async (
    payload: KeysetValue
  ): Promise<KeysetValue> => {
    if (!fs.existsSync(this.dirPath)) {
      fs.mkdirSync(this.dirPath, { recursive: true });
    }

    // add yargs option and flag here if keys sorting will not be needed
    const sortedKeysPayload = this.sortKeysetKeys(payload);

    fs.writeFileSync(
      path.join(this.dirPath, "context.json"),
      this.serializeJson(sortedKeysPayload.context)
    );
    fs.writeFileSync(
      path.join(this.dirPath, "keyset.json"),
      this.serializeJson(sortedKeysPayload.keyset)
    );

    for (const lang in Lang) {
      fs.writeFileSync(
        path.join(this.dirPath, `${lang}.json`),
        this.serializeJson(sortedKeysPayload[lang])
      );
    }

    return sortedKeysPayload;
  };

  private readSyncKeysetValue = (
    initialValue: KeysetValue = DEFAULT_KEYSET
  ): KeysetValue => {
    if (!fs.existsSync(this.dirPath)) {
      fs.mkdirSync(this.dirPath, { recursive: true });
    }

    const contextFilePath = path.join(this.dirPath, "context.json");
    const keysetFilePath = path.join(this.dirPath, "keyset.json");

    if (!fs.existsSync(contextFilePath)) {
      fs.writeFileSync(
        contextFilePath,
        this.serializeJson(initialValue.context)
      );
    }

    const context = JSON.parse(String(fs.readFileSync(contextFilePath)));

    if (!fs.existsSync(keysetFilePath)) {
      fs.writeFileSync(keysetFilePath, this.serializeJson(initialValue.keyset));
    }

    const keyset = JSON.parse(String(fs.readFileSync(keysetFilePath)));

    const langs = Object.values(Lang).reduce((acc, lang) => {
      const langPath = path.join(this.dirPath, `${lang}.json`);

      if (!fs.existsSync(langPath)) {
        fs.writeFileSync(langPath, this.serializeJson(initialValue[lang]));
      }

      acc[lang] = JSON.parse(String(fs.readFileSync(langPath)));

      return acc;
    }, {} as LangFiles);

    return {
      context,
      keyset,
      ...langs,
    };
  };
}
