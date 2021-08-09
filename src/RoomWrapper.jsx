import React from "react";
import { RecoilRoot } from "recoil";
import { nanoid } from "nanoid";

import { C2CProvider } from "@/hooks/useC2C";

import { SubscribeUserEvents } from "./users";

const ConnectedSyncRoom = ({ socket, room: givenRoom, children }) => {
  const [room] = React.useState(() => givenRoom || nanoid());

  return (
    <RecoilRoot>
      <C2CProvider room={room} channel="room" socket={socket}>
        <SubscribeUserEvents />
        {children}
      </C2CProvider>
    </RecoilRoot>
  );
};

export default ConnectedSyncRoom;
