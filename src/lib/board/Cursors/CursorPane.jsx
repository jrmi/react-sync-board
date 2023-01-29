import React from "react";

import Cursors from "./Cursors";
import useWire from "@/hooks/useWire";
import { useUsers } from "@/users";
import useMainStore from "../store/main";

const CursorPane = ({ children }) => {
  const { wire } = useWire("board");
  const { currentUser: user, users } = useUsers();
  const getConfiguration = useMainStore((state) => state.getConfiguration);
  const getBoardState = useMainStore((state) => state.getBoardState);

  const publish = React.useCallback(
    (newPos) => {
      wire.publish("cursorMove", {
        userId: user.id,
        pos: newPos,
      });
    },
    [wire, user.id]
  );

  const onMouseMove = React.useCallback(
    ({ clientX, clientY }) => {
      const { scale, translateX, translateY } = getBoardState();
      const {
        boardWrapperRect: { left, top },
      } = getConfiguration();

      publish({
        x: (clientX - left - translateX) / scale,
        y: (clientY - top - translateY) / scale,
      });
    },
    [getBoardState, getConfiguration, publish]
  );

  const onLeave = () => {
    wire.publish("cursorOff", {
      userId: user.id,
    });
  };

  return (
    <div onPointerMove={onMouseMove} onPointerLeave={onLeave}>
      {children}
      <Cursors users={users} />
    </div>
  );
};

export default CursorPane;
