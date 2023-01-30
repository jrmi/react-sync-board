import React from "react";
import { nanoid } from "nanoid";

import { WireProvider } from "@/hooks/useWire";
import { SyncedUsersProvider } from "@/users/store";

const ConnectedSyncRoom = ({ socket, room, children, LoadingComponent }) => {
  const [stableRoom] = React.useState(room || nanoid());

  return (
    <WireProvider
      room={stableRoom}
      channel="room"
      socket={socket}
      LoadingComponent={LoadingComponent}
    >
      <SyncedUsersProvider stableSession={`${stableRoom}_users`}>
        {children}
      </SyncedUsersProvider>
    </WireProvider>
  );
};

export default ConnectedSyncRoom;
