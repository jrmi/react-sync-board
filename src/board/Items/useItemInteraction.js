import React from "react";
import { useSetRecoilState, useRecoilCallback } from "recoil";

import { ItemInteractionsAtom } from "../atoms";

const useItemInteraction = (interaction) => {
  const setInteractions = useSetRecoilState(ItemInteractionsAtom);

  const register = React.useCallback(
    (callback) => {
      setInteractions((prev) => {
        const newInter = Array.isArray(prev[interaction])
          ? [...prev[interaction], callback]
          : [callback];

        return {
          ...prev,
          [interaction]: newInter,
        };
      });
      return () => {
        setInteractions((prev) => ({
          ...prev,
          [interaction]: prev[interaction].filter((c) => c !== callback),
        }));
      };
    },
    [interaction, setInteractions]
  );

  const call = useRecoilCallback(
    ({ snapshot }) =>
      async (items) => {
        const itemInteractions = await snapshot.getPromise(
          ItemInteractionsAtom
        );
        if (!itemInteractions[interaction]) return;
        itemInteractions[interaction].forEach((callback) => {
          callback(items);
        });
      },
    [interaction]
  );

  return { register, call };
};

export default useItemInteraction;
