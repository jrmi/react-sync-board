import React, { memo } from "react";

import styled from "@emotion/styled";
import lockIcon from "../../images/lock.svg";

const ItemWrapper = styled.div`
  display: inline-block;
  transition: transform 150ms;
  user-select: none;
  padding: 4px;
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
    padding: 2px;
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
`;

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

const Item = ({
  setState,
  state: { type, rotation = 0, id, locked, layer, ...rest } = {},
  animate = "hvr-pop",
  isSelected,
  itemMap,
  unlocked,
}) => {
  const animateRef = React.useRef(null);

  const Component = itemMap[type].component || (() => null);

  const updateState = React.useCallback(
    (callbackOrItem, sync = true) => setState(id, callbackOrItem, sync),
    [setState, id]
  );

  React.useEffect(() => {
    animateRef.current.className = animate;
  }, [animate]);

  let className = `item ${id}`;
  if (locked) {
    className += " locked";
  }
  if (isSelected) {
    className += " selected";
  }

  return (
    <ItemWrapper
      rotation={rotation}
      locked={locked && !unlocked}
      selected={isSelected}
      layer={layer}
      data-id={id}
      className={className}
    >
      <div
        style={{ display: "flex" }}
        ref={animateRef}
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
        <div className="corner bottom-left" />
        <div className="corner bottom-right" />
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
      unlocked: prevUnlocked,
    },
    {
      state: nextState,
      setState: nextSetState,
      isSelected: nextIsSelected,
      unlocked: nextUnlocked,
    }
  ) =>
    prevIsSelected === nextIsSelected &&
    prevUnlocked === nextUnlocked &&
    prevSetState === nextSetState &&
    JSON.stringify(prevState) === JSON.stringify(nextState)
);

// Exclude positioning from memoization
const PositionedItem = ({ state = {}, boardSize, currentUser, ...rest }) => {
  const stateTrans = rest.itemMap[state.type]?.stateHook || ((st) => st);

  const {
    x = 0,
    y = 0,
    layer = 0,
    moving,
    ...stateRest
  } = stateTrans(state, { currentUser });

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
      <MemoizedItem {...rest} state={stateRest} />
    </div>
  );
};

const MemoizedPositionedItem = memo(PositionedItem);

export default MemoizedPositionedItem;
