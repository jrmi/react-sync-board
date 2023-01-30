import React from "react";
import { useSyncedUsers } from "./store";

const useUsers = () => {
  const [currentUser, userMap, updateCurrentUser] = useSyncedUsers((state) => [
    state.getUser(),
    state.users,
    state.updateCurrentUser,
  ]);

  const users = React.useMemo(() => Object.values(userMap), [userMap]);

  const localUsers = React.useMemo(() => {
    const { space: currentUserSpace } = currentUser;
    return users.filter(({ space }) => space === currentUserSpace);
  }, [currentUser, users]);

  return { currentUser, updateCurrentUser, users, localUsers };
};

export default useUsers;
