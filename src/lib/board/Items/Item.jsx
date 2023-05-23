import React, { memo } from "react";

import ResizeHandler from "./ResizeHandler";
import { css } from "goober";
import deepEqual from "fast-deep-equal";

const itemClass = css`
  display: inline-block;
  transition: transform 150ms;
  user-select: none;
  padding: 2px;
  box-sizing: border-box;
`;

const selectedItemClass = css`
  border: 2px dashed #db5034;
  padding: 0px;
  cursor: pointer;
`;

const itemMark = css`
  position: absolute;
  width: 0px;
  height: 0px;
`;

const itemMarkTopLeft = css`
  top: 0;
  left: 0;
`;

const itemMarkTopRight = css`
  top: 0;
  right: 0;
`;

const itemMarkBottomLeft = css`
  bottom: 0;
  left: 0;
`;

const itemMarkBottomRight = css`
  bottom: 0;
  right: 0;
`;

const itemMarkCenter = css`
  top: 50%;
  left: 50%;
`;

const itemResize = css`
  position: absolute;

  width: 10px;
  height: 10px;
  border: 2px solid #db5034;
  background-color: #db5034;
  cursor: move;
`;

const itemResizeWidth = css`
  cursor: ew-resize;
  right: -6px;
  top: calc(50% - 5px);
`;

const itemResizeHeight = css`
  cursor: ns-resize;
  bottom: -6px;
  left: calc(50% - 5px);
`;

const itemResizeRatio = css`
  cursor: nwse-resize;
  bottom: -6px;
  right: -6px;
`;

const DefaultErrorComponent = ({ onReload }) => (
  <div
    className={`syncboard-error-item ${css({
      width: "100px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      textAlign: "center",
      color: "red",
    })}`}
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
  state: { type, rotation = 0, id, locked, extraClasses, ...rest } = {},
  animate = "hvr-pop",
  isSelected,
  itemMap,
  showResizeHandle = true,
}) => {
  const itemWrapperRef = React.useRef(null);

  const {
    component: Component = () => null,
    resizeDirections = defaultResizeDirection,
    resize = defaultResize,
  } = itemMap[type];

  const updateState = React.useCallback(
    (callbackOrItem) => setState(id, callbackOrItem),
    [setState, id]
  );

  React.useEffect(() => {
    itemWrapperRef.current.className = animate;
  }, [animate]);

  const classes = ["item", id, itemClass];
  if (locked) {
    classes.push("locked");
  }
  if (isSelected) {
    classes.push("selected");
    classes.push(selectedItemClass);
  }
  if (Array.isArray(extraClasses)) {
    classes.concat(extraClasses);
  }

  const className = classes.join(" ");

  const onResize = ({ width = 0, height = 0, keepRatio }) => {
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
  };

  const onResizeWidth = ({ width }) => {
    onResize({ width });
  };

  const onResizeHeight = ({ height }) => {
    onResize({ height });
  };

  const onResizeRatio = ({ width }) => {
    onResize({ height: width, width, keepRatio: true });
  };

  return (
    <div
      style={{ transform: `rotate(${rotation}deg` }}
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
          ErrorComponent={itemMap?.error?.component || DefaultErrorComponent}
        >
          <Component {...rest} id={id} setState={updateState} />
        </ItemErrorBoundary>
        <div className={`corner ${itemMark} ${itemMarkTopLeft}`} />
        <div className={`corner ${itemMark} ${itemMarkTopRight}`} />
        <div className={`corner ${itemMark} ${itemMarkBottomRight}`} />
        <div className={`corner ${itemMark} ${itemMarkBottomLeft}`} />
        <div className={`center ${itemMark} ${itemMarkCenter}`} />
        {showResizeHandle && (
          <>
            {resizeDirections.b && (
              <ResizeHandler
                className={`${itemResize} ${itemResizeRatio}`}
                onResize={onResizeRatio}
              />
            )}

            {resizeDirections.h && (
              <ResizeHandler
                className={`${itemResize} ${itemResizeHeight}`}
                onResize={onResizeHeight}
              />
            )}

            {resizeDirections.w && (
              <ResizeHandler
                className={`${itemResize} ${itemResizeWidth}`}
                onResize={onResizeWidth}
              />
            )}
          </>
        )}
      </div>
    </div>
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
    deepEqual(prevState, nextState)
);

const identity = (x) => x;

// Exclude positioning from memoization
const PositionedItem = ({ state = {}, getCurrentUser, className, ...rest }) => {
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
  } = stateHook(state, { getCurrentUser });

  const zIndex = (layer + 4) * 10 + 100 + (moving ? 5 : 0); // Items z-index between 100 and 200

  return (
    <div
      className={className}
      style={{
        transform: `translate(${x}px, ${y}px)`,
        zIndex,
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
