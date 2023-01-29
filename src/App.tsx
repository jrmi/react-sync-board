import { useState } from "react";
import { OneView } from "./example/Main.jsx";
import { nanoid } from "nanoid";

function App() {
  //const [room] = useState(nanoid());
  //const [session] = useState(nanoid());
  const [room] = useState("test_room");
  const [session] = useState("test_session");
  return (
    <div className="App">
      <OneView
        moveFirst={false}
        showResizeHandle={false}
        hideMenu={false}
        room={room}
        session={session}
      />
    </div>
  );
}

export default App;
