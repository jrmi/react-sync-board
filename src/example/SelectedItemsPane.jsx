import React from "react";
import styled from "styled-components";
import useTranslation from "@/hooks/useTranslation";

import SidePanel from "./ui/SidePanel";
import ItemFormFactory from "./ItemFormFactory";
import { useAvailableActions, useSelectedItems, useBoardState } from "@/";
import useActions from "./sample/useActions";
import { useItemActions } from "@/board/Items";

const ActionPane = styled.div`
  top: ${({ top }) => top};
  left: ${({ left }) => left};
  user-select: none;
  touch-action: none;
  position: absolute;
  display: flex;
  background-color: var(--color-blueGrey);
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  padding: 0.1em 0.5em;
  transition: opacity 100ms;
  opacity: ${({ hide }) => (hide ? 0 : 0.9)};
  
  box-shadow: 2px 2px 10px 0.3px rgba(0, 0, 0, 0.5);

  &:hover{
    opacity: 1;
  }

  & button{
    margin 0 4px;
    padding: 0em;
    height: 50px
  }
  & .button.icon-only{
    padding: 0em;
    opacity: 0.5;
  }
  & button.icon-only:hover{
    opacity: 1;
  }
  & .count{
    color: var(--color-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 0.8em;
  }
  & .number{
    font-size: 1.5em;
    line-height: 1em;
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
        if (
          availableActions.includes(key) &&
          e.key === shortcut &&
          showEdit === !!whileEdit
        ) {
          // here
          action(selectedItems);
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

      if (e.ctrlKey && filteredActions.length > 1) {
        // Use second action
        // here
        actionMap[filteredActions[1].name].action(selectedItems);
      } else if (filteredActions.length > 0) {
        // here
        actionMap[filteredActions[0].name].action(selectedItems);
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
        width="25%"
      >
        <CardContent>
          <ItemFormFactory ItemFormComponent={ItemFormComponent} />
        </CardContent>
      </SidePanel>
      {selectedItems.length && !hideMenu && (
        <ActionPane
          left="50%"
          top="5px"
          hide={
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
