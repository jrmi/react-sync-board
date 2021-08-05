import React from "react";
import styled from "@emotion/styled";
import { RecoilRoot, useSetRecoilState, useRecoilState } from "recoil";
import { nanoid } from "nanoid";

import useC2C, { C2CProvider } from "@/hooks/useC2C";

import { BoardConfigAtom, ConfigurationAtom, Board } from "./board";

import { SubscribeUserEvents, useUsers } from "./users";

import { insideClass } from "./utils";
import { useItemBaseActions } from "./board/Items";
import WatchItemsChange from "./WatchItemChange";
import { MessagesAtom, parseMessage } from "./message/useMessage";

const StyledBoardView = styled.div`
  overflow: hidden;
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;

  --bg-color: #000000;
  --bg-secondary-color: #121212;
  --font-color: #f9fbfa;
  --font-color2: #b3b3b3;
  --color-darkGrey: #121212;
  --color-darkBlueGrey: #151a23;
  --color-blueGrey: #19202c;
  --color-lightGrey: #90969d;
  --color-grey: #454545;
  --color-midGrey: #2c3749;
  --color-primary: #db5034;
  --color-secondary: #00a698ff;
  --color-error: #d43939;
  --color-success: #28bd14;
  --grid-maxWidth: 120rem;
  --grid-gutter: 2rem;
  --font-size: 1.6rem;
  --font-family-sans: "Roboto", sans-serif;
  --font-family-mono: monaco, "Consolas", "Lucida Console", monospace;
`;

const BoardContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  background-color: var(--color-darkGrey);
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
  const { isMaster } = useC2C("board");

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

  const boardChannel = useC2C("board");

  if (!boardChannel) {
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
