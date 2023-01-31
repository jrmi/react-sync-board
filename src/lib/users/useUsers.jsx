import React from "react";

import { useSyncedUsers } from "@/users/store";

const useUsers = () => {
  const [isSpaceMaster, currentUser, userMap, updateCurrentUser, joinSpace] =
    useSyncedUsers((state) => [
      state.isSpaceMaster,
      state.getUser(),
      state.users,
      state.updateCurrentUser,
      state.joinSpace,
    ]);

  const users = React.useMemo(() => Object.values(userMap), [userMap]);

  const localUsers = React.useMemo(() => {
    const { space: currentUserSpace } = currentUser;
    return users.filter(({ space }) => space === currentUserSpace);
  }, [currentUser, users]);

  return {
    isSpaceMaster,
    currentUser,
    updateCurrentUser,
    users,
    localUsers,
    joinSpace,
  };
};

export default useUsers;
