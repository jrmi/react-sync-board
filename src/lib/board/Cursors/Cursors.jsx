import React from "react";

import Cursor from "./Cursor";
import { useSyncedUsers } from "@/users/store";

const Cursors = () => {
  const [currentUser, cursors, usersById] = useSyncedUsers((state) => [
    state.getUser(),
    state.cursors,
    state.users,
  ]);

  // Prevent race condition when removing user
  const currentCursors = Object.values(usersById).reduce((acc, user) => {
    if (user.id !== currentUser.id && cursors[user.id]) {
      acc[user.id] = cursors[user.id];
    }
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(currentCursors).map(([userId, pos]) => (
        <Cursor
          key={userId}
          pos={pos}
          text={usersById[userId].name}
          color={usersById[userId].color}
        />
      ))}
    </div>
  );
};

export default Cursors;
