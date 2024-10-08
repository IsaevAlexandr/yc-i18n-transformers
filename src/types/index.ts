import { AllowedStatuses } from "../const";

export interface KeysetBase {
  value: KeysetValue;
  update({ context: string }): KeysetValue;
  updateKey(payload: KeyPayload): KeysetValue;
  updateKeys(payload: KeyPayload[]): KeysetValue;
  createKey(payload: KeyPayload): KeysetValue;
  deleteKey(payload: string): KeysetValue;
}

export enum Lang {
  ru = "ru",
  en = "en",
}

export type KeysetStatus = Record<Lang, AllowedStatuses>;

export interface KeysetFile {
  context: string;
  allowedStatuses: AllowedStatuses[];
  status: Record<string, KeysetStatus>;
}
export interface ContextFile {
  [s: string]: string;
}

export type LangFileValue = string[] | string | Record<string, string>;
export interface LangFile {
  [s: string]: LangFileValue;
}

export type LangFiles = Record<Lang, LangFile>;

export type KeysetValue = LangFiles & {
  context: ContextFile;
  keyset: KeysetFile;
};

export type LangPayload = {
  value: LangFileValue;
  allowedStatus: AllowedStatuses;
};

export type KeysetPayload = {
  context: string;
  name: string;
};
export type KeyPayload = Record<Lang, LangPayload> & {
  context: string;
  name: string;
};
