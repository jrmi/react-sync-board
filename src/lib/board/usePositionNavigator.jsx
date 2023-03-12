import React from "react";
import { useEventListener } from "@react-hookz/web/esm/useEventListener";

import useMainStore from "./store/main";

const digitCodes = [...Array(5).keys()].map((id) => `Digit${id + 1}`);

const usePositionNavigator = () => {
  const [positions, setPositions] = React.useState({});
  const [getBoardState, updateBoardState] = useMainStore((state) => [
    state.getBoardState,
    state.updateBoardState,
  ]);

  useEventListener(document, "keydown", (e) => {
    // Block shortcut if we are typing in a textarea or input
    if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

    if (digitCodes.includes(e.code)) {
      const positionKey = e.code;
      const { translateX, translateY, scale } = getBoardState();

      if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) {
        setPositions((prev) => ({
          ...prev,
          [positionKey]: { translateX, translateY, scale },
        }));
      } else if (positions[positionKey]) {
        updateBoardState(positions[positionKey]);
      }
      e.preventDefault();
    }
  });

  return null;
};

export default usePositionNavigator;
