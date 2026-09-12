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

import { useResizeObserver } from "@react-hookz/web";
import { css } from "goober";
import CursorPane from "./Cursors/CursorPane";
import WorldBackground from "./WorldBackground";

const NullWrapper = ({ children }) => children;
const emptyTemplates = {};

const defaultStyle = {
  overflow: "hidden",
  position: "absolute",
  inset: 0,
};

const Board = ({
  moveFirst = true,
  style,
  wrapperStyle,
  itemTemplates = emptyTemplates,
  // Deprecated compatibility prop. The logical canvas is unbounded.
  boardSize = DEFAULT_BOARD_MAX_SIZE,
  backgroundTileSize,
  children,
  showResizeHandle = false,
  Wrapper = NullWrapper,
}) => {
  const boardWrapperRef = React.useRef(null);
  const [uid, updateConfiguration] = useMainStore((state) => [
    state.config.uid,
    state.updateConfiguration,
  ]);
  const [translateX, translateY, scale, rotate] = useMainStore(
    (state) => [
      state.boardState.translateX,
      state.boardState.translateY,
      state.boardState.scale,
      state.boardState.rotate,
    ]
  );
  const { updateItemExtent } = useDim();

  const boardStyle = {
    userSelect: "none",
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    transformOrigin: "0 0",
    transform: `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg) scale(${scale})`,
    pointerEvents: "none",
  };


  React.useEffect(() => {
    // Chrome-related issue.
    // Making the wheel event non-passive, which allows to use preventDefault() to prevent
    // the browser original zoom  and therefore allowing our custom one.
    // More detail at https://github.com/facebook/react/issues/14856
    const cancelWheel = (event) => {
      if (boardWrapperRef.current?.contains(event.target)) event.preventDefault();
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
      <WorldBackground style={style} tileSizeOverride={backgroundTileSize} />
      <CursorPane>
        <Selector moveFirst={moveFirst}>
          <PanZoom moveFirst={moveFirst}>
            <ActionPane moveFirst={moveFirst}>
              <Wrapper>
                <div
                  onContextMenu={(e) => {
                    e.preventDefault();
                  }}
                  style={boardStyle}
                  className={`board-pane${scale < 0.5 ? " board-pane__far" : ""}`}
                >
                  <ItemList />
                  <div style={{ pointerEvents: "auto" }}>{children}</div>
                </div>
              </Wrapper>
            </ActionPane>
          </PanZoom>
        </Selector>
      </CursorPane>
      <Selection />
    </div>
  );
};

export default Board;
