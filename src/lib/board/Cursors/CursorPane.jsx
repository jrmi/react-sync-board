import React from "react";
import Cursor from "./Cursor";
import { useSyncedUsers } from "@/users/store";
import useDim from "@/board/useDim";
import { isPointInsideRect } from "@/utils";
import useMainStore from "@/board/store/main";

const CursorPane = ({ children }) => {
  const [getConfiguration] = useMainStore((state) => [state.getConfiguration]);
  const { fromWrapperToBoard, fromBoardToWrapper } = useDim();
  const [currentUser, localUsers, cursors, usersById] = useSyncedUsers(
    (state) => [
      state.getUser(),
      state.getLocalUsers(),
      state.cursors,
      state.users,
    ]
  );
  const [moveCursor, removeCursor] = useSyncedUsers((state) => [
    state.moveCursor,
    state.removeCursor,
  ]);

  const { boardWrapperRect } = getConfiguration();

  const onMouseMove = ({ clientX, clientY }) => {
    const [x, y] = fromWrapperToBoard(
      clientX - boardWrapperRect.left,
      clientY - boardWrapperRect.top
    );
    moveCursor(currentUser.id, { x, y });
  };

  const onLeave = () => {
    removeCursor(currentUser.id);
  };

  // Prevent race condition when removing user
  const currentCursors = localUsers.reduce((acc, user) => {
    if (user.id !== currentUser.id && cursors[user.id]) {
      acc[user.id] = cursors[user.id];
    }
    return acc;
  }, {});

  return (
    <div onPointerMove={onMouseMove} onPointerLeave={onLeave}>
      {children}
      {Object.entries(currentCursors).map(([userId, pos]) => {
        const [x, y] = fromBoardToWrapper(pos.x, pos.y);
        const coord = {
          x: x + boardWrapperRect.left,
          y: y + boardWrapperRect.top,
        };
        if (!isPointInsideRect(coord, boardWrapperRect)) {
          return null;
        }
        return (
          <Cursor
            key={userId}
            pos={coord}
            text={usersById[userId].name}
            color={usersById[userId].color}
          />
        );
      })}
    </div>
  );
};

export default CursorPane;
