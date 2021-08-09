import { nanoid } from "nanoid";
import { atom } from "recoil";

export const persistUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};

const colors = [
  "#037758",
  "#99092a",
  "#067070",
  "#c6650f",
  "#008726",
  "#3d7004",
  "#348402",
  "#057f58",
  "#b58612",
  "#c44c01",
  "#0a7704",
  "#0e910e",
  "#027377",
  "#c99e02",
  "#054160",
  "#157a01",
  "#b10de2",
  "#0d6289",
  "#bc5d03",
  "#ba0cd1",
  "#d39f10",
  "#0c4c7a",
  "#460782",
  "#a51f10",
  "#cecb10",
  "#9b0943",
  "#607f0c",
  "#007a4b",
  "#bf0daa",
  "#af0ad8",
];

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

// TODO remove user persistence
export const getUser = () => {
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

export const userAtom = atom({
  key: "user",
  default: getUser(),
});

export const usersAtom = atom({
  key: "users",
  default: [],
});
