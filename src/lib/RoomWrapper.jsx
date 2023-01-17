import React from "react";
import { RecoilRoot } from "recoil";
import { nanoid } from "nanoid";

import { WireProvider } from "@/hooks/useWire";

import { SubscribeUserEvents } from "@/users";

const ConnectedSyncRoom = ({ socket, room: givenRoom, children }) => {
  const [room] = React.useState(() => givenRoom || nanoid());

  return (
    <RecoilRoot>
      <WireProvider room={room} channel="room" socket={socket}>
        <SubscribeUserEvents />
        {children}
      </WireProvider>
    </RecoilRoot>
  );
};

export default ConnectedSyncRoom;
