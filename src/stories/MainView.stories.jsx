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
import useBoardConfig from "../board/useBoardConfig";

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
  { type: "round", x: 450, y: 450, id: "test", color: "#923456" },
  { type: "token", x: 650, y: 450, id: "test2", color: "#0077AA" },
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
      {Object.entries(itemMap).map(([key, itemTpl]) => (
        <div key={key}>
          <button onClick={() => addItem(key, itemTpl.template)}>
            Add {key}
          </button>
        </div>
      ))}
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
  const [, setBoardConfig] = useBoardConfig();
  React.useEffect(() => {
    setItemList(initialItems);
    setBoardConfig({ size: 1000 });
  }, [setBoardConfig, setItemList]);
  return null;
};

const Overlay = ({ children, hideMenu }) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "#eee",
    }}
  >
    {children}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
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

const OneViewContent = ({ moveFirst, hideMenu, room, session }) => {
  const socket = useSocket();
  return (
    <BoardWrapper room={room} session={session} socket={socket}>
      <Overlay hideMenu={hideMenu}>
        <Board
          moveFirst={moveFirst}
          style={{ backgroundColor: "#cca", borderRadius: "2em" }}
          itemTemplates={itemMap}
        />
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

const OneViewWithRoomContent = ({ moveFirst, hideMenu, room, session }) => {
  const socket = useSocket();
  return (
    <RoomWrapper room={room} socket={socket}>
      <BoardWrapper session={session} socket={socket}>
        <Overlay hideMenu={hideMenu}>
          <Board moveFirst={moveFirst} itemTemplates={itemMap} />
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
