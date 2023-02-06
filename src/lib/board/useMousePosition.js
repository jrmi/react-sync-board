import { useEventListener } from "@react-hookz/web/esm/useEventListener";
import React from "react";

const useMousePosition = (ref) => {
  const mouseRef = React.useRef({ hover: false, x: 0, y: 0 });

  useEventListener(ref.current, "mousemove", (e) => {
    const { clientX, clientY } = e;
    mouseRef.current.x = clientX;
    mouseRef.current.y = clientY;
  });
  useEventListener(ref.current, "mouseenter", () => {
    mouseRef.current.hover = true;
  });
  useEventListener(ref.current, "mouseleave", () => {
    mouseRef.current.hover = false;
  });

  const getMouseInfo = React.useCallback(() => mouseRef.current, []);

  return getMouseInfo;
};

export default useMousePosition;
