/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { Provider as SocketIOProvider } from "@scripters/use-socket.io";
import { nanoid } from "nanoid";

import MainView from "./MainView";
import { itemMap, ItemForm, actionMap, itemLibrary } from "./sample";
import { useItemBaseActions } from "./board/Items";
import { useUsers } from "./users";

const { SOCKET_URL } = process.env;
const SOCKET_PATH = process.env.SOCKET_PATH || "/socket.io";

const SOCKET_OPTIONS = {
  forceNew: true,
  path: SOCKET_PATH,
  transports: ["websocket"],
};

const WithSocketIO = ({ children }) => (
  <SocketIOProvider url={SOCKET_URL} options={SOCKET_OPTIONS}>
    {children}
  </SocketIOProvider>
);

export default {
  component: MainView,
  title: "SyncBoard/Main",
};

const itemLibraries = [
  {
    name: "Standard",
    key: "standard",
    items: itemLibrary,
  },
];

const initialItems = [
  { type: "round", x: 450, y: 450, id: "test", color: "#923456" },
];

const AddItems = () => {
  const { pushItem } = useItemBaseActions();

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

const Overlay = () => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      backgroundColor: "#999999",
      padding: "0.5em",
    }}
  >
    <AddItems />
    <UserList />
  </div>
);

export const OneView = ({ moveFirst, hideMenu, room, session }) => (
  <WithSocketIO>
    <div
      style={{
        width: "100%",
        height: "500px",
        position: "relative",
        border: "1px solid black",
      }}
    >
      <MainView
        room={room}
        session={session}
        itemTemplates={itemMap}
        itemLibraries={itemLibraries}
        actions={actionMap}
        ItemFormComponent={ItemForm}
        initialItems={initialItems}
        moveFirst={moveFirst}
        hideMenu={hideMenu}
      >
        <Overlay />
      </MainView>
    </div>
  </WithSocketIO>
);

OneView.args = {
  moveFirst: false,
  hideMenu: false,
  room: nanoid(),
  session: nanoid(),
};

export const TwoView = ({ moveFirst, hideMenu }) => {
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
          <MainView
            room={room}
            session={session}
            itemTemplates={itemMap}
            actions={actionMap}
            itemLibraries={itemLibraries}
            ItemFormComponent={ItemForm}
            moveFirst={moveFirst}
            hideMenu={hideMenu}
          >
            <Overlay />
          </MainView>
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
          <MainView
            room={room}
            session={session}
            itemTemplates={itemMap}
            actions={actionMap}
            itemLibraries={itemLibraries}
            ItemFormComponent={ItemForm}
            moveFirst={moveFirst}
            hideMenu={hideMenu}
          >
            <Overlay />
          </MainView>
        </div>
      </WithSocketIO>
    </div>
  );
};

TwoView.args = {
  moveFirst: false,
  hideMenu: false,
};
