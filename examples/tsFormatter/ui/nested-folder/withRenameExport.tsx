import React from "react";
import { Button } from "awesome-components-lib";

import { i18nCODEMODE as i18nEXAMPLE } from "~/utils/i18n";

import "./Example.scss";

const helloText = i18nEXAMPLE(
  "first.keyset",
  "hero_label",
  "Привет!",
  "Hello!"
);

export const HeroBlock = () => {
  return (
    <div>
      <div>{helloText}</div>
      <Button>
        {i18nEXAMPLE("first.keyset", "hello_action", "Нажми на меня!")}
      </Button>
    </div>
  );
};
