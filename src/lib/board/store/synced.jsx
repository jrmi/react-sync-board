import React, { useContext } from "react";
import { createStore, useStore } from "zustand";

import useWire from "@/hooks/useWire";
import { syncMiddleware } from "@/utils";
import { shallow } from "zustand/shallow";

const Context = React.createContext();

const itemsStore = (set, get) => ({
  items: {},
  getItems: () => get().items,
  setItems: (newItems) => set({ items: newItems }),
  updateItems: (toUpdate) =>
    set((state) => ({ items: { ...state.items, ...toUpdate } })),
  moveItems: (itemIds, posDelta) =>
    set(({ items: prevItems }) => {
      const newItems = { ...prevItems };
      itemIds.forEach((id) => {
        const item = prevItems[id];

        if (!item) {
          return;
        }

        newItems[id] = {
          ...item,
          x: (item.x || 0) + posDelta.x,
          y: (item.y || 0) + posDelta.y,
          moving: true,
        };
      });
      return { items: newItems };
    }),
});

const itemIdsStore = (set, get) => ({
  itemIds: [],
  setItemIds: (newValue) => set({ itemIds: newValue }),
  getItemIds: () => get().itemIds,
  insert: (position, value) =>
    set((state) => {
      const newValue = [...state.itemIds];
      newValue.splice(position, 0, value);
      return { itemIds: newValue };
    }),
  remove: (position) =>
    set((state) => {
      const newValue = [...state.itemIds];
      newValue.splice(position, 1);
      return { itemIds: newValue };
    }),
  updateItemIds: (position, value) =>
    set((state) => {
      const newValue = [...state.itemIds];
      newValue[position] = value;
      return { items: newValue };
    }),
  updateManyItemIds: (toUpdate) =>
    set((state) => {
      return {
        items: state.itemIds.map((value, index) => {
          if (toUpdate[index] !== undefined) {
            return toUpdate[index];
          } else {
            return value;
          }
        }),
      };
    }),
});

const commonStore = (set, get) => ({
  removeItemsById: (itemIdsToRemove) =>
    set((state) => {
      return {
        itemIds: state.itemIds.filter((id) => !itemIdsToRemove.includes(id)),
        items: Object.fromEntries(
          Object.entries(state.items).filter(
            ([id]) => !itemIdsToRemove.includes(id)
          )
        ),
      };
    }),
  getItemList: () => {
    const items = get().items;
    return get().itemIds.map((id) => items[id]);
  },
  setItemList: (itemList) =>
    set({
      items: Object.fromEntries(itemList.map((item) => [item.id, item])),
      itemIds: itemList.map(({ id }) => id),
    }),
  insertItems: (newItems, beforeId) =>
    set((state) => {
      let newItemIds;
      const itemIdsToAdd = newItems.map(({ id }) => id);
      if (beforeId) {
        const insertAt = state.itemIds.findIndex((id) => id === beforeId);
        newItemIds = [...state.itemIds];
        newItemIds.splice(insertAt, 0, ...itemIdsToAdd);
      } else {
        newItemIds = [...state.itemIds, ...itemIdsToAdd];
      }

      return {
        items: {
          ...state.items,
          ...Object.fromEntries(newItems.map((item) => [item.id, item])),
        },
        itemIds: newItemIds,
      };
    }),
});

const boardStore = (set, get) => ({
  boardConfig: {},
  getBoardConfig: () => get().boardConfig,
  setBoardConfig: (newBoardConfig) => set({ boardConfig: newBoardConfig }),
  updateBoardConfig: (toUpdate) =>
    set((state) => ({ boardConfig: { ...state.boardConfig, ...toUpdate } })),
});

const sessionInfoStore = (set, get) => ({
  session: {},
  getSessionInfo: () => get().session,
  setSessionInfo: (newSession) => set({ session: newSession }),
  updateSessionInfo: (toUpdate) =>
    set((state) => ({ session: { ...state.session, ...toUpdate } })),
});

export const SyncedStoreProvider = ({ storeName, children, defaultValue }) => {
  const { wire } = useWire("room");
  const [ready, setReady] = React.useState(false);
  const [store] = React.useState(() =>
    createStore(
      syncMiddleware({ wire, storeName, defaultValue }, (...args) => ({
        ...itemsStore(...args),
        ...itemIdsStore(...args),
        ...commonStore(...args),
        ...boardStore(...args),
        ...sessionInfoStore(...args),
      }))
    )
  );

  React.useEffect(() => {
    let mounted = true;
    // Wait for ready event
    const unsubscribe = store.subscribe((newValue) => {
      if (newValue.ready) {
        // No need to listen anymore
        unsubscribe();
        if (mounted) {
          setReady(true);
        }
      }
    });
    () => {
      mounted = false;
      unsubscribe();
    };
  }, [store]);

  if (!ready) {
    return null;
  }

  return <Context.Provider value={store}>{children}</Context.Provider>;
};

export const useSyncedStore = (selector, equalityFn) => {
  const store = useContext(Context);
  return useStore(store, selector, equalityFn ? equalityFn : shallow);
};
