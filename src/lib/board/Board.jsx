import React from "react";
import { nanoid } from "nanoid";

import { ItemList } from "./Items";
import Selector from "./Selector";
import ActionPane from "./ActionPane";
import PanZoom from "./PanZoom";
import Selection from "./Selection";
import { DEFAULT_BOARD_MAX_SIZE } from "@/settings";
import useDim from "./useDim";
import useMainStore from "./store/main";

import { insideClass } from "@/utils";
import { useResizeObserver } from "@react-hookz/web/esm/useResizeObserver";
import { css } from "goober";
import CursorPane from "./Cursors/CursorPane";

const NullWrapper = ({ children }) => children;

const defaultStyle = {
  overflow: "hidden",
  position: "absolute",
  inset: 0,
};

const Board = ({
  moveFirst = true,
  style,
  wrapperStyle,
  itemTemplates = {},
  boardSize = DEFAULT_BOARD_MAX_SIZE,
  children,
  showResizeHandle = false,
  Wrapper = NullWrapper,
}) => {
  const boardWrapperRef = React.useRef(null);
  const [uid, updateConfiguration] = useMainStore((state) => [
    state.config.uid,
    state.updateConfiguration,
  ]);
  const { updateItemExtent } = useDim();

  const boardStyle = {
    userSelect: "none",
    width: `${boardSize}px`,
    height: `${boardSize}px`,
    backgroundColor: "#333",
    ...style,
  };

  React.useEffect(() => {
    // Chrome-related issue.
    // Making the wheel event non-passive, which allows to use preventDefault() to prevent
    // the browser original zoom  and therefore allowing our custom one.
    // More detail at https://github.com/facebook/react/issues/14856
    const cancelWheel = (event) => {
      if (insideClass(event.target, "board")) event.preventDefault();
    };

    document.body.addEventListener("wheel", cancelWheel, { passive: false });

    return () => {
      document.body.removeEventListener("wheel", cancelWheel);
    };
  }, []);

  React.useEffect(() => {
    updateConfiguration({
      boardWrapper: boardWrapperRef.current,
    });
  }, [updateConfiguration]);

  React.useEffect(() => {
    if (!uid) {
      updateConfiguration({
        uid: nanoid(),
      });
    }
  }, [uid, updateConfiguration]);

  React.useEffect(() => {
    updateConfiguration({
      itemTemplates,
      boardSize,
      showResizeHandle,
    });
  }, [itemTemplates, boardSize, showResizeHandle, updateConfiguration]);

  React.useEffect(() => {
    updateConfiguration({
      boardWrapperRect: boardWrapperRef.current.getBoundingClientRect(),
    });
    updateItemExtent();
    // Hack to update item extent on load
    setTimeout(updateItemExtent, 2000);
  }, [updateConfiguration, updateItemExtent]);

  useResizeObserver(boardWrapperRef, () => {
    if (!boardWrapperRef.current) {
      return;
    }
    updateConfiguration({
      boardWrapperRect: boardWrapperRef.current.getBoundingClientRect(),
    });
  });

  const boardWrapperClass = css({ ...defaultStyle, ...wrapperStyle });

  return (
    <div
      ref={boardWrapperRef}
      id={uid}
      className={`sync-board ${boardWrapperClass}`}
    >
      <PanZoom moveFirst={moveFirst}>
        <Selector moveFirst={moveFirst}>
          <ActionPane moveFirst={moveFirst}>
            <CursorPane>
              <Wrapper>
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
              </Wrapper>
            </CursorPane>
          </ActionPane>
        </Selector>
      </PanZoom>
      <Selection />
    </div>
  );
};

export default Board;
