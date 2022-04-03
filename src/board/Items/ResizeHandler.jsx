import React from "react";
import { useRecoilCallback } from "recoil";
import Gesture from "../Gesture";
import { BoardTransformAtom } from "../atoms";

const ResizeHandler = ({ onResize, ...rest }) => {
  const onDrag = useRecoilCallback(
    ({ snapshot }) =>
      async ({ deltaX, deltaY, event }) => {
        event.stopPropagation();
        const { scale } = await snapshot.getPromise(BoardTransformAtom);
        onResize({
          width: deltaX / scale,
          height: deltaY / scale,
        });
      },
    [onResize]
  );

  return (
    <Gesture onDrag={onDrag}>
      <div {...rest} />
    </Gesture>
  );
};

export default ResizeHandler;
