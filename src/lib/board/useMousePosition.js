import React from "react";

const useMousePosition = (ref) => {
  const mouseRef = React.useRef({ hover: false, x: 0, y: 0 });

  const onMouseMove = React.useCallback((e) => {
    const { clientX, clientY } = e;
    mouseRef.current.x = clientX;
    mouseRef.current.y = clientY;
  }, []);

  const onMouseEnter = React.useCallback(() => {
    mouseRef.current.hover = true;
  }, []);

  const onMouseLeave = React.useCallback(() => {
    mouseRef.current.hover = false;
  }, []);

  React.useEffect(() => {
    const { current } = ref;
    if (current) {
      current.addEventListener("mousemove", onMouseMove);
      current.addEventListener("mouseenter", onMouseEnter);
      current.addEventListener("mouseleave", onMouseLeave);
      return () => {
        current.removeEventListener("mousemove", onMouseMove);
        current.removeEventListener("mouseenter", onMouseEnter);
        current.addEventListener("mouseleave", onMouseLeave);
      };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, ref.current, onMouseMove, onMouseEnter, onMouseLeave]);

  const getMouseInfo = React.useCallback(() => mouseRef.current, []);

  return getMouseInfo;
};

export default useMousePosition;
