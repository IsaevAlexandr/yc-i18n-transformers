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

  private updateKeyState = ({ name, context, ...langs }) => {
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

  updateKeys = (butchPayload) => {
    for (const payload of butchPayload) {
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
      AllowedStatuses.GENERATED;
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
    JSON.stringify(data, null, 4);

  private writeSyncKeyset = async (
    payload: KeysetValue
  ): Promise<KeysetValue> => {
    if (!fs.existsSync(this.dirPath)) {
      fs.mkdirSync(this.dirPath, { recursive: true });
    }

    fs.writeFileSync(
      path.join(this.dirPath, "context.json"),
      this.serializeJson(payload.context)
    );
    fs.writeFileSync(
      path.join(this.dirPath, "keyset.json"),
      this.serializeJson(payload.keyset)
    );

    for (const lang in Lang) {
      fs.writeFileSync(
        path.join(this.dirPath, `${lang}.json`),
        this.serializeJson(payload[lang])
      );
    }

    return payload;
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
