import { useState } from 'react';
import { OneView } from './stories/Main.jsx';
import { nanoid } from 'nanoid';

function App() {
  const [room] = useState(nanoid());
  const [session] = useState(nanoid());
  return (
    <div className='App'>
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
