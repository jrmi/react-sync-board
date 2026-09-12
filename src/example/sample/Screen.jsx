import React, { memo, useCallback } from "react";
import styled, { css } from "styled-components";
import { useUsers } from "@/users";

const StyledShape = styled.div`
  ${({ width, height, color, $revealed }) => css`
    width: ${width}px;
    height: ${height}px;
    box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px,
      rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
    border: 5px dashed ${color};
    background-color: ${$revealed ? "transparent" : color};
    position: relative;

    display: flex;
    justify-content: center;
    align-items: center;

    & span {
      z-index: 0;
    }

    & .screen__claim-button {
      position: absolute;
      top: 4px;
      right: 4px;
      z-index: 1;
    }

  `}
`;

const Screen = ({
  width = 300,
  height = 200,
  color = "#ccc",
  claimedBy,
  setState,
}) => {
  const { currentUser } = useUsers();
  const revealed = claimedBy === currentUser?.uid;

  const onClaim = useCallback(() => {
    setState((prev) => {
      if (prev.claimedBy === currentUser.uid) {
        return { ...prev, claimedBy: undefined };
      }

      return { ...prev, claimedBy: currentUser.uid };
    });
  }, [currentUser.uid, setState]);

  const claimed = !!claimedBy;
  let buttonLabel = "Claim";

  if (claimed) {
    if (claimedBy === currentUser.uid) {
      buttonLabel = "Release";
    } else {
      buttonLabel = "Steal";
    }
  }
  return (
    <StyledShape
      width={width}
      height={height}
      color={color}
      $revealed={revealed}
    >
      <button onClick={onClaim} className="screen__claim-button">
        {buttonLabel}
      </button>
    </StyledShape>
  );
};

export default memo(Screen);
