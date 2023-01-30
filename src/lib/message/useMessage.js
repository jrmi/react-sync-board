import React from "react";

import { useUsers } from "@/users";
import { useSyncedMessage } from "./store";

const noop = () => {};

const useMessage = (onMessage = noop) => {
  const { currentUser } = useUsers();
  const [messages, setMessages, sendMessage] = useSyncedMessage(
    ({ messages, setMessages, sendMessage }) => [
      messages,
      setMessages,
      sendMessage,
    ]
  );

  React.useEffect(() => {
    // React on new message
    onMessage();
  }, [messages, onMessage]);

  const sendMessageWithUser = React.useCallback(
    (messageContent) => {
      sendMessage(currentUser, messageContent);
    },
    [currentUser, sendMessage]
  );

  return { messages, setMessages, sendMessage: sendMessageWithUser };
};

export default useMessage;
