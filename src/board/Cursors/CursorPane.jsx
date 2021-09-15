import React from "react";
import { useRecoilValue } from "recoil";

import Cursors from "./Cursors";
import useWire from "../../hooks/useWire";
import { PanZoomRotateAtom } from "../atoms";

export const Board = ({ children, user, users }) => {
  const { wire } = useWire("board");
  const panZoomRotate = useRecoilValue(PanZoomRotateAtom);

  const publish = React.useCallback(
    (newPos) => {
      wire.publish("cursorMove", {
        userId: user.id,
        pos: newPos,
      });
    },
    [wire, user.id]
  );

  const onMouseMove = (e) => {
    const { top, left } = e.currentTarget.getBoundingClientRect();
    publish({
      x: (e.clientX - left) / panZoomRotate.scale,
      y: (e.clientY - top) / panZoomRotate.scale,
    });
  };

  const onLeave = () => {
    wire.publish("cursorOff", {
      userId: user.id,
    });
  };

  return (
    <div onMouseMove={onMouseMove} onMouseLeave={onLeave}>
      {children}
      <Cursors users={users} />
    </div>
  );
};

export default Board;
