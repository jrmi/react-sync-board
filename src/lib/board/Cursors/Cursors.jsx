import React from "react";

import Cursor from "./Cursor";
import { useSyncedUsers } from "@/users/store";

const Cursors = () => {
  const [currentUser, localUsers, cursors, usersById] = useSyncedUsers(
    (state) => [
      state.getUser(),
      state.getLocalUsers(),
      state.cursors,
      state.users,
    ]
  );

  // Prevent race condition when removing user
  const currentCursors = localUsers.reduce((acc, user) => {
    if (user.id !== currentUser.id && cursors[user.id]) {
      acc[user.id] = cursors[user.id];
    }
    return acc;
  }, {});

  return (
    <>
      {Object.entries(currentCursors).map(([userId, pos]) => (
        <Cursor
          key={userId}
          pos={pos}
          text={usersById[userId].name}
          color={usersById[userId].color}
        />
      ))}
    </>
  );
};

export default Cursors;
