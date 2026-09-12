import { useState } from "react";
import {
  OneView,
  TwoView,
  OneViewPerf,
  OneViewWithCustomBoardElements,
  OneViewWithRoom,
} from "./example/Main.jsx";

// eslint-disable-next-line no-unused-vars
const TopBar = ({ setView }: { setView: (viewName: string) => void }) => {
  return (
    <header className="top-bar">
      <h1 style={{ padding: 0, margin: 0 }}>ReactSyncBoard demo</h1>
      <nav aria-label="Demo views">
        <button onClick={() => setView("one")}>One view</button>
        <button onClick={() => setView("style")}>One view with style</button>
        <button onClick={() => setView("custom")}>One view with custom</button>
        <button onClick={() => setView("two")}>Two views</button>
        <button onClick={() => setView("perf")}>Perf</button>
      </nav>
    </header>
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
      <main className="demo-content">
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
      </main>
    </div>
  );
}

export default App;
