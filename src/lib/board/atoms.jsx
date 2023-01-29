import { atom } from "recoil";

export const BoardConfigAtom = atom({
  key: "boardConfig",
  default: {},
});

export default {
  BoardConfigAtom,
};
