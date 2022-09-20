import {
  KeyPayload,
  KeysetValue,
  Lang,
  LangFiles,
  LangPayload,
} from "../types";

export enum AllowedStatuses {
  APPROVED = "APPROVED",
  EXPIRED = "EXPIRED",
  GENERATED = "GENERATED",
  REQUIRES_TRANSLATION = "REQUIRES_TRANSLATION",
  TRANSLATED = "TRANSLATED",
}

export const allowedStatuses = [
  AllowedStatuses.APPROVED,
  AllowedStatuses.EXPIRED,
  AllowedStatuses.GENERATED,
  AllowedStatuses.REQUIRES_TRANSLATION,
  AllowedStatuses.TRANSLATED,
];

export const KEYSETS_PATH = "keysets";

export const DEFAULT_KEYSET: KeysetValue = {
  context: {},
  keyset: {
    context: "",
    status: {},
    allowedStatuses,
  },

  ...Object.keys(Lang).reduce((acc, lang) => {
    acc[lang] = {};
    return acc;
  }, {} as LangFiles),
};

export const KEYSET_REPLACE_KEYWORD = "<keyset>";

export const PLURALS_COUNT = 6;
