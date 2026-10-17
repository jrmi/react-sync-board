import { shallow } from "zustand/shallow";

export const storeEquality = (current, next) => {
  if (Object.is(current, next)) {
    return true;
  }

  if (Array.isArray(current) && Array.isArray(next)) {
    return (
      current.length === next.length &&
      current.every((value, index) => Object.is(value, next[index]))
    );
  }

  return shallow(current, next);
};

export const equalArrayValues = (current, next) =>
  current.length === next.length &&
  current.every((value, index) => Object.is(value, next[index]));
