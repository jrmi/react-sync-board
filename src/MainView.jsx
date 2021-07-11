import React from "react";
import styled from "@emotion/styled";
import { RecoilRoot, useSetRecoilState, useRecoilState } from "recoil";
import { QueryClientProvider, QueryClient } from "react-query";
import { nanoid } from "nanoid";

import useC2C, { C2CProvider } from "@/hooks/useC2C";

import { BoardConfigAtom, ConfigurationAtom, Board } from "./board";

import SelectedItemsPane from "./SelectedItemsPane";
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
const NullComponent = () => null;

const defaultBoard = {
  size: 1000,
};

const MainView = ({
  initialBoardConfig = defaultBoard,
  initialItems = emptyList,
  initialMessages = emptyList,
  itemTemplates = emptyMap,
  actions = emptyMap,
  onItemsChange,
  onMasterChange,
  ItemFormComponent = NullComponent,
  moveFirst = false,
  hideMenu = false,
  children,
  style,
}) => {
  const { isMaster } = useC2C("board");

  const { currentUser, localUsers: users } = useUsers();

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
    setMessages(initialMessages.map((m)=>parseMessage(m)));
  }, [initialMessages, setMessages]);

  React.useEffect(() => {
    if (onMasterChange) {
      onMasterChange(isMaster);
    }
  }, [isMaster, onMasterChange]);

  return (
    <StyledBoardView id={uid} className="sync-board" style={style}>
      <BoardContainer className="sync-board-container">
        <Board
          user={currentUser}
          users={users}
          moveFirst={moveFirst}
          hideMenu={hideMenu}
        />
        <SelectedItemsPane
          hideMenu={hideMenu}
          ItemFormComponent={ItemFormComponent}
        />
      </BoardContainer>
      {children}
      <div id={`portal-container-${uid}`} />
      {onItemsChange && <WatchItemsChange onChange={onItemsChange} />}
    </StyledBoardView>
  );
};

const queryClient = new QueryClient();

const RecoilMainRoot = (props) => {
  const [room] = React.useState(props.room || nanoid());
  const [session] = React.useState(props.session || nanoid());
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <C2CProvider room={room} channel="room">
          <SubscribeUserEvents />
          <C2CProvider room={session} channel="board">
            <MainView {...props} />
          </C2CProvider>
        </C2CProvider>
      </QueryClientProvider>
    </RecoilRoot>
  );
};

export default RecoilMainRoot;
