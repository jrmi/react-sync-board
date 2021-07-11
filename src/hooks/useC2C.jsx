import React, { useContext } from "react";
import { useSocket } from "@scripters/use-socket.io";
import { join } from "client2client.io";
import useTranslation from "@/hooks/useTranslation";

import Spinner from "../ui/Spinner";

const Context = React.createContext();

export const C2CProvider = ({ room, channel = "default", children }) => {
  const { t } = useTranslation();
  const socket = useSocket();
  const [joined, setJoined] = React.useState(false);
  const [isMaster, setIsMaster] = React.useState(false);
  const [c2c, setC2c] = React.useState(null);
  const roomRef = React.useRef(null);
  const mountedRef = React.useRef(false);
  const existingC2C = useContext(Context);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (!socket) {
      return null;
    }

    const disconnect = () => {
      console.log(`Disconnected from ${channel}…`);
      if (!mountedRef.current) return;
      setJoined(false);
      setIsMaster(false);
    };

    socket.on("disconnect", disconnect);
    return () => {
      socket.off("disconnect", disconnect);
    };
  }, [channel, socket]);

  React.useEffect(() => {
    // Connect
    if (!socket) {
      return null;
    }
    if (!socket.connected) {
      socket.connect();
    }
    console.log(`Try to connect to room ${room} on channel ${channel}`);
    join({
      socket,
      room,
      onMaster: () => {
        console.log(`Is now master on channel ${channel}…`);
        if (!mountedRef.current) return;
        setIsMaster(true);
      },
      onJoined: (newRoom) => {
        console.log(`Connected on channel ${channel}…`);
        roomRef.current = newRoom;

        if (!mountedRef.current) return;
        setC2c(newRoom);
        setJoined(true);
      },
    });

    return () => {
      roomRef.current.leave();
    };
  }, [channel, room, socket]);

  if (!joined || !c2c) {
    return (
      <div
        style={{
          position: "absolute",
          top: "0",
          bottom: "0",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spinner />
      </div>
    );
  }

  return (
    <Context.Provider
      value={{ ...existingC2C, [channel]: { c2c, joined, isMaster, room } }}
    >
      {children}
    </Context.Provider>
  );
};

const useC2C = (channel = "default") => useContext(Context)[channel];

export default useC2C;
