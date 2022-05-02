import React, { memo } from "react";

import styled from "@emotion/styled";
import ResizeHandler from "./ResizeHandler";
import lockIcon from "../../images/lock.svg";

const ItemWrapper = styled.div`
  display: inline-block;
  transition: transform 150ms;
  user-select: none;
  padding: 2px;
  box-sizing: border-box;
  transform: rotate(${({ rotation }) => rotation}deg);

  & .corner {
    position: absolute;
    width: 0px;
    height: 0px;
  }

  & .top-left {
    top: 0;
    left: 0;
  }
  & .top-right {
    top: 0;
    right: 0;
  }
  & .bottom-left {
    bottom: 0;
    left: 0;
  }
  & .bottom-right {
    bottom: 0;
    right: 0;
  }

  &.selected {
    border: 2px dashed #db5034;
    padding: 0px;
    cursor: pointer;
  }

  &.locked::after {
    content: "";
    position: absolute;
    width: 24px;
    height: 30px;
    top: 4px;
    right: 4px;
    opacity: 0.1;
    background-image: url("${lockIcon}");
    background-size: cover;
    user-select: none;
  }

  &.locked:hover::after {
    opacity: 0.3;
  }

  & .resize {
    position: absolute;

    width: 10px;
    height: 10px;
    border: 2px solid #db5034;
    background-color: #db5034;
    cursor: move;

    &.resize-width {
      cursor: ew-resize;
      right: -6px;
      top: calc(50% - 5px);
    }
    &.resize-height {
      cursor: ns-resize;
      bottom: -6px;
      left: calc(50% - 5px);
    }
    &.resize-ratio {
      cursor: nwse-resize;
      bottom: -6px;
      right: -6px;
    }
  }
`;

const identity = (x) => x;

const DefaultErrorComponent = ({ onReload }) => (
  <div
    style={{
      width: "100px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      textAlign: "center",
      color: "red",
    }}
    className="syncboard-error-item"
  >
    Sorry, this item seems broken.
    <button onClick={onReload}>Reload it</button>
  </div>
);

/* Error boundary for broken item */
class ItemErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, itemId: props.itemId };
    this.onReload = this.onReload.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.error(
      `Error for item ${this.state.itemId}`,
      error,
      this.props.state
    );
  }

  onReload() {
    this.setState({ hasError: false });
  }

  render() {
    const { ErrorComponent } = this.props;
    if (this.state.hasError) {
      return <ErrorComponent onReload={this.onReload} />;
    }
    return this.props.children;
  }
}

const removeClass = (e) => {
  e.target.className = "";
};

const defaultResize = ({
  width,
  height,
  actualWidth,
  actualHeight,
  prevState,
  keepRatio,
}) => {
  let { width: currentWidth, height: currentHeight } = prevState;

  // Parse text values if any
  [currentWidth, currentHeight] = [
    parseFloat(currentWidth),
    parseFloat(currentHeight),
  ];
  if (!currentWidth || Number.isNaN(Number(currentWidth))) {
    currentWidth = actualWidth;
  }
  if (!currentHeight || Number.isNaN(Number(currentHeight))) {
    currentHeight = actualHeight;
  }

  if (keepRatio) {
    const ratio = currentWidth / currentHeight;
    return {
      ...prevState,
      width: (currentWidth + width).toFixed(1),
      height: (currentHeight + height / ratio).toFixed(1),
    };
  }

  return {
    ...prevState,
    width: (currentWidth + width).toFixed(1),
    height: (currentHeight + height).toFixed(1),
  };
};

const defaultResizeDirection = {
  w: true,
  h: true,
  b: true,
};

