import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { RecoilRoot, useSetRecoilState, useRecoilState } from "recoil";
import { QueryClientProvider, QueryClient } from "react-query";

import { nanoid } from "nanoid";
import { C2CProvider } from "./hooks/useC2C";

import { BoardConfigAtom, ConfigurationAtom, Board } from "./board";

import SelectedItemsPane from "./SelectedItemsPane";
import { SubscribeUserEvents, useUsers } from "./users";
import Touch from "./ui/Touch";

import { MediaLibraryProvider } from "./mediaLibrary";
import ImageDropNPaste from "./ImageDropNPaste";
import AddItemButton from "./AddItemButton";
import MessageButton from "./message";
import { insideClass } from "./utils";
import EditInfoButton from "./EditInfoButton";
import { useItems } from "./board/Items";

const StyledBoardView = styled.div.attrs(() => ({ className: "sync-board" }))`
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

const BoardContainer = styled.div.attrs(() => ({
  className: "sync-board-container",
}))`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  background-color: var(--color-darkGrey);
`;

const ActionBar = styled.div`
  position: absolute;
  bottom: 1em;
  right: 0em;
  display: flex;
  width: 100%;
  text-shadow: 1px 1px 2px #222;
  font-size: 0.8em;
  pointer-events: none;

  & > *:not(.spacer) {
    padding: 0 1.5em;
    pointer-events: all;
  }

  & .spacer {
    flex: 1;
  }

  @media screen and (max-width: 640px) {
    & > *:not(.spacer) {
      padding: 0 0.5em;
    }
    & .spacer {
      padding: 0;
    }
  }

  @media screen and (max-width: 420px) {
    & > *:not(.spacer) {
      padding: 0 0.2em;
    }
  }
`;

const emptyList = [];
const emptyMap = {};
const NullComponent = () => null;

const defaultBoard = {
  size: 1000,
};

const MainView = ({
  boardConfig: initialBoardConfig = defaultBoard,
  items: initialItems = emptyList,
  edit: editMode = false,
  mediaLibraries = emptyList,
  mediaHandlers = emptyMap,
  itemTemplates = emptyMap,
  itemLibraries = emptyList,
  actions = emptyMap,
  ItemFormComponent = NullComponent,
  BoardFormComponent = NullComponent,
}) => {
  const { t } = useTranslation();

  const { currentUser, localUsers: users } = useUsers();

  const [moveFirst, setMoveFirst] = React.useState(false);
  const [hideMenu, setHideMenu] = React.useState(false);

  const setBoardConfig = useSetRecoilState(BoardConfigAtom);
  const [{ uid }, setSettings] = useRecoilState(ConfigurationAtom);
  const { setItemList } = useItems();

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

  return (
    <StyledBoardView>
      <MediaLibraryProvider libraries={mediaLibraries} {...mediaHandlers}>
        <BoardContainer>
          <ImageDropNPaste>
            <Board
              user={currentUser}
              users={users}
              moveFirst={moveFirst}
              hideMenu={hideMenu}
            />
          </ImageDropNPaste>
          <SelectedItemsPane
            hideMenu={hideMenu}
            ItemFormComponent={ItemFormComponent}
          />
        </BoardContainer>
        <ActionBar>
          {!editMode && <MessageButton />}
          {editMode && (
            <EditInfoButton BoardFormComponent={BoardFormComponent} />
          )}
          <div className="spacer" />
          <Touch
            onClick={() => setMoveFirst(false)}
            alt={t("Select mode")}
            label={t("Select")}
            title={t("Switch to select mode")}
            icon={"mouse-pointer"}
            active={!moveFirst}
          />
          <Touch
            onClick={() => setMoveFirst(true)}
            alt={t("Move mode")}
            label={t("Move")}
            title={t("Switch to move mode")}
            icon={"hand"}
            active={moveFirst}
          />
          <Touch
            onClick={() => setHideMenu((prev) => !prev)}
            alt={hideMenu ? t("Show menu") : t("Hide menu")}
            label={hideMenu ? t("Show menu") : t("Hide menu")}
            title={hideMenu ? t("Show action menu") : t("Hide action menu")}
            icon={hideMenu ? "eye-with-line" : "eye"}
          />
          <div className="spacer" />
          <AddItemButton itemLibraries={itemLibraries} />
        </ActionBar>
      </MediaLibraryProvider>
      <div id={`portal-container-${uid}`} />
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
