import React from "react";
import { useRecoilCallback } from "recoil";

import Cursors from "./Cursors";
import useWire from "@/hooks/useWire";
import { BoardTransformAtom } from "../atoms";
import { useUsers } from "@/users";
import useMainStore from "../store/main";

const CursorPane = ({ children }) => {
  const { wire } = useWire("board");
  const { currentUser: user, users } = useUsers();
  const getConfiguration = useMainStore((state) => state.getConfiguration);

  const publish = React.useCallback(
    (newPos) => {
      wire.publish("cursorMove", {
        userId: user.id,
        pos: newPos,
      });
    },
    [wire, user.id]
  );

  const onMouseMove = useRecoilCallback(
    ({ snapshot }) =>
      async ({ clientX, clientY }) => {
        const { scale, translateX, translateY } = await snapshot.getPromise(
          BoardTransformAtom
        );
        const {
          boardWrapperRect: { left, top },
        } = getConfiguration();

        publish({
          x: (clientX - left - translateX) / scale,
          y: (clientY - top - translateY) / scale,
        });
      },
    [getConfiguration, publish]
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
