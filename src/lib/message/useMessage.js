import React from "react";

import { useSyncedMessage } from "@/message/store";
import { useSyncedUsers } from "@/users/store";

const noop = () => {};

const useMessage = (onMessage = noop) => {
  const currentUser = useSyncedUsers((state) => state.getUser());
  const [messages, setMessages, sendMessage] = useSyncedMessage((state) => [
    state.messages,
    state.setMessages,
    state.sendMessage,
  ]);

  React.useEffect(() => {
    // React on new message
    if (messages.length) {
      onMessage();
    }
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
