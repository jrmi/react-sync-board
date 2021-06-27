import React from "react";
import { Provider as SocketIOProvider } from "@scripters/use-socket.io";
import MainView from "./MainView";

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
  title: "MainView/Main",
};

export const Primary = () => (
  <WithSocketIO>
    <div
      style={{
        width: "800px",
        height: "300px",
        position: "relative",
        border: "1px solid black",
      }}
    >
      <MainView />
    </div>
  </WithSocketIO>
);
