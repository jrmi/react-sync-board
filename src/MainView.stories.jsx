import React from "react";
import { Provider as SocketIOProvider } from "@scripters/use-socket.io";
import { nanoid } from "nanoid";
import MainView from "./MainView";
import { itemMap, ItemForm, actionMap, itemLibrary } from "./sample";

const SOCKET_URL = "http://192.168.0.14:4051";
const SOCKET_PATH = "/socket.io";

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

export const OneView = () => (
  <WithSocketIO>
    <div
      style={{
        width: "800px",
        height: "500px",
        position: "relative",
        border: "1px solid black",
      }}
    >
      <MainView
        room={nanoid()}
        session={nanoid()}
        itemTemplates={itemMap}
        itemLibraries={itemLibraries}
        actions={actionMap}
        ItemFormComponent={ItemForm}
      />
    </div>
  </WithSocketIO>
);

export const TwoView = () => {
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
          />
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
          />
        </div>
      </WithSocketIO>
    </div>
  );
};
