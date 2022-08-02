import React from "react";
import { Button } from "awesome-components-lib";

import { i18nCODEMODE } from "~/utils/i18n";

import "./Example.scss";

const helloText = i18nCODEMODE(
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
        {i18nCODEMODE("first.keyset", "hello_action", "Нажми на меня!")}
      </Button>
    </div>
  );
};
