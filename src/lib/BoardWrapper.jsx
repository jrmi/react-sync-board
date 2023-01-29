import React from "react";
import styled from "@emotion/styled";
import { RecoilRoot, useSetRecoilState, useRecoilState } from "recoil";
import { nanoid } from "nanoid";
import { useResizeObserver } from "@react-hookz/web/esm";

import useWire, { WireProvider } from "@/hooks/useWire";

import { SyncedStoreProvider } from "@/board/store/synced";

import { userAtom } from "@/users/atoms";

import { SubscribeUserEvents } from "@/users";

import { insideClass } from "@/utils";
import useMainStore from "@/board/store/main";

const StyledBoardView = styled.div`
  overflow: hidden;
  position: absolute;
  inset: 0;
`;

const SyncBoard = ({ children, style }) => {
  const boardWrapperRef = React.useRef(null);
  const setCurrentUserState = useSetRecoilState(userAtom);

  const { room: session } = useWire("board");

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
    setCurrentUserState((prevUser) => ({
      ...prevUser,
      space: session,
    }));
    return () => {
      setCurrentUserState((prevUser) => ({
        ...prevUser,
        space: null,
      }));
    };
  }, [session, setCurrentUserState]);

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

const ConnectedSyncBoard = ({ socket, room, session, ...props }) => {
  const [stableRoom] = React.useState(room || nanoid());
  const [stableSession] = React.useState(session || nanoid());

  const roomChannel = useWire("room");

  if (!roomChannel) {
    // No room declared so we create one
    return (
      <RecoilRoot>
        <WireProvider room={stableRoom} channel="room" socket={socket}>
          <SubscribeUserEvents />
          <WireProvider room={stableSession} channel="board" socket={socket}>
            <SyncedStoreProvider storeName={`${stableSession}_item`}>
              <SyncBoard {...props} />
            </SyncedStoreProvider>
          </WireProvider>
        </WireProvider>
      </RecoilRoot>
    );
  }
  return (
    <WireProvider room={stableSession} channel="board" socket={socket}>
      <SyncedStoreProvider storeName={`${stableSession}_item`}>
        <SyncBoard {...props} />
      </SyncedStoreProvider>
    </WireProvider>
  );
};

export default ConnectedSyncBoard;
