import React from "react";
import Gesture from "../Gesture";
import useMainStore from "../store/main";

const ResizeHandler = ({ onResize, ...rest }) => {
  const [getBoardState] = useMainStore((state) => [state.getBoardState]);

  const onDrag = ({ deltaX, deltaY, event }) => {
    event.stopPropagation();
    const { scale } = getBoardState();
    onResize({
      width: deltaX / scale,
      height: deltaY / scale,
    });
  };

  return (
    <Gesture onDrag={onDrag}>
      <div {...rest} />
    </Gesture>
  );
};

export default ResizeHandler;
