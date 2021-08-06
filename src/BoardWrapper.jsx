import React from "react";
import styled from "@emotion/styled";
import { RecoilRoot, useSetRecoilState, useRecoilState } from "recoil";
import { nanoid } from "nanoid";

import useC2C, { C2CProvider } from "@/hooks/useC2C";

import { BoardConfigAtom, ConfigurationAtom } from "./board";

import { userAtom } from "./users/atoms";

import { SubscribeUserEvents } from "./users";

import { insideClass } from "./utils";
import { useItemBaseActions } from "./board/Items";
import { MessagesAtom, parseMessage } from "./message/useMessage";

const StyledBoardView = styled.div`
  overflow: hidden;
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
`;

const emptyList = [];
const emptyMap = {};

const defaultBoard = {
  size: 1000,
};

const SyncBoard = ({
  initialBoardConfig = defaultBoard,
  initialItems = emptyList,
  initialMessages = emptyList,
  itemTemplates = emptyMap,
  actions = emptyMap,
  onMasterChange,
  children,
  style,
}) => {
  const setCurrentUserState = useSetRecoilState(userAtom);

  const { room: session, isMaster } = useC2C("board");

  const setBoardConfig = useSetRecoilState(BoardConfigAtom);
  const setMessages = useSetRecoilState(MessagesAtom);
  const [{ uid }, setSettings] = useRecoilState(ConfigurationAtom);
  const { setItemList } = useItemBaseActions();

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
    setBoardConfig(initialBoardConfig);
  }, [initialBoardConfig, setBoardConfig]);

  React.useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      itemTemplates,
      actions,
    }));
  }, [actions, itemTemplates, setSettings]);

  React.useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      uid: nanoid(),
    }));
  }, [setSettings]);

  React.useEffect(() => {
    setItemList(initialItems);
  }, [initialItems, setItemList]);

  React.useEffect(() => {
    setMessages(initialMessages.map((m) => parseMessage(m)));
  }, [initialMessages, setMessages]);

  React.useEffect(() => {
    if (onMasterChange) {
      onMasterChange(isMaster);
    }
  }, [isMaster, onMasterChange]);

  return (
    <StyledBoardView id={uid} className="sync-board" style={style}>
      {children}
    </StyledBoardView>
  );
};

const ConnectedSyncBoard = (props) => {
  const [room] = React.useState(props.room || nanoid());
  const [session] = React.useState(props.session || nanoid());

  const roomChannel = useC2C("room");

  if (!roomChannel) {
    // No room declared so we create one
    return (
      <RecoilRoot>
        <C2CProvider room={room} channel="room">
          <SubscribeUserEvents />
          <C2CProvider room={session} channel="board">
            <SyncBoard {...props} />
          </C2CProvider>
        </C2CProvider>
      </RecoilRoot>
    );
  }
  return (
    <C2CProvider room={session} channel="board">
      <SyncBoard {...props} />
    </C2CProvider>
  );
};

export default ConnectedSyncBoard;
