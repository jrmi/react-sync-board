import React, { useContext } from "react";
import { joinWire } from "wire.io";

import Spinner from "../ui/Spinner";

const Context = React.createContext();

export const WireProvider = ({
  socket,
  room,
  channel = "default",
  children,
}) => {
  const [joined, setJoined] = React.useState(false);
  const [isMaster, setIsMaster] = React.useState(false);
  const [wire, setWire] = React.useState(null);
  const roomRef = React.useRef(null);
  const mountedRef = React.useRef(false);
  const existingC2C = useContext(Context);
  const connectingRef = React.useRef(false);

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
    //console.log(`Try to connect to wire ${room} on channel ${channel}`);
    if (!connectingRef.current) {
      connectingRef.current = true;
      joinWire({
        socket,
        room,
        onMaster: () => {
          //console.log(`Is now master on channel ${channel}…`);
          if (!mountedRef.current) return;
          setIsMaster(true);
        },
        onJoined: (newRoom) => {
          //console.log(`Connected on channel ${channel}…`);
          roomRef.current = newRoom;

          if (!mountedRef.current) return;
          setWire(newRoom);
          setJoined(true);
        },
      });
    }

    return () => {
      roomRef.current?.leave();
    };
  }, [channel, room, socket]);

  if (!joined || !wire) {
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
      value={{ ...existingC2C, [channel]: { wire, joined, isMaster, room } }}
    >
      {children}
    </Context.Provider>
  );
};

const useWire = (channel = "default") => {
  const channels = useContext(Context) || {};
  return channels[channel];
};

export default useWire;
