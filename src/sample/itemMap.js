// import i18n from "../i18n";

import { nanoid } from "nanoid";
import Rect from "./Rect";
import Cube from "./Cube";
import Round from "./Round";
import Token from "./Token";
import Cylinder from "./Cylinder";

import RectFormFields from "./forms/RectFormFields";
import CubeFormFields from "./forms/CubeFormFields";
import RoundFormFields from "./forms/RoundFormFields";
import TokenFormFields from "./forms/TokenFormFields";
import CylinderFormFields from "./forms/CylinderFormFields";

const i18n = {
  t: (i) => i,
};

const itemTemplates = {
  rect: {
    component: Rect,
    defaultActions: ["lock", "remove"],
    availableActions: [
      "stack",
      "alignAsLine",
      "alignAsSquare",
      "shuffle",
      "clone",
      "lock",
      "remove",
    ],
    form: RectFormFields,
    name: i18n.t("Rectangle"),
    template: {},
  },
  cube: {
    component: Cube,
    defaultActions: ["lock", "remove"],
    availableActions: [
      "stack",
      "alignAsLine",
      "alignAsSquare",
      "shuffle",
      "clone",
      "lock",
      "remove",
    ],
    form: CubeFormFields,
    name: i18n.t("Cube"),
    template: {},
  },
  cylinder: {
    component: Cylinder,
    defaultActions: ["lock", "remove"],
    availableActions: [
      "stack",
      "alignAsLine",
      "alignAsSquare",
      "shuffle",
      "clone",
      "lock",
      "remove",
    ],
    form: CylinderFormFields,
    name: i18n.t("Cylinder"),
    template: {},
  },
  round: {
    component: Round,
    defaultActions: ["lock", "remove"],
    availableActions: [
      "stack",
      "alignAsLine",
      "alignAsSquare",
      "shuffle",
      "clone",
      "lock",
      "remove",
    ],
    form: RoundFormFields,
    name: i18n.t("Round"),
    template: {},
  },
  token: {
    component: Token,
    defaultActions: ["lock", "remove"],
    availableActions: [
      "stack",
      "alignAsLine",
      "alignAsSquare",
      "shuffle",
      "clone",
      "lock",
      "remove",
    ],
    form: TokenFormFields,
    name: i18n.t("Token"),
    template: {},
  },
};

export const itemLibrary = Object.keys(itemTemplates).map((key) => ({
  type: key,
  ...itemTemplates[key],
  uid: nanoid(),
}));

export default itemTemplates;
