import { useState } from "react";
import { OneView, TwoView } from "./example/Main.jsx";

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
      <button onClick={() => setView("two")}>Two views</button>
    </div>
  );
};

function App() {
  const [room] = useState("test_room");
  const [session] = useState("test_session");
  const [view, setView] = useState("one");

  return (
    <div className="App">
      <TopBar setView={setView} />
      {view === "one" && (
        <OneView
          moveFirst={false}
          showResizeHandle={false}
          hideMenu={false}
          room={room}
          session={session}
        />
      )}
      {view === "two" && (
        <TwoView
          moveFirst={false}
          showResizeHandle={false}
          hideMenu={false}
          room={room}
          session={session}
        />
      )}
    </div>
  );
}

export default App;
