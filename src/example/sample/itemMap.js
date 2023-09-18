import { nanoid } from "nanoid";
import Rect from "./Rect";
import Cube from "./Cube";
import Round from "./Round";
import Token from "./Token";
import Cylinder from "./Cylinder";
import Zone from "./Zone";
import Screen from "./Screen";

import ErrorItem from "./ErrorItem";
import RectFormFields from "./forms/RectFormFields";
import ScreenFormFields from "./forms/ScreenFormFields";
import CubeFormFields from "./forms/CubeFormFields";
import RoundFormFields from "./forms/RoundFormFields";
import TokenFormFields from "./forms/TokenFormFields";
import CylinderFormFields from "./forms/CylinderFormFields";

const i18n = {
  t: (i) => i,
};

const sizeResize = ({ width, actualWidth, prevState }) => {
  let { size: currentSize } = prevState;
  currentSize = parseFloat(currentSize);
  if (!currentSize || Number.isNaN(Number(currentSize))) {
    currentSize = actualWidth;
  }

  return {
    ...prevState,
    size: (currentSize + width).toFixed(2),
  };
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
  zone: {
    component: Zone,
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
    name: i18n.t("Zone"),
    template: {},
  },
  screen: {
    component: Screen,
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
    form: ScreenFormFields,
    name: i18n.t("Screen"),
    template: { layer: -2 },
    stateHook: (state, { currentUser }) => {
      if (state.claimedBy && state.claimedBy !== currentUser.uid) {
        return { ...state, layer: 3.6 };
      }
      return state;
    },
  },
  cube: {
    component: Cube,
    defaultActions: ["rotate45", "shuffle", "lock", "remove"],
    availableActions: [
      "rotate",
      "rotate45",
      "rotate90",
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
    resize: sizeResize,
    resizeDirections: { b: true },
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
    resize: sizeResize,
    resizeDirections: { b: true },
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
    resize: sizeResize,
    resizeDirections: { b: true },
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
    resize: sizeResize,
    resizeDirections: { b: true },
  },
  error: {
    component: ErrorItem,
    defaultActions: [],
    availableActions: [],
    name: i18n.t("Error"),
    template: {},
  },
};

export const itemLibrary = Object.keys(itemTemplates).map((key) => ({
  type: key,
  ...itemTemplates[key],
  uid: nanoid(),
}));

export default itemTemplates;
