import React, { memo } from "react";
import styled, { css } from "styled-components";

const StyledShape = styled.div`
  ${({ width, height, color, textColor }) => css`
    width: ${width}px;
    height: ${height}px;
    border: 1px solid rgb(255 255 255 / 60%);
    border-radius: 12px;
    box-shadow: 0 8px 20px rgb(15 23 42 / 14%);
    background-color: ${color};

    display: flex;
    justify-content: center;
    align-items: center;
    & span {
      z-index: 0;
      color: ${textColor};
      font-weight: 700;
      text-align: center;
      padding: 12px;
    }
  `}
`;

const Rect = ({
  width = 50,
  height = 50,
  color = "#ccc",
  text = "",
  textColor = "#000",
  fontSize = "16",
}) => (
  <StyledShape width={width} height={height} color={color}>
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
  </StyledShape>
);

export default memo(Rect);
