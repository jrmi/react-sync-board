/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import {
  Provider as SocketIOProvider,
  useSocket,
} from "@scripters/use-socket.io";
import { nanoid } from "nanoid";

import "./index.css";

import { BoardWrapper, RoomWrapper, useUsers, useItemActions, Board } from "@/";

import { itemMap, ItemForm } from "./sample";

import SelectedItemsPane from "./SelectedItemsPane";

const { STORYBOOK_SOCKET_URL } = process.env;
const SOCKET_PATH = process.env.STORYBOOK_SOCKET_PATH || "/socket.io";

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

const initialItems = [
  {
    type: "cylinder",
    x: 0,
    y: 0,
    id: "test00cyl",
    color: "#345",
    actions: ["rotate45", { name: "rotate", args: { angle: 10 } }, "remove"],
  },
  {
    type: "cube",
    x: 100,
    y: 100,
    id: "test00",
    color: "#023456",
    actions: ["rotate45", { name: "rotate", args: { angle: 10 } }, "remove"],
  },
  {
    type: "cube",
    x: -100,
    y: -100,
    id: "test01",
    color: "#727456",
    actions: ["rotate45", { name: "rotate", args: { angle: 20 } }, "remove"],
  },
  { type: "round", x: 100, y: -100, id: "test", color: "#923456" },
  { type: "token", x: -100, y: 100, id: "test2", color: "#0077AA" },
];

const AddItems = () => {
  const { pushItem } = useItemActions();

  const addItem = (key, tpl) => {
    pushItem({ type: key, ...tpl, id: nanoid() });
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "start" }}
    >
      {Object.entries(itemMap).map(
        ([key, itemTpl]) =>
          key !== "error" && (
            <div key={key}>
              <button onClick={() => addItem(key, itemTpl.template)}>
                Add {key}
              </button>
            </div>
          )
      )}
    </div>
  );
};

const UserList = () => {
  const { currentUser, localUsers } = useUsers();
  return (
    <>
      <h1>Users</h1>
      <ul>
        {localUsers.map((user) => (
          <li key={user.id}>
            {currentUser.id === user.id ? "You: " : ""}
            {user.name}
          </li>
        ))}
      </ul>
    </>
  );
};

const Init = () => {
  const { setItemList } = useItemActions();
  React.useEffect(() => {
    setItemList(initialItems);
  }, [setItemList]);
  return null;
};

const Overlay = ({ children, hideMenu }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundColor: "#eee",
    }}
  >
    {children}
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        backgroundColor: "#999999",
        padding: "0.5em",
      }}
    >
      <Init />
      <AddItems />
      <UserList />
    </div>
    <SelectedItemsPane hideMenu={hideMenu} ItemFormComponent={ItemForm} />
    <div id={`portal-container-uid`} />
  </div>
);

const OneViewContent = ({ moveFirst, hideMenu, room, session, children }) => {
  const socket = useSocket();
  return (
    <BoardWrapper room={room} session={session} socket={socket}>
      <Overlay hideMenu={hideMenu}>
        <Board
          moveFirst={moveFirst}
          style={{ backgroundColor: "#cca" }}
          itemTemplates={itemMap}
        >
          {children}
        </Board>
      </Overlay>
    </BoardWrapper>
  );
};

export const OneView = (props) => (
  <WithSocketIO>
    <div
      style={{
        width: "100%",
        height: "500px",
        position: "relative",
        border: "1px solid black",
      }}
    >
      <OneViewContent {...props} />
    </div>
  </WithSocketIO>
);

OneView.args = {
  moveFirst: false,
  hideMenu: false,
  room: nanoid(),
  session: nanoid(),
};

const style1 = {
  background: `linear-gradient(63deg, #999 23%, transparent 23%) 7px 0,
linear-gradient(63deg, transparent 74%, #999 78%),
linear-gradient(63deg, transparent 34%, #999 38%, #999 58%, transparent 62%),
#444`,
  backgroundSize: "16px 48px",
};

const style = {
  backgroundColor: "#555",
  backgroundImage: `linear-gradient(white 2px, transparent 2px),
linear-gradient(90deg, white 2px, transparent 2px),
linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px),
linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)`,
  backgroundSize: "100px 100px, 100px 100px, 20px 20px, 20px 20px",
  backgroundPosition: "-2px -2px, -2px -2px, -1px -1px, -1px -1px",
};

const style3 = {
  backgroundColor: "#eee",
  backgroundImage: `linear-gradient(45deg, black 25%, transparent 25%, transparent 75%, black 75%, black), linear-gradient(45deg, black 25%, transparent 25%, transparent 75%, black 75%, black)`,
  backgroundSize: "60px 60px",
  backgroundPosition: "0 0, 30px 30px",
};

const OneViewWithRoomContent = ({ moveFirst, hideMenu, room, session }) => {
  const socket = useSocket();
  return (
    <RoomWrapper room={room} socket={socket}>
      <BoardWrapper session={session} socket={socket}>
        <Overlay hideMenu={hideMenu}>
          <Board moveFirst={moveFirst} itemTemplates={itemMap} style={style} />
        </Overlay>
      </BoardWrapper>
    </RoomWrapper>
  );
};

export const OneViewWithRoom = (props) => (
  <WithSocketIO>
    <div
      style={{
        width: "100%",
        height: "500px",
        position: "relative",
        border: "1px solid black",
      }}
    >
      <OneViewWithRoomContent {...props} />
    </div>
  </WithSocketIO>
);

OneViewWithRoom.args = {
  moveFirst: false,
  hideMenu: false,
  room: nanoid(),
  session: nanoid(),
};

export const TwoView = (props) => {
  // Generate stable room and sessions
  const [[room, session]] = React.useState(() => [nanoid(), nanoid()]);

  return (
    <div
      style={{
        width: "100%",
        height: "500px",
        display: "flex",
      }}
    >
      <WithSocketIO>
        <div
          style={{
            position: "relative",
            height: "100%",
            flex: 1,
            border: "1px solid grey",
          }}
        >
          <OneViewContent room={room} session={session} {...props} />
        </div>
      </WithSocketIO>
      <WithSocketIO>
        <div
          style={{
            position: "relative",
            height: "100%",
            flex: 1,
            border: "1px solid grey",
          }}
        >
          <OneViewContent room={room} session={session} {...props} />
        </div>
      </WithSocketIO>
    </div>
  );
};

TwoView.args = {
  moveFirst: false,
  hideMenu: false,
};

export const OneViewWithCustomBoardElements = (props) => (
  <WithSocketIO>
    <div
      style={{
        width: "100%",
        height: "500px",
        position: "relative",
        border: "1px solid black",
      }}
    >
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

OneViewWithCustomBoardElements.args = {
  moveFirst: false,
  hideMenu: false,
  room: nanoid(),
  session: nanoid(),
};
