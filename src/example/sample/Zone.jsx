import React, { memo } from "react";
import styled, { css } from "styled-components";

const StyledShape = styled.div`
  ${({ width, height, color, textColor }) => css`
    width: ${width}px;
    height: ${height}px;
    border: 3px dashed ${color};
    border-radius: 18px;
    position: relative;

    display: flex;
    justify-content: center;
    align-items: center;
    & span {
      z-index: 0;
    }

    .passthrough {
      position: absolute;
      inset: 9px;
      display: flex;
      align-items: flex-end;
      justify-content: flex-start;
      padding: 14px;
      color: ${textColor};
      font-weight: 700;
      letter-spacing: .08em;
      border-radius: 11px;
      background-color: color-mix(in srgb, ${color} 12%, transparent);
      pointer-events: none;
    }
  `}
`;

const Zone = ({
  width = 50,
  height = 50,
  color = "#ccc",
  text = "",
  textColor = "#000",
  fontSize = "16",
}) => (
  <StyledShape width={width} height={height} color={color}>
    <div className="passthrough">
      {text && (
        <span
          style={{
            color: textColor,
            fontSize: `${fontSize}px`,
          }}
        >
          {text}
        </span>
      )}
    </div>
  </StyledShape>
);

export default memo(Zone);
