import React from "react";
import { useRecoilValue, useRecoilState } from "recoil";
import { userAtom, usersAtom, persistUser, localUsersAtom } from "./atoms";

const useUsers = () => {
  const [currentUser, setCurrentUserState] = useRecoilState(userAtom);
  const users = useRecoilValue(usersAtom);
  const localUsers = useRecoilValue(localUsersAtom);

  const setCurrentUser = React.useCallback(
    (callbackOrUser) => {
      let callback = callbackOrUser;
      if (typeof callbackOrUser === "object") {
        callback = () => callbackOrUser;
      }
      setCurrentUserState((prevUser) => {
        const newUser = {
          ...callback(prevUser),
          id: prevUser.id,
          uid: prevUser.uid,
        };
        persistUser(newUser);
        return newUser;
      });
    },
    [setCurrentUserState]
  );

  return { currentUser, setCurrentUser, users, localUsers };
};

export default useUsers;
