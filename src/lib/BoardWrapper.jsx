import React from "react";
import { nanoid } from "nanoid";

import useWire, { WireProvider } from "@/hooks/useWire";

import { SyncedStoreProvider } from "@/board/store/synced";
import { MainStoreProvider } from "@/board/store/main";

import { SyncedUsersProvider, useSyncedUsers } from "./users/store";
import { SyncedMessageProvider } from "./message/store";

const SyncBoard = ({ children, session }) => {
  const joinSpace = useSyncedUsers((state) => state.joinSpace);

  // Set user space
  React.useEffect(() => {
    joinSpace(session);
    return () => {
      joinSpace(null);
    };
  }, [joinSpace, session]);

  return children;
};

const ConnectedSyncBoard = ({
  socket,
  room,
  session,
  items = [],
  messages = [],
  LoadingComponent,
  ...props
}) => {
  const [stableRoom] = React.useState(room || nanoid());
  const [stableSession] = React.useState(session || nanoid());
  const [defaultItemsValue] = React.useState(() => {
    return {
      itemIds: items.map(({ id }) => id),
      items: Object.fromEntries(items.map((item) => [item.id, item])),
    };
  });

  const roomChannel = useWire("room");

  if (!roomChannel) {
    // No room declared so we create one
    return (
      <WireProvider
        room={stableRoom}
        channel="room"
        socket={socket}
        LoadingComponent={LoadingComponent}
      >
        <SyncedUsersProvider storeName={`${stableRoom}_users`}>
          <SyncedMessageProvider
            storeName={`${stableSession}_messages`}
            defaultValue={messages}
          >
            <MainStoreProvider>
              <SyncedStoreProvider
                storeName={`${stableSession}_item`}
                defaultValue={defaultItemsValue}
              >
                <SyncBoard {...props} session={stableSession} />
              </SyncedStoreProvider>
            </MainStoreProvider>
          </SyncedMessageProvider>
        </SyncedUsersProvider>
      </WireProvider>
    );
  }
  return (
    <SyncedMessageProvider
      storeName={`${stableSession}_messages`}
      defaultValue={messages}
    >
      <MainStoreProvider>
        <SyncedStoreProvider
          storeName={`${stableSession}_item`}
          defaultValue={defaultItemsValue}
        >
          <SyncBoard {...props} session={stableSession} />
        </SyncedStoreProvider>
      </MainStoreProvider>
    </SyncedMessageProvider>
  );
};

export default ConnectedSyncBoard;
