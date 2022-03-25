import React, { memo } from "react";
import styled, { css } from "styled-components";

const StyledShape = styled.div`
  ${({ width, height, color }) => css`
    width: ${width}px;
    height: ${height}px;*
    box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px,
      rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
    border: 5px dashed ${color};
    position: relative

    display: flex;
    justify-content: center;
    align-items: center;
    & span {
      z-index: 0;
    }

    .passthrough {
      position: absolute;
      inset:10px;
      background-color: #CCCCCC33;
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
            textColor,
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
