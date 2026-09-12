import React, { useContext } from "react";
import { createStore } from "zustand";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";
import { nanoid } from "nanoid";

import useWire from "@/hooks/useWire";
import { syncMiddleware } from "@/utils";

const Context = React.createContext();

const generateMsg = ({ user: { name, uid, color }, content }) => {
  const newMessage = {
    type: "message",
    user: { name, uid, color },
    content,
    uid: nanoid(),
    timestamp: new Date().toISOString(),
  };
  return newMessage;
};

const messageStore = (set, get) => ({
  messages: [],
  setMessages: (newMessages) =>
    set({
      messages: newMessages.map((m) => ({
        ...m,
        timestamp: Date.parse(m.timestamp),
      })),
    }),
  addMessage: (newMessage) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...newMessage, timestamp: Date.parse(newMessage.timestamp) },
      ],
    })),
  sendMessage: (user, content) => {
    const newMessage = generateMsg({
      user,
      content,
    });
    if (newMessage) get().addMessage(newMessage);
  },
});

export const SyncedMessageProvider = ({
  storeName,
  children,
  defaultValue = [],
}) => {
  const { wire } = useWire("room");
  const [store] = React.useState(() =>
    createStore(
      syncMiddleware(
        { wire, storeName, defaultValue, noSync: ["sendMessage"] },
        (...args) => ({
          ...messageStore(...args),
        })
      )
    )
  );

  return <Context.Provider value={store}>{children}</Context.Provider>;
};

export const useSyncedMessage = (selector) => {
  const store = useContext(Context);
  return useStoreWithEqualityFn(store, selector, shallow);
};
