import React from "react";
import { Provider as SocketIOProvider, useSocket } from "@jrmi/use-socket.io";
import { nanoid } from "nanoid";

import "./index.css";

import {
  BoardWrapper,
  RoomWrapper,
  useUsers,
  useItemActions,
  Board,
  BoardGridOverlay,
} from "@/";
import { Form } from "react-final-form";

import { itemMap, ItemForm } from "./sample";

import SelectedItemsPane from "./SelectedItemsPane";

import Spinner from "./ui/Spinner";
import useDim from "@/board/useDim";
import useMainStore from "@/board/store/main";
import useBoardConfig from "@/board/useBoardConfig";
import AutoSave from "./ui/formUtils/AutoSave";
import GridFields from "./sample/GridFields";

const STORYBOOK_SOCKET_URL = "https://wireio1.filai.re";
const SOCKET_PATH = "/socket.io";

const SOCKET_OPTIONS = {
  forceNew: true,
  path: SOCKET_PATH,
  transports: ["websocket"],
};

const WithSocketIO = ({ children }) => (
  <SocketIOProvider url={STORYBOOK_SOCKET_URL} options={SOCKET_OPTIONS}>
    {children}
  </SocketIOProvider>
);

export default {
  component: BoardWrapper,
  title: "SyncBoard/Main",
};

const defaultInitialItems = [
  {
    type: "zone",
    x: -380,
    y: -250,
    id: "play-area",
    color: "#6366f1",
    width: 760,
    height: 520,
    text: "PLAY AREA",
    textColor: "#312e81",
    fontSize: 20,
    layer: -2,
  },
  {
    type: "screen",
    x: -310,
    y: -170,
    id: "shared-screen",
    color: "#f59e0b",
    width: 220,
    height: 140,
    text: "Shared screen",
  },
  {
    type: "rect",
    x: 110,
    y: -160,
    id: "linked-group",
    color: "#14b8a633",
    width: 190,
    height: 250,
    text: "Move the group",
    textColor: "#115e59",
    fontSize: 16,
    linkedItems: ["group-cube", "group-token", "group-cylinder"],
    layer: -1,
  },
  {
    type: "cube",
    x: 145,
    y: -115,
    id: "group-cube",
    color: "#4f46e5",
    size: 68,
    actions: ["rotate45", { name: "rotate", args: { angle: 10 } }, "remove"],
  },
  {
    type: "token",
    x: 225,
    y: -60,
    id: "group-token",
    color: "#f43f5e",
    size: 64,
    text: "2",
    textColor: "#fff",
  },
  {
    type: "cylinder",
    x: 150,
    y: 15,
    id: "group-cylinder",
    color: "#0ea5e9",
    size: 64,
  },
  {
    type: "round",
    x: -50,
    y: 70,
    id: "hex-grid-token",
    color: "#8b5cf6",
    size: 92,
    text: "Hex",
    textColor: "#fff",
    fontSize: 15,
    grid: {
      type: "hexH",
      size: 38,
      offset: { x: 8, y: 8 },
      color: "#7c3aed",
      opacity: 0.75,
    },
  },
  {
    type: "round",
    x: -130,
    y: 150,
    id: "square-grid-token",
    color: "#10b981",
    size: 78,
    text: "Grid",
    textColor: "#fff",
    fontSize: 14,
    grid: { type: "grid", size: 24, color: "#047857", opacity: 0.75 },
  },
  {
    type: "cube",
    x: 310,
    y: 140,
    id: "free-cube",
    color: "#ec4899",
    size: 82,
    rotation: -18,
    actions: [{ name: "rotate", args: { angle: 20 } }, "rotate45", "remove"],
  },
];

