import { useState } from "react";
import {
  OneView,
  TwoView,
  OneViewPerf,
  OneViewWithCustomBoardElements,
  OneViewWithRoom,
} from "./example/Main.jsx";

// eslint-disable-next-line no-unused-vars
const TopBar = ({
  view,
  setView,
}: {
  view: string;
  setView: (viewName: string) => void;
}) => {
  const views = [
    ["one", "Board"],
    ["style", "Styled board"],
    ["custom", "Custom elements"],
    ["two", "Two views"],
    ["perf", "Performance"],
  ];

  return (
    <header className="top-bar">
      <div className="brand">
        <img className="brand-mark" src="/favicon.svg" alt="" />
        <div>
          <p className="eyebrow">Component playground</p>
          <h1>ReactSyncBoard</h1>
        </div>
      </div>
      <nav aria-label="Demo views">
        {views.map(([name, label]) => (
          <button
            className={view === name ? "active" : undefined}
            aria-pressed={view === name}
            key={name}
            onClick={() => setView(name)}
          >
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
};

function App() {
  const [room] = useState("test_room");
  const [session] = useState("test_session");
  const [view, setView] = useState("one");
  const [interaction, setInteraction] = useState({
    navigationMode: "auto",
  });

  return (
    <div className="App">
      <TopBar view={view} setView={setView} />
      <main className="demo-content">
        {view === "one" && (
          <OneView
            interaction={interaction}
            setInteraction={setInteraction}
            showResizeHandle={true}
            hideMenu={false}
            room={`${room}_one`}
            session={`${session}_one`}
          />
        )}
        {view === "style" && (
          <OneViewWithRoom
            interaction={interaction}
            setInteraction={setInteraction}
            showResizeHandle={false}
            hideMenu={false}
            room={`${room}_one`}
            session={`${session}_one`}
          />
        )}
        {view === "custom" && (
          <OneViewWithCustomBoardElements
            interaction={interaction}
            setInteraction={setInteraction}
            showResizeHandle={false}
            hideMenu={false}
            room={`${room}_custom`}
            session={`${session}_custom`}
          />
        )}
        {view === "two" && (
          <TwoView
            interaction={interaction}
            setInteraction={setInteraction}
            showResizeHandle={false}
            hideMenu={false}
            room={`${room}_two`}
            session={`${session}_two`}
          />
        )}
        {view === "perf" && (
          <OneViewPerf
            interaction={interaction}
            setInteraction={setInteraction}
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
