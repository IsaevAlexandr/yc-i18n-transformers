import React from "react";

import { i18nCODEMODE, i18nCODE } from "~/utils/i18n";

interface HelloProps {
  name: string;
}

const Hello: React.FC<HelloProps> = ({ name }) => {
  return (
    <div>
      <h1>
        {i18nCODEMODE(
          "hello.page",
          "title",
          "Добрый день {name}",
          "Good day {name}",
          {
            name,
          }
        )}
        {i18nCODE(
          "hello.page",
          "title",
          "Добрый день {name}",
          "Good day {name}",
          {
            name,
          }
        )}
      </h1>
      <div>{i18nCODEMODE("hello.page", "description")}</div>
      <div>{i18nCODEMODE("hello.page", "counter", "{count} apples")}</div>
    </div>
  );
};

export default Hello;
