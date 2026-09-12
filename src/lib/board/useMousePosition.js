import { useEventListener } from "@react-hookz/web";
import React from "react";

const useMousePosition = (ref) => {
  const mouseRef = React.useRef({ hover: false, x: 0, y: 0 });

  useEventListener(ref, "mousemove", (e) => {
    const { clientX, clientY } = e;
    mouseRef.current.x = clientX;
    mouseRef.current.y = clientY;
  });
  useEventListener(ref, "mouseenter", () => {
    mouseRef.current.hover = true;
  });
  useEventListener(ref, "mouseleave", () => {
    mouseRef.current.hover = false;
  });

  const getMouseInfo = React.useCallback(() => mouseRef.current, []);

  return getMouseInfo;
};

export default useMousePosition;
