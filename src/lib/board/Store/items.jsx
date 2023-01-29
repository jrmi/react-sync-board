import React, { useContext } from "react";
import { createStore, useStore } from "zustand";

import useWire from "@/hooks/useWire";
import { syncMiddleware } from "@/utils";

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
      console.log(state.itemIds);
      const newValue = [...state.itemIds];
      newValue.splice(position, 1);
      console.log(state.newValue);
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
  initialized: false,
  isInit: () => get().initialized,
  removeItemsById: (itemIdsToRemove) =>
    set((state) => {
      return {
        itemIds: state.itemIds.filter(({ id }) => !itemIdsToRemove.include(id)),
        items: Object.fromEntries(
          Object.entries(state.items).filter(
            ([id]) => !itemIdsToRemove.include(id)
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
      initialized: true,
    }),
  insertItems: (newItems, beforeId) =>
    set((state) => {
      let newItemIds;
      if (beforeId) {
        const insertAt = state.itemIds.findIndex((id) => id === beforeId);
        newItemIds = [...state.itemIds];
        newItemIds.splice(insertAt, 0, ...newItems.map(({ id }) => id));
      } else {
        newItemIds = [...state.itemIds, ...newItems];
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

export const ItemStoreProvider = ({ storeName, children }) => {
  const { wire } = useWire("room");
  const [store] = React.useState(
    createStore(
      syncMiddleware(
        (...args) => ({
          ...itemsStore(...args),
          ...itemIdsStore(...args),
          ...commonStore(...args),
        }),
        wire,
        storeName
      )
    )
  );

  return <Context.Provider value={store}>{children}</Context.Provider>;
};

export const useSyncedItems = (selector) => {
  const store = useContext(Context);
  return useStore(store, selector);
};
