import { shallow } from "zustand/shallow";

export const equalArrayValues = (current, next) => {
  if (current.length !== next.length) return false;
  for (let index = 0; index < current.length; index++) {
    if (!Object.is(current[index], next[index])) return false;
  }
  return true;
};

export const storeEquality = (current, next) => {
  if (Object.is(current, next)) {
    return true;
  }

  if (Array.isArray(current) && Array.isArray(next)) {
    return equalArrayValues(current, next);
  }

  return shallow(current, next);
};
