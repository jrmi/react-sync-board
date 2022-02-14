import React from "react";
import { useRecoilCallback } from "recoil";

import { BoardTransformAtom } from "./atoms";

const digitCodes = [...Array(5).keys()].map((id) => `Digit${id + 1}`);

const usePositionNavigator = () => {
  const [positions, setPositions] = React.useState({});

  const onKeyDown = useRecoilCallback(
    ({ snapshot, set }) =>
      async (e) => {
        // Block shortcut if we are typing in a textarea or input
        if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

        if (digitCodes.includes(e.code)) {
          const positionKey = e.code;
          const dim = await snapshot.getPromise(BoardTransformAtom);
          if (e.altKey || e.metaKey || e.ctrlKey) {
            setPositions((prev) => ({ ...prev, [positionKey]: { ...dim } }));
          } else if (positions[positionKey]) {
            set(BoardTransformAtom, (prev) => ({
              ...prev,
              ...positions[positionKey],
            }));
          }
          e.preventDefault();
        }
      },
    [positions]
  );

  React.useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  return null;
};

export default usePositionNavigator;
