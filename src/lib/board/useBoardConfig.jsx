import React from "react";
import { useSyncedStore } from "@/board/store/synced";

const useBoardConfig = () => {
  const [boardConfig, getBoardConfig, setBoardConfig] = useSyncedStore(
    (state) => [state.boardConfig, state.getBoardConfig, state.setBoardConfig]
  );

  const setSyncBoardConfig = React.useCallback(
    (callbackOrConfig) => {
      let callback = callbackOrConfig;
      if (typeof callbackOrConfig === "object") {
        callback = () => callbackOrConfig;
      }

      const currentConfig = getBoardConfig();
      const newConfig = callback(currentConfig);
      setBoardConfig(newConfig);
    },
    [getBoardConfig, setBoardConfig]
  );

  return [boardConfig, setSyncBoardConfig];
};

export default useBoardConfig;
