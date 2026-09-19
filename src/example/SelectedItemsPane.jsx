import React from "react";
import styled from "styled-components";
import useTranslation from "./useTranslation";

import SidePanel from "./ui/SidePanel";
import ItemFormFactory from "./ItemFormFactory";
import { useAvailableActions, useSelectedItems, useBoardState } from "@/";
import useActions from "./sample/useActions";
import { useItemActions } from "@/board/Items";

const ActionPane = styled.div`
  top: ${({ top }) => top};
  left: ${({ left }) => left};
  transform: translateX(-50%);
  user-select: none;
  touch-action: none;
  position: absolute;
  display: flex;
  gap: 3px;
  color: white;
  background: #111827;
  justify-content: center;
  align-items: center;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 12px;
  padding: 5px;
  transition: opacity 100ms, transform 160ms ease;
  opacity: ${({ $hide }) => ($hide ? 0 : 0.9)};
  pointer-events: ${({ $hide }) => ($hide ? "none" : "auto")};
  box-shadow: 0 10px 25px rgb(15 23 42 / 30%);

  &:hover {
    opacity: 1;
    transform: translateX(-50%) translateY(1px);
  }

  & button {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    min-height: 38px;
    margin: 0;
    padding: 0;
    background: transparent;
    border: 0;
    border-radius: 8px;
  }
  & button:hover {
    background: rgb(255 255 255 / 12%);
  }
  & button img {
    width: 22px !important;
    height: 22px !important;
    object-fit: contain;
  }
  & .count {
    min-width: 38px;
    padding: 0 5px;
    color: var(--color-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 0.8em;
  }
  & .number {
    font-size: 16px;
    font-weight: 700;
    line-height: 1em;
  }

  @media (max-width: 720px) {
    top: 8px;
    max-width: calc(100vw - 24px);
    overflow-x: auto;
  }
`;

const CardContent = styled.div.attrs(() => ({ className: "content" }))`
  display: flex;
  flex-direction: column;
  padding: 0.5em;
`;

const SelectedItemsPane = ({ hideMenu = false, ItemFormComponent }) => {
  const actionMap = useActions();

  const { findElementUnderPointer } = useItemActions();
  const { availableActions } = useAvailableActions();
  const [showEdit, setShowEdit] = React.useState(false);

  const { t } = useTranslation();

  const selectedItems = useSelectedItems();
  const boardState = useBoardState();

  const parsedAvailableActions = availableActions.map((action) => {
    if (typeof action === "string") {
      return actionMap[action];
    }
    const realAction = actionMap[action.name];
    return {
      ...realAction,
      action: (itemIds) => realAction.action(itemIds, action.args),
    };
  });

  React.useEffect(() => {
    const onKeyUp = (e) => {
      // Block shortcut if we are typing in a textarea or input
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      Object.keys(actionMap).forEach((key) => {
        const { shortcut, action, edit: whileEdit } = actionMap[key];
        const foundAction = availableActions.find(({ name }) => name === key);

        if (foundAction && e.key === shortcut && showEdit === !!whileEdit) {
          action(selectedItems, foundAction.args);
        }
      });
    };
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [actionMap, availableActions, selectedItems, showEdit]);

  const onDblClick = React.useCallback(
    async (e) => {
      const foundElement = await findElementUnderPointer(e);

      // We dblclick outside of an element
      if (!foundElement) return;

      const filteredActions = availableActions.filter(
        (action) => !actionMap[action.name].disableDblclick
      );

      if (e.altKey && filteredActions.length > 1) {
        // Use second action
        actionMap[filteredActions[1].name].action(
          selectedItems,
          filteredActions[1].args
        );
      } else if (filteredActions.length > 0) {
        // here
        actionMap[filteredActions[0].name].action(
          selectedItems,
          filteredActions[0].args
        );
      }
    },
    [actionMap, availableActions, findElementUnderPointer, selectedItems]
  );

  React.useEffect(() => {
    document.addEventListener("dblclick", onDblClick);
    return () => {
      document.removeEventListener("dblclick", onDblClick);
    };
  }, [onDblClick]);

  if (hideMenu || selectedItems.length === 0) {
    return null;
  }

  let title = "";
  if (selectedItems.length === 1) {
    title = t("Edit item");
  }
  if (selectedItems.length > 1) {
    title = t("Edit all items");
  }

  return (
    <>
      <SidePanel
        key={selectedItems[0]}
        open={showEdit && !boardState.selecting}
        onClose={() => {
          setShowEdit(false);
        }}
        title={title}
        position="right"
        width="360px"
      >
        <CardContent>
          <ItemFormFactory ItemFormComponent={ItemFormComponent} />
        </CardContent>
      </SidePanel>
      {selectedItems.length && !hideMenu && (
        <ActionPane
          left="50%"
          top="5px"
          $hide={
            boardState.zooming || boardState.panning || boardState.movingItems
          }
        >
          {(selectedItems.length > 1 || boardState.selecting) && (
            <div className="count">
              <span className="number">{selectedItems.length}</span>
              <span>{t("Items")}</span>
            </div>
          )}
          {!boardState.selecting &&
            parsedAvailableActions.map(
              ({
                label,
                action: handler,
                multiple,
                edit: onlyEdit,
                shortcut,
                icon,
              }) => {
                if (multiple && selectedItems.length < 2) return null;
                if (onlyEdit && !showEdit) return null;
                return (
                  <button
                    className="button clear icon-only"
                    key={label}
                    // here
                    onClick={() => handler(selectedItems)}
                    title={label + (shortcut ? ` (${shortcut})` : "")}
                  >
                    <img
                      src={icon}
                      style={{ width: "32px", height: "32px" }}
                      alt={label}
                    />
                  </button>
                );
              }
            )}

          {!boardState.selecting && (
            <button
              className="button clear icon-only"
              onClick={() => setShowEdit((prev) => !prev)}
              title={t("Edit")}
            >
              {!showEdit && (
                <img
                  src="https://icongr.am/feather/edit.svg?size=32&color=ffffff"
                  alt={t("Edit")}
                />
              )}
              {showEdit && (
                <img
                  src="https://icongr.am/feather/edit.svg?size=32&color=db5034"
                  alt={t("Edit")}
                />
              )}
            </button>
          )}
        </ActionPane>
      )}
    </>
  );
};

export default SelectedItemsPane;
