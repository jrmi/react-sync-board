import { useState } from "react";
import {
  OneView,
  TwoView,
  OneViewPerf,
  OneViewWithCustomBoardElements,
  OneViewWithRoom,
} from "./example/Main.jsx";

const TopBar = ({ setView }: { setView: (viewName: string) => void }) => {
  return (
    <div
      className="top-bar"
      style={{
        height: "3rem",
        width: "100%",
        position: "fixed",
        top: 0,
        backgroundColor: "#999999",
        display: "flex",
      }}
    >
      <h1 style={{ padding: 0, margin: 0 }}>ReactSyncBoard demo</h1>
      <button onClick={() => setView("one")}>One view</button>
      <button onClick={() => setView("style")}>One view with style</button>
      <button onClick={() => setView("custom")}>One view with custom</button>
      <button onClick={() => setView("two")}>Two views</button>
      <button onClick={() => setView("perf")}>Perf</button>
    </div>
  );
};

function App() {
  const [room] = useState("test_room");
  const [session] = useState("test_session");
  const [view, setView] = useState("one");
  const [moveFirst, setMoveFirst] = useState(true);

  return (
    <div className="App">
      <TopBar setView={setView} />
      {view === "one" && (
        <OneView
          moveFirst={moveFirst}
          setMoveFirst={setMoveFirst}
          showResizeHandle={true}
          hideMenu={false}
          room={`${room}_one`}
          session={`${session}_one`}
        />
      )}
      {view === "style" && (
        <OneViewWithRoom
          moveFirst={moveFirst}
          setMoveFirst={setMoveFirst}
          showResizeHandle={false}
          hideMenu={false}
          room={`${room}_one`}
          session={`${session}_one`}
        />
      )}
      {view === "custom" && (
        <OneViewWithCustomBoardElements
          moveFirst={moveFirst}
          setMoveFirst={setMoveFirst}
          showResizeHandle={false}
          hideMenu={false}
          room={`${room}_custom`}
          session={`${session}_custom`}
        />
      )}
      {view === "two" && (
        <TwoView
          moveFirst={moveFirst}
          setMoveFirst={setMoveFirst}
          showResizeHandle={false}
          hideMenu={false}
          room={`${room}_two`}
          session={`${session}_two`}
        />
      )}
      {view === "perf" && (
        <OneViewPerf
          moveFirst={moveFirst}
          setMoveFirst={setMoveFirst}
          showResizeHandle={false}
          hideMenu={false}
          room={`${room}_perf`}
          session={`${session}_perf`}
        />
      )}
    </div>
  );
}

export default App;
