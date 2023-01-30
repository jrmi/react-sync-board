import React, { useContext } from "react";
import { createStore, useStore } from "zustand";
import { getRandomColor } from "@/utils";
import { nanoid } from "nanoid";

import useWire from "@/hooks/useWire";
import { syncMiddleware } from "@/utils";

const Context = React.createContext();

export const persistUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const restoreUser = () => {
  if (localStorage.user) {
    // Add some mandatory info if missing
    const localUser = {
      name: "Player",
      color: getRandomColor(),
      uid: nanoid(),
      ...JSON.parse(localStorage.user),
    };
    // Id is given by server
    // delete localUser.id;
    persistUser(localUser);
    return localUser;
  }
  const newUser = {
    name: "Player",
    color: getRandomColor(),
    uid: nanoid(),
  };
  persistUser(newUser);
  return newUser;
};

const usersStore = (curentUserId) => (set, get) => ({
  users: {},
  getUser: () => get().users[curentUserId],
  getUsers: () => {
    return get().users;
  },
  getUserList: () => Object.values(get().users),
  getLocalUsers: () => {
    const { space: currentUserSpace } = get().users[curentUserId];
    return get()
      .getUserList()
      .filter(({ space }) => space === currentUserSpace);
  },
  addUser: (newUser) =>
    set((state) => ({ users: { ...state.users, [newUser.id]: newUser } })),
  updateCurrentUser: (toUpdate) => get().updateUser(curentUserId, toUpdate),
  updateUser: (userId, toUpdate) =>
    set((state) => {
      const newUser = {
        ...state.users[userId],
        ...toUpdate,
        id: userId,
        uid: state.users[userId].uid,
      };
      if (newUser.id === curentUserId) {
        persistUser(newUser);
      }
      return {
        users: {
          ...state.users,
          [userId]: newUser,
        },
      };
    }),
  removeUser: (userId) =>
    set((state) => {
      const newUsers = { ...state.users };
      delete newUsers[userId];
      return { users: newUsers };
    }),
});

const cursorsStore = (set) => ({
  cursors: {},
  moveCursor: (userId, newPos) =>
    set((state) => ({ cursors: { ...state.cursors, [userId]: newPos } })),
  removeCursor: (userId) =>
    set((state) => {
      const newCursors = { ...state.cursors };
      delete newCursors[userId];
      return { cursors: newCursors };
    }),
});

export const SyncedUsersProvider = ({ storeName, children }) => {
  const { wire, isMaster } = useWire("room");
  const [store, setStore] = React.useState(null);
  const storeRef = React.useRef(false);

  React.useEffect(() => {
    let mounted = true;
    const unsubs = [];
    if (!store && !storeRef.current) {
      storeRef.current = true;
      const init = () => {
        // Create store
        const localStore = createStore(
          syncMiddleware(
            { wire, storeName, noSync: ["updateCurrentUser"] },
            (...args) => ({
              ...usersStore(wire.userId)(...args),
              ...cursorsStore(...args),
            }),
            wire,
            storeName
          )
        );
        // Wait for ready event
        const unsubscribe = localStore.subscribe((newValue) => {
          if (newValue.ready) {
            // No need to listen more
            unsubscribe();
            if (mounted) {
              setStore(localStore);
            }
          }
        });
      };
      init();
      return () => {
        mounted = false;
        storeRef.current = false;
        unsubs.forEach((unsub) => unsub());
      };
    }
  }, [store, storeName, wire, wire.userId]);

  React.useEffect(() => {
    if (store) {
      store.getState().addUser({
        ...restoreUser(),
        id: wire.userId,
      });
      return () => {
        store.getState().removeUser(wire.userId);
      };
    }
  }, [isMaster, store, wire]);

  React.useEffect(() => {
    if (store) {
      // Listen for userLeave events
      const unsubscribe = wire.subscribe("userLeave", (userId) => {
        store.getState().removeUser(userId);
      });
      return () => {
        unsubscribe();
      };
    }
  }, [isMaster, store, wire]);

  React.useEffect(() => {
    if (isMaster && store) {
      // Set master
      store.getState().updateCurrentUser({ isMaster: isMaster });
    }
  }, [isMaster, store, wire]);

  if (!store) {
    return null;
  }

  return <Context.Provider value={store}>{children}</Context.Provider>;
};

export const useSyncedUsers = (selector) => {
  const store = useContext(Context);
  return useStore(store, selector);
};
