import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { RecoilRoot, useSetRecoilState } from "recoil";
import { QueryClientProvider, QueryClient } from "react-query";

import { C2CProvider } from "./hooks/useC2C";

import { BoardConfigAtom, Board } from "./board";

import SelectedItemsPane from "./SelectedItemsPane";
import { useUsers } from "./users";
import Touch from "./ui/Touch";

import { MediaLibraryProvider } from "./mediaLibrary";
import ImageDropNPaste from "./ImageDropNPaste";
import AddItemButton from "./AddItemButton";
import MessageButton from "./message";
import { insideClass } from "./utils";
import EditInfoButton from "./EditInfoButton";
import { useItems } from "./board/Items";

const StyledBoardView = styled.div.attrs(() => ({ className: "sync-board" }))`
  /*width: 100vw;
  height: 100vh;*/
  overflow: hidden;
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
`;

const BoardContainer = styled.div`config
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

const defaultBoard = {
  size: 1000,
};
// const NullComponent = () => null;

const MainView = ({
  boardConfig: initialBoardConfig = defaultBoard,
  items: initialItems = emptyList,
  edit: editMode = false,
  mediaLibraries,
  mediaHandlers,
  itemMap = emptyList,
  actionMap = emptyMap,
  ItemFormComponent = null,
  BoardFormComponent = null,
}) => {
  const { t } = useTranslation();
  const { currentUser, localUsers: users } = useUsers();

  const [moveFirst, setMoveFirst] = React.useState(false);
  const [hideMenu, setHideMenu] = React.useState(false);

  const setBoardConfig = useSetRecoilState(BoardConfigAtom);
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
              itemMap={itemMap}
              moveFirst={moveFirst}
              hideMenu={hideMenu}
            />
          </ImageDropNPaste>
          <SelectedItemsPane
            hideMenu={hideMenu}
            itemMap={itemMap}
            actionMap={actionMap}
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
          <AddItemButton itemMap={itemMap} />
        </ActionBar>
      </MediaLibraryProvider>
    </StyledBoardView>
  );
};

const queryClient = new QueryClient();

const RecoilMainRoot = (props) => (
  <RecoilRoot>
    <QueryClientProvider client={queryClient}>
      <C2CProvider room={"test"} channel="board">
        <MainView {...props} />
      </C2CProvider>
    </QueryClientProvider>
  </RecoilRoot>
);

export default RecoilMainRoot;
