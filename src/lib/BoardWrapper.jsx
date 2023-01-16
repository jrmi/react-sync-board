import React from "react";
import styled from "@emotion/styled";
import { nanoid } from "nanoid";
import { useResizeObserver } from "@react-hookz/web/esm";

import useWire, { WireProvider } from "@/hooks/useWire";

import { SyncedStoreProvider } from "@/board/store/synced";

import { insideClass } from "@/utils";
import useMainStore from "@/board/store/main";
import { SyncedUsersProvider, useSyncedUsers } from "./users/store";
import { SyncedMessageProvider } from "./message/store";

const StyledBoardView = styled.div`
  overflow: hidden;
  position: absolute;
  inset: 0;
`;

const SyncBoard = ({ children, session, style }) => {
  const boardWrapperRef = React.useRef(null);
  const joinSpace = useSyncedUsers((state) => state.joinSpace);

  const [uid, updateConfiguration] = useMainStore((state) => [
    state.config.uid,
    state.updateConfiguration,
  ]);

  React.useEffect(() => {
    // Chrome-related issue.
    // Making the wheel event non-passive, which allows to use preventDefault() to prevent
    // the browser original zoom  and therefore allowing our custom one.
    // More detail at https://github.com/facebook/react/issues/14856
    const cancelWheel = (event) => {
      if (insideClass(event.target, "board")) event.preventDefault();
    };

    document.body.addEventListener("wheel", cancelWheel, { passive: false });

    return () => {
      document.body.removeEventListener("wheel", cancelWheel);
    };
  }, []);

  // Set user space
  React.useEffect(() => {
    joinSpace(session);
    return () => {
      joinSpace(null);
    };
  }, [joinSpace, session]);

  React.useEffect(() => {
    if (!uid) {
      updateConfiguration({
        uid: nanoid(),
      });
    }
  }, [uid, updateConfiguration]);

  React.useEffect(() => {
    updateConfiguration({
      boardWrapper: boardWrapperRef.current,
    });
  }, [updateConfiguration]);

  useResizeObserver(boardWrapperRef, () => {
    if (!boardWrapperRef.current) {
      return;
    }
    updateConfiguration({
      boardWrapperRect: boardWrapperRef.current.getBoundingClientRect(),
    });
  });

  return (
    <StyledBoardView
      ref={boardWrapperRef}
      id={uid}
      className="sync-board"
      style={style}
    >
      {children}
    </StyledBoardView>
  );
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
            <SyncedStoreProvider
              storeName={`${stableSession}_item`}
              defaultValue={defaultItemsValue}
            >
              <SyncBoard {...props} session={stableSession} />
            </SyncedStoreProvider>
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
      <SyncedStoreProvider
        storeName={`${stableSession}_item`}
        defaultValue={defaultItemsValue}
      >
        <SyncBoard {...props} session={stableSession} />
      </SyncedStoreProvider>
    </SyncedMessageProvider>
  );
};

export default ConnectedSyncBoard;
