import React from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";
import { BoardWrapper, Board, BoardGridOverlay, useItemActions, useBoardConfig, useItemInteraction } from "../../src/lib/index.js";
import useMainStore from "../../src/lib/board/store/main.jsx";
const socket = io("http://localhost:4099", { transports: ["websocket"] });
const itemTemplates = { token: { component: () => <div style={{ width: 40, height: 30, background: "coral" }} /> } };
function Harness() {
  const actions = useItemActions();
  const [board, setBoard] = useBoardConfig();
  const main = useMainStore(s => s);
  const { register } = useItemInteraction("place");
  React.useEffect(() => register(ids => { window.placements.push(actions.getItems(ids)); }), [register, actions.getItems]);
  window.placements ||= [];
  window.gridTest = { ...actions, board, setBoard, main };
  return <Board itemTemplates={itemTemplates}><BoardGridOverlay preview={window.gridPreview || false} /></Board>;
}
createRoot(document.getElementById("root")).render(<BoardWrapper socket={socket} room="grid-regression" session="grid-regression"><Harness /></BoardWrapper>);
