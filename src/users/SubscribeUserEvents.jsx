import React from "react";
import { useDebouncedCallback } from "@react-hookz/web/esm";
import { useSetRecoilState, useRecoilState } from "recoil";

import { userAtom, usersAtom } from "./atoms";
import useWire from "../hooks/useWire";

const SubscribeUserEvents = () => {
  const usersRef = React.useRef([]);
  const setUsers = useSetRecoilState(usersAtom);
  const [currentUser, setCurrentUserState] = useRecoilState(userAtom);

  const { wire, isMaster, room: roomSpace } = useWire("room");

  React.useEffect(() => {
    setCurrentUserState((prevUser) => ({
      ...prevUser,
      id: wire.userId,
      space: roomSpace,
    }));
    return () => {
      setCurrentUserState((prevUser) => ({
        ...prevUser,
        id: wire.userId,
        space: null,
      }));
    };
  }, [wire.userId, roomSpace, setCurrentUserState]);

  React.useEffect(() => {
    if (!isMaster) {
      const onGetUserList = (userList) => {
        usersRef.current = userList;
        setUsers(userList);
      };

      wire.call("getUserList").then(onGetUserList, () => {
        // retry later
        setTimeout(() => {
          wire
            .call("getUserList")
            // eslint-disable-next-line no-console
            .then(onGetUserList, (error) => console.log(error));
        }, 1000);
      });
    }
  }, [wire, isMaster, setUsers]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedEmitUpdateUser = useDebouncedCallback(
    (newUser) => {
      wire.publish("userUpdate", newUser, true);
    },
    [wire],
    500
  );

  React.useEffect(() => {
    if (currentUser && currentUser.id) {
      debouncedEmitUpdateUser(currentUser);
    }
  }, [currentUser, debouncedEmitUpdateUser]);

  React.useEffect(() => {
    const unsub = [];
    if (isMaster) {
      wire
        .register("getUserList", () => usersRef.current)
        .then((unregister) => {
          unsub.push(unregister);
        });

      unsub.push(
        wire.subscribe("userUpdate", (user) => {
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
          wire.publish("updateUserList", usersRef.current);
        })
      );
    }
    unsub.push(
      wire.subscribe("userLeave", (userId) => {
        usersRef.current = usersRef.current.filter(({ id }) => id !== userId);
        setUsers(usersRef.current);
        if (isMaster) {
          wire.publish("updateUserList", usersRef.current);
        }
      })
    );
    unsub.push(
      wire.subscribe("updateUserList", (newList) => {
        usersRef.current = newList;
        setUsers(usersRef.current);
      })
    );

    return () => {
      unsub.forEach((u) => u());
    };
  }, [wire, isMaster, setUsers]);

  return null;
};

export default SubscribeUserEvents;
