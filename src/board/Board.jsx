import React from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";

import { ItemList, SubscribeItemEvents } from "./Items";
import Selector from "./Selector";
import ActionPane from "./ActionPane";
import CursorPane from "./Cursors/CursorPane";
import PanZoom from "./PanZoom";
import { ConfigurationAtom } from "./atoms";
import Selection from "./Selection";
import { DEFAULT_BOARD_MAX_SIZE } from "../settings";
import useDim from "./useDim";

export const Board = ({
  moveFirst = true,
  style,
  itemTemplates = {},
  boardSize = DEFAULT_BOARD_MAX_SIZE,
}) => {
  const setConfiguration = useSetRecoilState(ConfigurationAtom);
  const { updateItemExtent } = useDim();

  const boardStyle = React.useMemo(
    () => ({
      userSelect: "none",
      width: `${boardSize}px`,
      height: `${boardSize}px`,
      backgroundColor: "#333",
      ...style,
    }),
    [boardSize, style]
  );

  React.useEffect(() => {
    setConfiguration((prev) => ({
      ...prev,
      itemTemplates,
      boardSize,
    }));
  }, [itemTemplates, setConfiguration, boardSize]);

  React.useEffect(() => {
    updateItemExtent();
    setTimeout(updateItemExtent, 2000);
  }, [updateItemExtent]);

  return (
    <>
      <SubscribeItemEvents />
      <PanZoom moveFirst={moveFirst}>
        <Selector moveFirst={moveFirst}>
          <ActionPane>
            <CursorPane>
              <div
                onContextMenu={(e) => {
                  e.preventDefault();
                }}
                style={boardStyle}
                className="board"
              >
                <ItemList itemTemplates={itemTemplates} />
              </div>
            </CursorPane>
          </ActionPane>
        </Selector>
      </PanZoom>
      <Selection />
    </>
  );
};

export default Board;
