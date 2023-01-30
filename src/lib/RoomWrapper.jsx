import React from "react";
import { RecoilRoot } from "recoil";
import { nanoid } from "nanoid";

import { WireProvider } from "@/hooks/useWire";
import { SyncedUsersProvider } from "@/users/users";

const ConnectedSyncRoom = ({ socket, room, children }) => {
  const [stableRoom] = React.useState(room || nanoid());

  return (
    <RecoilRoot>
      <WireProvider room={stableRoom} channel="room" socket={socket}>
        <SyncedUsersProvider stableSession={`${stableRoom}_users`}>
          {children}
        </SyncedUsersProvider>
      </WireProvider>
    </RecoilRoot>
  );
};

export default ConnectedSyncRoom;
