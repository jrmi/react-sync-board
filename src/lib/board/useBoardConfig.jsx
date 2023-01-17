import React from "react";
import { useRecoilState } from "recoil";
import { useDebouncedCallback } from "@react-hookz/web/esm";

import useWire from "@/hooks/useWire";
import { BoardConfigAtom } from "./atoms";

const useBoardConfig = () => {
  const { wire } = useWire("board");
  const [boardConfig, setBoardConfig] = useRecoilState(BoardConfigAtom);

  const debouncedPublishUpdate = useDebouncedCallback(
    (newConfig) => {
      wire.publish("updateBoardConfig", newConfig);
    },
    [wire],
    1000
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
