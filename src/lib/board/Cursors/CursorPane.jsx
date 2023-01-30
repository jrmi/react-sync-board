import React from "react";

import Cursors from "./Cursors";
import useMainStore from "@/board/store/main";
import { useSyncedUsers } from "@/users/store";

const CursorPane = ({ children }) => {
  const currentUser = useSyncedUsers((state) => state.getUser());
  const [moveCursor, removeCursor] = useSyncedUsers((state) => [
    state.moveCursor,
    state.removeCursor,
  ]);
  const getConfiguration = useMainStore((state) => state.getConfiguration);
  const getBoardState = useMainStore((state) => state.getBoardState);

  const onMouseMove = React.useCallback(
    ({ clientX, clientY }) => {
      const { scale, translateX, translateY } = getBoardState();
      const {
        boardWrapperRect: { left, top },
      } = getConfiguration();
      const newPos = {
        x: (clientX - left - translateX) / scale,
        y: (clientY - top - translateY) / scale,
      };
      moveCursor(currentUser.id, newPos);
    },
    [getBoardState, getConfiguration, moveCursor, currentUser.id]
  );

  const onLeave = () => {
    removeCursor(currentUser.id);
  };

  return (
    <div onPointerMove={onMouseMove} onPointerLeave={onLeave}>
      {children}
      <Cursors />
    </div>
  );
};

export default CursorPane;