const AddItems = () => {
  const { pushItem } = useItemActions();
  const itemTypes = Object.keys(itemMap).filter((key) => key !== "error");
  const [selectedType, setSelectedType] = React.useState(itemTypes[0]);

  const addItem = () => {
    const itemTemplate = itemMap[selectedType];
    pushItem({ type: selectedType, ...itemTemplate.template, id: nanoid() });
  };

  return (
    <section className="control-section">
      <h2>Add an item</h2>
      <select
        value={selectedType}
        onChange={(event) => setSelectedType(event.target.value)}
      >
        {itemTypes.map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
      <button className="primary-action" onClick={addItem}>
        Add to board
      </button>
    </section>
  );
};

const BoardGridForm = () => {
  const [boardConfig, setBoardConfig] = useBoardConfig();

  const save = React.useCallback(
    (values) =>
      setBoardConfig((current) => ({
        ...current,
        grid: values.grid,
      })),
    [setBoardConfig]
  );

  return (
    <section className="control-section compact-fields">
      <h2>Grid</h2>
      <Form
        initialValues={{
          grid: boardConfig.grid || { type: "none", size: 50 },
        }}
        onSubmit={save}
        render={() => (
          <>
            <AutoSave save={save} />
            <GridFields
              initialValues={{
                grid: boardConfig.grid || { type: "none", size: 50 },
              }}
              title={false}
            />
          </>
        )}
      />
    </section>
  );
};

const UserList = () => {
  const { currentUser, updateCurrentUser, localUsers } = useUsers();

  React.useEffect(() => {
    fetch("https://randomuser.me/api/")
      .then((result) => {
        return result.json();
      })
      .then(({ results }) => {
        const {
          name: { first, last },
        } = results[0];
        updateCurrentUser({ name: `${first} ${last}` });
      });
  }, [updateCurrentUser]);

  return (
    <section className="control-section users-list">
      <h2>Connected users</h2>
      <ul aria-live="polite">
        {localUsers.map((user) => (
          <li key={user.id}>
            {currentUser.id === user.id ? "You: " : ""}
            {user.name}
          </li>
        ))}
      </ul>
    </section>
  );
};

const Overlay = ({ children, hideMenu, interaction, setInteraction }) => {
  const { rotateBoard: rotate, zoomToExtent } = useDim();
  const itemExtent = useMainStore((state) => state.config.itemExtent);
  const [controlsOpen, setControlsOpen] = React.useState(true);
  const controlsId = React.useId();
  return (
    <div className="demo-board-shell">
      {children}
      <aside
        className={`demo-controls ${controlsOpen ? "is-open" : "is-closed"}`}
        aria-label="Board controls"
      >
        <div className="controls-heading">
          <div>
            <p className="eyebrow">Live controls</p>
            <p>Configure the board and add content.</p>
          </div>
          <button
            className="controls-toggle"
            type="button"
            aria-expanded={controlsOpen}
            aria-controls={controlsId}
            onClick={() => setControlsOpen((open) => !open)}
          >
            {controlsOpen ? "Hide controls" : "Show controls"}
            <span aria-hidden="true">{controlsOpen ? "↓" : "↑"}</span>
          </button>
        </div>
        <div id={controlsId} className="controls-content">
          <AddItems />
          <BoardGridForm />
          <section className="control-section">
            <h2>Viewport</h2>
            <button onClick={() => zoomToExtent(itemExtent)}>
              Center on items
            </button>
          </section>
          <section className="control-section interaction-controls">
            <h2>Interaction</h2>
          <label>
            Navigation mode
            <select
              value={interaction.navigationMode}
              onChange={(event) =>
                setInteraction((previous) => ({
                  ...previous,
                  navigationMode: event.target.value,
                }))
              }
            >
              <option value="auto">Auto</option>
              <option value="wheel">Wheel</option>
              <option value="trackpad">Trackpad</option>
            </select>
          </label>
          <label>
            Primary action
            <select
              value={interaction.primaryAction ?? "auto"}
              onChange={(event) =>
                setInteraction((previous) => {
                  if (event.target.value === "auto") {
                    const nextInteraction = { ...previous };
                    delete nextInteraction.primaryAction;
                    return nextInteraction;
                  }
                  return { ...previous, primaryAction: event.target.value };
                })
              }
            >
              <option value="auto">Auto</option>
              <option value="pan">Pan</option>
              <option value="select">Select</option>
            </select>
          </label>
          <label>
            Zoom multiplier
            <input
              type="number"
              min="0.1"
              step="0.1"
              placeholder="Mode default"
              value={interaction.zoomMultiplier ?? ""}
              onChange={(event) =>
                setInteraction((previous) => {
                  if (event.target.value === "") {
                    const nextInteraction = { ...previous };
                    delete nextInteraction.zoomMultiplier;
                    return nextInteraction;
                  }

                  return {
                    ...previous,
                    zoomMultiplier: Number(event.target.value),
                  };
                })
              }
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={interaction.inertia ?? true}
              onChange={(event) =>
                setInteraction((previous) => ({
                  ...previous,
                  inertia: event.target.checked,
                }))
              }
            />{" "}
            Enable inertia
          </label>
          <label>
            Inertia amount
            <input
              type="number"
              min="0.1"
              step="0.1"
              disabled={interaction.inertia === false}
              value={interaction.inertiaAmount ?? 1}
              onChange={(event) =>
                setInteraction((previous) => ({
                  ...previous,
                  inertiaAmount: Number(event.target.value),
                }))
              }
            />
          </label>
          </section>
          <section className="control-section board-actions">
            <h2>Orientation</h2>
            <button onClick={() => rotate((prev) => prev + 12.5)}>
              Rotate clockwise ↻
            </button>
            <button onClick={() => rotate((prev) => prev - 12.5)}>
              Rotate counter-clockwise ↺
            </button>
          </section>
          <UserList />
        </div>
      </aside>
      <SelectedItemsPane hideMenu={hideMenu} ItemFormComponent={ItemForm} />
      <div id={`portal-container-uid`} />
    </div>
  );
};

const OneViewContent = ({
  interaction,
  setInteraction,
  showResizeHandle,
  hideMenu,
  room,
  session,
  children,
  initialItems = null,
}) => {
  const socket = useSocket();
  return (
    <BoardWrapper
      room={room}
      session={session}
      socket={socket}
      items={initialItems || defaultInitialItems}
      LoadingComponent={() => <Spinner />}
    >
      <Overlay
        hideMenu={hideMenu}
        interaction={interaction}
        setInteraction={setInteraction}
      >
        <Board
          interaction={interaction}
          showResizeHandle={showResizeHandle}
          style={playgroundStyle}
          itemTemplates={itemMap}
        >
          {children}
          <BoardGridOverlay />
        </Board>
      </Overlay>
    </BoardWrapper>
  );
};

export const OneView = (props) => (
  <WithSocketIO>
    <div className="demo-view">
      <OneViewContent {...props} />
    </div>
  </WithSocketIO>
);

export const OneViewPerf = (props) => {
  const initialItems = [...Array(2000)].map((e, index) => ({
    type: "rect",
    x: 10 + index,
    y: 10 + index,
    width: 100,
    height: 100,
    id: nanoid(),
  }));

  return <OneView {...props} initialItems={initialItems} />;
};

const playgroundStyle = {
  backgroundColor: "#e9f4f2",
  backgroundImage: 'url("/board-texture.svg")',
  backgroundSize: "240px 240px",
  backgroundPosition: "0 0",
};
const OneViewWithRoomContent = ({
  interaction,
  setInteraction,
  showResizeHandle,
  hideMenu,
  room,
  session,
  initialItems = null,
}) => {
  const socket = useSocket();
  return (
    <RoomWrapper
      room={room}
      socket={socket}
      LoadingComponent={() => <Spinner />}
    >
      <BoardWrapper
        session={session}
        socket={socket}
        LoadingComponent={() => <Spinner />}
        items={initialItems || defaultInitialItems}
      >
        <Overlay
          hideMenu={hideMenu}
          interaction={interaction}
          setInteraction={setInteraction}
        >
          <Board
            interaction={interaction}
            itemTemplates={itemMap}
            style={playgroundStyle}
            showResizeHandle={showResizeHandle}
          >
            <BoardGridOverlay />
          </Board>
        </Overlay>
      </BoardWrapper>
    </RoomWrapper>
  );
};

export const OneViewWithRoom = (props) => (
  <WithSocketIO>
    <div className="demo-view">
      <OneViewWithRoomContent {...props} />
    </div>
  </WithSocketIO>
);

export const TwoView = (props) => {
  return (
    <div className="demo-two-views">
      <WithSocketIO>
        <div className="demo-view">
          <OneViewContent {...props} />
        </div>
      </WithSocketIO>
      <WithSocketIO>
        <div className="demo-view">
          <OneViewContent {...props} />
        </div>
      </WithSocketIO>
    </div>
  );
};

export const OneViewWithCustomBoardElements = (props) => (
  <WithSocketIO>
    <div className="demo-view">
      <OneViewContent {...props}>
        <div
          style={{
            position: "absolute",
            top: "25000px",
            left: "25000px",
            width: "1000px",
            height: "1000px",
            backgroundColor: "#DEF",
            zIndex: 300,
          }}
        ></div>
      </OneViewContent>
    </div>
  </WithSocketIO>
);