const Item = ({
  setState,
  state: { type, rotation = 0, id, locked, layer, ...rest } = {},
  animate = "hvr-pop",
  isSelected,
  itemMap,
  showResizeHandle = false,
}) => {
  const itemWrapperRef = React.useRef(null);

  const {
    component: Component = () => null,
    resizeDirections = defaultResizeDirection,
    resize = defaultResize,
  } = itemMap[type];

  const updateState = React.useCallback(
    (callbackOrItem, sync = true) => setState(id, callbackOrItem, sync),
    [setState, id]
  );

  React.useEffect(() => {
    itemWrapperRef.current.className = animate;
  }, [animate]);

  let className = `item ${id}`;
  if (locked) {
    className += " locked";
  }
  if (isSelected) {
    className += " selected";
  }

  const onResize = React.useCallback(
    ({ width = 0, height = 0, keepRatio }) => {
      updateState((prev) => {
        const { offsetWidth, offsetHeight } = itemWrapperRef.current;
        return resize({
          prevState: prev,
          width,
          height,
          actualHeight: offsetHeight,
          actualWidth: offsetWidth,
          keepRatio,
        });
      });
    },
    [resize, updateState]
  );

  const onResizeWidth = React.useCallback(
    ({ width }) => {
      onResize({ width });
    },
    [onResize]
  );

  const onResizeHeight = React.useCallback(
    ({ height }) => {
      onResize({ height });
    },
    [onResize]
  );

  const onResizeRatio = React.useCallback(
    ({ width }) => {
      onResize({ height: width, width, keepRatio: true });
    },
    [onResize]
  );

  return (
    <ItemWrapper
      rotation={rotation}
      locked={locked}
      selected={isSelected}
      layer={layer}
      data-id={id}
      className={className}
    >
      <div
        style={{ display: "flex" }}
        ref={itemWrapperRef}
        onAnimationEnd={removeClass}
        onKeyDown={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
      >
        <ItemErrorBoundary
          itemId={id}
          state={rest}
          setState={updateState}
          ErrorComponent={itemMap?.error?.component || DefaultErrorComponent}
        >
          <Component {...rest} id={id} setState={updateState} />
        </ItemErrorBoundary>
        <div className="corner top-left" />
        <div className="corner top-right" />
        <div className="corner bottom-right" />
        <div className="corner bottom-left" />
        {isSelected && showResizeHandle && (
          <>
            {resizeDirections.b && (
              <ResizeHandler
                className="resize resize-ratio"
                onResize={onResizeRatio}
              />
            )}

            {resizeDirections.h && (
              <ResizeHandler
                className="resize resize-height"
                onResize={onResizeHeight}
              />
            )}

            {resizeDirections.w && (
              <ResizeHandler
                className="resize resize-width"
                onResize={onResizeWidth}
              />
            )}
          </>
        )}
      </div>
    </ItemWrapper>
  );
};

const MemoizedItem = memo(
  Item,
  (
    {
      state: prevState,
      setState: prevSetState,
      isSelected: prevIsSelected,
      showResizeHandle: prevShowResizeHandle,
    },
    {
      state: nextState,
      setState: nextSetState,
      isSelected: nextIsSelected,
      showResizeHandle: nextShowResizeHandle,
    }
  ) =>
    prevIsSelected === nextIsSelected &&
    prevShowResizeHandle === nextShowResizeHandle &&
    prevSetState === nextSetState &&
    JSON.stringify(prevState) === JSON.stringify(nextState)
);

// Exclude positioning from memoization
const PositionedItem = ({ state = {}, boardSize, currentUser, ...rest }) => {
  if (!rest.itemMap[state.type]) {
    return null;
  }

  const { stateHook = identity } = rest.itemMap[state.type];

  const {
    x = 0,
    y = 0,
    layer = 0,
    moving,
    ...stateRest
  } = stateHook(state, { currentUser });

  return (
    <div
      style={{
        position: "absolute",
        top: `${boardSize / 2}px`,
        left: `${boardSize / 2}px`,
        display: "inline-block",
        transform: `translate(${x}px, ${y}px)`,
        zIndex: (layer + 4) * 10 + 100 + (moving ? 5 : 0), // Items z-index between 100 and 200
      }}
    >
      <MemoizedItem
        {...rest}
        // Helps to prevent render
        showResizeHandle={rest.isSelected && rest.showResizeHandle}
        state={stateRest}
      />
    </div>
  );
};

const MemoizedPositionedItem = memo(PositionedItem);

export default MemoizedPositionedItem;
