import React from "react";
import useMainStore from "../store/main";

const useItemInteraction = (interaction) => {
  const [registerInStore, unregister, callInteractions] = useMainStore(
    ({ register, unregister, callInteractions }) => [
      register,
      unregister,
      callInteractions,
    ]
  );

  const register = React.useCallback(
    (callback) => {
      registerInStore(interaction, callback);
      return () => {
        unregister(interaction, callback);
      };
    },
    [interaction, registerInStore, unregister]
  );

  const call = React.useCallback(
    (items) => {
      callInteractions(interaction, items);
    },
    [callInteractions, interaction]
  );

  return { register, call };
};

export default useItemInteraction;
