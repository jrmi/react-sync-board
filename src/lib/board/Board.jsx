import React from "react";
import { useSetRecoilState } from "recoil";

import { ItemList } from "./Items";
import Selector from "./Selector";
import ActionPane from "./ActionPane";
import CursorPane from "./Cursors/CursorPane";
import PanZoom from "./PanZoom";
import { ConfigurationAtom } from "./atoms";
import Selection from "./Selection";
import { DEFAULT_BOARD_MAX_SIZE } from "@/settings";
import useDim from "./useDim";

const Board = ({
  moveFirst = true,
  style,
  itemTemplates = {},
  boardSize = DEFAULT_BOARD_MAX_SIZE,
  children,
  showResizeHandle = false,
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
      showResizeHandle,
    }));
  }, [itemTemplates, setConfiguration, boardSize, showResizeHandle]);

  React.useEffect(() => {
    updateItemExtent();
    setTimeout(updateItemExtent, 2000);
  }, [updateItemExtent]);

  return (
    <>
      <PanZoom moveFirst={moveFirst}>
        <Selector moveFirst={moveFirst}>
          <ActionPane moveFirst={moveFirst}>
            <CursorPane>
              <div
                onContextMenu={(e) => {
                  e.preventDefault();
                }}
                style={boardStyle}
                className="board"
              >
                <ItemList />
                {children}
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
