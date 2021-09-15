import React from "react";
import { useRecoilState } from "recoil";
import debounce from "lodash.debounce";

import useWire from "../hooks/useWire";
import { BoardConfigAtom } from "./atoms";

const useBoardConfig = () => {
  const { wire } = useWire("board");
  const [boardConfig, setBoardConfig] = useRecoilState(BoardConfigAtom);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedPublishUpdate = React.useCallback(
    debounce((newConfig) => {
      wire.publish("updateBoardConfig", newConfig);
    }, 1000),
    [wire]
  );

  const setSyncBoardConfig = React.useCallback(
    (callbackOrConfig, sync = true) => {
      let callback = callbackOrConfig;
      if (typeof callbackOrConfig === "object") {
        callback = () => callbackOrConfig;
      }
      setBoardConfig((prev) => {
        const newConfig = callback(prev);
        if (sync) {
          debouncedPublishUpdate(newConfig);
        }
        return newConfig;
      });
    },
    [setBoardConfig, debouncedPublishUpdate]
  );

  return [boardConfig, setSyncBoardConfig];
};

export default useBoardConfig;
