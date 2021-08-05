import React from "react";
import { useRecoilValue } from "recoil";

import { ItemList, SubscribeItemEvents } from "./Items";
import Selector from "./Selector";
import ActionPane from "./ActionPane";
import CursorPane from "./Cursors/CursorPane";
import PanZoomRotate from "./PanZoomRotate";
import { BoardConfigAtom } from "./atoms";
import Selection from "./Selection";
import { useUsers } from "../users";

export const Board = ({ moveFirst = true, style }) => {
  const config = useRecoilValue(BoardConfigAtom);
  const { currentUser, users } = useUsers();

  if (!config.size) {
    return null;
  }

  return (
    <>
      <SubscribeItemEvents />
      <PanZoomRotate moveFirst={moveFirst}>
        <Selector moveFirst={moveFirst}>
          <ActionPane>
            <CursorPane user={currentUser} users={users}>
              <div
                style={{
                  userSelect: "none",
                  width: config.size,
                  height: config.size,
                  backgroundColor: "#333",
                  ...style,
                }}
              >
                <ItemList />
              </div>
            </CursorPane>
          </ActionPane>
        </Selector>
      </PanZoomRotate>
      <Selection />
    </>
  );
};

export default Board;
