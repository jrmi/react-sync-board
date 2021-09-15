import React from "react";
import { nanoid } from "nanoid";
import { atom, useRecoilState, useRecoilCallback } from "recoil";

import dayjs from "dayjs";

import { useUsers } from "../users";
import useWire from "../hooks/useWire";

export const MessagesAtom = atom({
  key: "messages",
  default: [],
});

const generateMsg = ({ user: { name, uid, color }, content }) => {
  const newMessage = {
    type: "message",
    user: { name, uid, color },
    content,
    uid: nanoid(),
    timestamp: dayjs().toISOString(),
  };
  return newMessage;
};

export const parseMessage = (message) => {
  try {
    return {
      ...message,
      timestamp: dayjs(message.timestamp),
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("Discard message as it can't be decoded", e);
  }
  return null;
};

const noop = () => {};

const useMessage = (onMessage = noop, subscribeEvents = false) => {
  const [messages, setMessagesState] = useRecoilState(MessagesAtom);
  const { wire, isMaster } = useWire("board");
  const { currentUser } = useUsers();

  const getMessage = useRecoilCallback(
    ({ snapshot }) => async () => {
      const currentMessages = await snapshot.getPromise(MessagesAtom);
      return currentMessages;
    },
    []
  );

  const setMessages = React.useCallback(
    (newMessages) => {
      setMessagesState(newMessages.map((m) => parseMessage(m)));
    },
    [setMessagesState]
  );

  const initEvents = React.useCallback(
    (unsub) => {
      unsub.push(
        wire.subscribe("newMessage", (newMessage) => {
          setMessagesState((prevMessages) => [
            ...prevMessages,
            parseMessage(newMessage),
          ]);
          onMessage(newMessage);
        })
      );
      if (isMaster) {
        wire.register("getMessageHistory", getMessage).then((unregister) => {
          unsub.push(unregister);
        });
      } else {
        wire.call("getMessageHistory").then((messageHistory) => {
          setMessages(messageHistory);
        });
      }
      return unsub;
    },
    [wire, getMessage, isMaster, onMessage, setMessages, setMessagesState]
  );

  React.useEffect(() => {
    const unsub = [];

    if (subscribeEvents) {
      initEvents(unsub);
    }

    return () => {
      unsub.forEach((u) => u());
    };
  }, [initEvents, subscribeEvents]);

  const sendMessage = React.useCallback(
    (messageContent) => {
      const newMessage = generateMsg({
        user: currentUser,
        content: messageContent,
      });
      if (newMessage) wire.publish("newMessage", newMessage, true);
    },
    [wire, currentUser]
  );

  return { messages, setMessages, sendMessage };
};

export default useMessage;
