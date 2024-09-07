import fs from "fs";
import { AllowedStatuses, DEFAULT_KEYSET } from "../const";
import {
  KeysetBase,
  KeysetStatus,
  KeysetValue,
  Lang,
  LangFiles,
  LangPayload,
} from "../types";
import { TypescriptFormatter, JsonFormatter, Formatter } from './formatters';

const getFormatter = (format: string): Formatter => {
  if (format === 'ts') {
    return new TypescriptFormatter();
  }

  if (format === 'json') {
    return new JsonFormatter();
  }

  throw new Error(`Uknown formatter ${format}`);
}

export class Keyset implements KeysetBase {
  private _keyset: KeysetValue;
  private readonly formatter: Formatter;

  constructor(private readonly dirPath: string) {
    this._keyset = DEFAULT_KEYSET;
    this.formatter = getFormatter(process.env.KEYSET_FORMAT);
  }

  get value() {
    return this._keyset;
  }

  load = async (): Promise<void> => {
    if (!fs.existsSync(this.dirPath)) {
      fs.mkdirSync(this.dirPath, { recursive: true });
    }

    const context = await this.formatter.loadContexts(this.dirPath);
    const keyset = await this.formatter.loadStatuses(this.dirPath);

    const langs: LangFiles = {ru: DEFAULT_KEYSET.ru, en: DEFAULT_KEYSET.en};

    for (const lang of Object.values(Lang)) {
      langs[lang] = await this.formatter.loadKeyset(this.dirPath, lang);
    }

    this._keyset = {
      context,
      keyset,
      ...langs,
    };
  };

  update = async ({ context }) => {
    this._keyset.keyset.context = context;

    await this.writeKeyset(this._keyset);

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
  updateKey = async (payload) => {
    this.updateKeyState(payload);

    await this.writeKeyset(this._keyset);

    return this.value;
  };

  updateKeys = async (batchPayload) => {
    for (const payload of batchPayload) {
      this.updateKeyState(payload);
    }

    await this.writeKeyset(this._keyset);

    return this.value;
  };

  createKey = async ({ name, context, ...langs }) => {
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

    await this.writeKeyset(this._keyset);

    return this.value;
  };

  deleteKey = async (name) => {
    if (!this._keyset.keyset.status[name]) {
      throw new Error(`Key "${name}" does not exists`);
    }

    delete this._keyset.context[name];
    delete this._keyset.keyset.status[name];

    for (const lang in Lang) {
      delete this._keyset[lang][name];
    }

    await this.writeKeyset(this._keyset);

    return this.value;
  };

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

  private writeKeyset = async (
    payload: KeysetValue
  ): Promise<KeysetValue> => {
    if (!fs.existsSync(this.dirPath)) {
      fs.mkdirSync(this.dirPath, { recursive: true });
    }

    // add yargs option and flag here if keys sorting will not be needed
    const sortedKeysPayload = this.sortKeysetKeys(payload);

    await Promise.all([
      this.formatter.saveContexts(this.dirPath, sortedKeysPayload.context),
      this.formatter.saveStatuses(this.dirPath, sortedKeysPayload.keyset),
      ...Object.values(Lang).map((lang) =>
        this.formatter.saveKeyset(this.dirPath, lang, sortedKeysPayload[lang])
      ),
    ])

    return sortedKeysPayload;
  };
}
