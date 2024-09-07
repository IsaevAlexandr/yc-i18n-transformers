import React from "react";
import { Button } from "awesome-components-lib";

import { i18nCODEMODE, i18nPartial } from "~/utils/i18n";

import "./Example.scss";

// const helloText = i18n("first.keyset", "hero_label");
const helloText = i18nCODEMODE(
  "first.keyset",
  "hero_label",
  "Привет!",
  "Hello!"
);

// const partialCodemodHelloText = i18n("foo.bar", "hero_label");
const partialCodemodHelloText = i18nPartial("hero_label", "Привет!", "Hello!");

export const HeroBlock = () => {
  return (
    <div>
      <div>{helloText}</div>
      <Button>
        {i18nCODEMODE("first.keyset", "hello_action", "Нажми на меня!")}
      </Button>
      <div>{partialCodemodHelloText}</div>
      <Button>{i18nPartial("hello_action", "Нажми на меня!")}</Button>
    </div>
  );
};
