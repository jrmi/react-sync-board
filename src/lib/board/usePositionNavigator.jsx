import React from "react";
import useMainStore from "./store/main";

const digitCodes = [...Array(5).keys()].map((id) => `Digit${id + 1}`);

const usePositionNavigator = () => {
  const [positions, setPositions] = React.useState({});
  const [getBoardState, updateBoardState] = useMainStore((state) => [
    state.getBoardState,
    state.updateBoardState,
  ]);

  const onKeyDown = React.useCallback(
    (e) => {
      // Block shortcut if we are typing in a textarea or input
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      if (digitCodes.includes(e.code)) {
        const positionKey = e.code;
        const { translateX, translateY, scale } = getBoardState();

        if (e.altKey || e.metaKey || e.ctrlKey) {
          setPositions((prev) => ({
            ...prev,
            [positionKey]: { translateX, translateY, scale },
          }));
        } else if (positions[positionKey]) {
          updateBoardState(positions[positionKey]);
        }
        e.preventDefault();
      }
    },
    [getBoardState, positions, updateBoardState]
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
