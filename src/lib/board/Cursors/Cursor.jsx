import React from "react";
import { css } from "goober";

import { readableColorIsBlack } from "color2k";

const cursorClass = css({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  zIndex: 210,
  pointerEvents: "none",
});

const cursorLabelClass = css({
  fontWeight: "bold",
  padding: "0 0.5em",
  borderRadius: "2px",
  maxWidth: "5em",
  overflow: "hidden",
  textOverflow: "ellipsis",
  marginLeft: "-0.5em",
  marginTop: "1.7em",
  whitespace: "nowrap",
  pointerEvents: "none",
});

const Cursor = ({ color = "#666", size = 40, text }) => {
  const textColor = readableColorIsBlack(color) ? "#222" : "#EEE";
  return (
    <div className={cursorClass}>
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="1064.7701 445.5539 419.8101 717.0565"
        width={size}
        height={size}
      >
        <path
          d="m 1197.1015,869.718 -62.2719,-154.49286 133.3276,-9.05842 -257.6915,-253.12748 1.2392,356.98609 88.2465,-79.47087 61.702,152.78366 z"
          style={{
            fill: textColor,
          }}
        />
        <path
          d="m 1193.0939,861.12419 -62.2719,-154.49286 133.3276,-9.05842 -257.6915,-253.12748 1.2392,356.98609 88.2465,-79.47087 61.702,152.78366 z"
          style={{
            fill: "white",
            stroke: "#111",
            strokeWidth: 20,
          }}
        />
      </svg>
      <div
        style={{
          color: textColor,
          backgroundColor: color,
        }}
        className={cursorLabelClass}
      >
        {text}
      </div>
    </div>
  );
};

const MemoizedCursor = React.memo(Cursor);

const defaultPositionedCursorClass = css({
  top: 0,
  left: 0,
  zIndex: 210,
  position: "fixed",
  pointerEvents: "none",
});

const PositionedCursor = ({ pos, ...rest }) => (
  <div
    className={defaultPositionedCursorClass}
    style={{ transform: `translate(${pos.x - 5}px, ${pos.y - 3}px)` }}
  >
    <MemoizedCursor {...rest} />
  </div>
);

export default PositionedCursor;
