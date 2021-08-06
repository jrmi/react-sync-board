import React from "react";
import debounce from "lodash.debounce";
import { useSetRecoilState, useRecoilState } from "recoil";

import { userAtom, usersAtom } from "./atoms";
import useC2C from "../hooks/useC2C";

const SubscribeUserEvents = () => {
  const usersRef = React.useRef([]);
  const setUsers = useSetRecoilState(usersAtom);
  const [currentUser, setCurrentUserState] = useRecoilState(userAtom);

  const { c2c, isMaster, room: roomSpace } = useC2C("room");

  React.useEffect(() => {
    setCurrentUserState((prevUser) => ({
      ...prevUser,
      id: c2c.userId,
      space: roomSpace,
    }));
    return () => {
      setCurrentUserState((prevUser) => ({
        ...prevUser,
        id: c2c.userId,
        space: null,
      }));
    };
  }, [c2c.userId, roomSpace, setCurrentUserState]);

  React.useEffect(() => {
    if (!isMaster) {
      const onGetUserList = (userList) => {
        usersRef.current = userList;
        setUsers(userList);
      };

      c2c.call("getUserList").then(onGetUserList, () => {
        // retry later
        setTimeout(() => {
          c2c
            .call("getUserList")
            // eslint-disable-next-line no-console
            .then(onGetUserList, (error) => console.log(error));
        }, 1000);
      });
    }
  }, [c2c, isMaster, setUsers]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedEmitUpdateUser = React.useCallback(
    debounce((newUser) => {
      c2c.publish("userUpdate", newUser, true);
    }, 500),
    [c2c]
  );

  React.useEffect(() => {
    if (currentUser && currentUser.id) {
      debouncedEmitUpdateUser(currentUser);
    }
  }, [currentUser, debouncedEmitUpdateUser]);

  React.useEffect(() => {
    const unsub = [];
    if (isMaster) {
      c2c
        .register("getUserList", () => usersRef.current)
        .then((unregister) => {
          unsub.push(unregister);
        });

      unsub.push(
        c2c.subscribe("userUpdate", (user) => {
          if (usersRef.current.find((u) => u.id === user.id)) {
            const newUsers = usersRef.current.map((u) =>
              u.id === user.id ? user : u
            );
            usersRef.current = newUsers;
          } else {
            const newUsers = [...usersRef.current, user];
            usersRef.current = newUsers;
          }
          setUsers(usersRef.current);
          c2c.publish("updateUserList", usersRef.current);
        })
      );
    }
    unsub.push(
      c2c.subscribe("userLeave", (userId) => {
        usersRef.current = usersRef.current.filter(({ id }) => id !== userId);
        setUsers(usersRef.current);
        if (isMaster) {
          c2c.publish("updateUserList", usersRef.current);
        }
      })
    );
    unsub.push(
      c2c.subscribe("updateUserList", (newList) => {
        usersRef.current = newList;
        setUsers(usersRef.current);
      })
    );

    return () => {
      unsub.forEach((u) => u());
    };
  }, [c2c, isMaster, setUsers]);

  return null;
};

export default SubscribeUserEvents;
