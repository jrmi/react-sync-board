import React from "react";

import MainView from "./MainView";
// import "./index.css";

export { default as MainView } from "./MainView";

export default { main: MainView };

export { default as useC2C } from "./hooks/useC2C";

export { default as useItemActions } from "./board/Items/useItemActions";
export { default as useItemInteraction } from "./board/Items/useItemInteraction";

export { ImageField } from "./mediaLibrary";

export { useUsers, UserList } from "./users";

window.React1 = React;
