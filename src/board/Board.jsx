import React from "react";
import styled from "styled-components";
import { useRecoilValue } from "recoil";

import { ItemList, SubscribeItemEvents } from "./Items";
import Selector from "./Selector";
import ActionPane from "./ActionPane";
import CursorPane from "./Cursors/CursorPane";
import PanZoomRotate from "./PanZoomRotate";
import { BoardConfigAtom } from "./atoms";
import board from "../images/board.png";
import Selection from "./Selection";
import { useUsers } from "../users";

/*

  #2C3749 - #13131B
  background: radial-gradient(circle, #2c3749, #13131b 100%), url(/board.png);
  background-blend-mode: multiply;
  box-shadow: rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px,
    rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset;
  
*/

const StyledBoard = styled.div.attrs(() => ({ className: "board" }))`
  position: relative;
  background: radial-gradient(
      circle,
      hsla(218, 30%, 40%, 0.7),
      hsla(218, 40%, 40%, 0.05) 100%
    ),
    url(${board});

  border: 1px solid transparent;

  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;

  border-radius: 2px;

  box-shadow: 0px 3px 6px #00000029;
  user-select: none;
`;

export const Board = ({ moveFirst = true }) => {
  const config = useRecoilValue(BoardConfigAtom);
  const { currentUser, users } = useUsers();

  if (!config.size) {
    console.log("No board size. Please configure the board");
    return null;
  }

  return (
    <>
      <SubscribeItemEvents />
      <PanZoomRotate moveFirst={moveFirst}>
        <Selector moveFirst={moveFirst}>
          <ActionPane>
            <CursorPane user={currentUser} users={users}>
              <StyledBoard size={config.size}>
                <ItemList />
              </StyledBoard>
            </CursorPane>
          </ActionPane>
        </Selector>
      </PanZoomRotate>
      <Selection />
    </>
  );
};

export default Board;
