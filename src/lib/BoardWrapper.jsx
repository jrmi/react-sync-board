import React from "react";
import styled from "@emotion/styled";
import { RecoilRoot, useSetRecoilState, useRecoilState } from "recoil";
import { nanoid } from "nanoid";
import { useResizeObserver } from "@react-hookz/web/esm";

import useWire, { WireProvider } from "@/hooks/useWire";

import { ItemStoreProvider } from "@/board/store/items";

import { ConfigurationAtom } from "@/board";

import { userAtom } from "@/users/atoms";

import { SubscribeUserEvents } from "@/users";

import { insideClass } from "@/utils";

const StyledBoardView = styled.div`
  overflow: hidden;
  position: absolute;
  inset: 0;
`;

const SyncBoard = ({ children, style }) => {
  const boardWrapperRef = React.useRef(null);
  const setCurrentUserState = useSetRecoilState(userAtom);

  const { room: session } = useWire("board");

  const [{ uid }, setConfiguration] = useRecoilState(ConfigurationAtom);

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
      setConfiguration((prev) => ({
        ...prev,
        uid: nanoid(),
      }));
    }
  }, [setConfiguration, uid]);

  React.useEffect(() => {
    setConfiguration((prev) => ({
      ...prev,
      boardWrapper: boardWrapperRef.current,
    }));
  }, [setConfiguration, uid]);

  useResizeObserver(boardWrapperRef, () => {
    if (!boardWrapperRef.current) {
      return;
    }
    setConfiguration((prev) => ({
      ...prev,
      boardWrapperRect: boardWrapperRef.current.getBoundingClientRect(),
    }));
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
            <ItemStoreProvider storeName={`${stableSession}_item`}>
              <SyncBoard {...props} />
            </ItemStoreProvider>
          </WireProvider>
        </WireProvider>
      </RecoilRoot>
    );
  }
  return (
    <WireProvider room={stableSession} channel="board" socket={socket}>
      <ItemStoreProvider storeName={`${stableSession}_item`}>
        <SyncBoard {...props} />
      </ItemStoreProvider>
    </WireProvider>
  );
};

export default ConnectedSyncBoard;
