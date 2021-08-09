import React from "react";
import { useSetRecoilState, useRecoilValue } from "recoil";

import { ItemList, SubscribeItemEvents } from "./Items";
import Selector from "./Selector";
import ActionPane from "./ActionPane";
import CursorPane from "./Cursors/CursorPane";
import PanZoomRotate from "./PanZoomRotate";
import { BoardConfigAtom, ConfigurationAtom } from "./atoms";
import Selection from "./Selection";
import { useUsers } from "../users";

export const Board = ({ moveFirst = true, style, itemTemplates = {} }) => {
  const setSettings = useSetRecoilState(ConfigurationAtom);
  const config = useRecoilValue(BoardConfigAtom);
  const { currentUser, users } = useUsers();

  const boardStyle = React.useMemo(
    () => ({
      userSelect: "none",
      width: `${config.size}px`,
      height: `${config.size}px`,
      backgroundColor: "#333",
      ...style,
    }),
    [config.size, style]
  );

  React.useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      itemTemplates,
    }));
  }, [itemTemplates, setSettings]);

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
              <div style={boardStyle} className="board">
                <ItemList itemTemplates={itemTemplates} />
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
