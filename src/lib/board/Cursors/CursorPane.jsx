import Cursors from "./Cursors";
import useMainStore from "@/board/store/main";
import { useSyncedUsers } from "@/users/store";

const CursorPane = ({ children }) => {
  const currentUser = useSyncedUsers((state) => state.getUser());
  const [moveCursor, removeCursor] = useSyncedUsers((state) => [
    state.moveCursor,
    state.removeCursor,
  ]);
  const [getConfiguration, getBoardState] = useMainStore((state) => [
    state.getConfiguration,
    state.getBoardState,
  ]);

  const onMouseMove = ({ clientX, clientY }) => {
    const { scale, translateX, translateY } = getBoardState();
    const {
      boardWrapperRect: { left, top },
    } = getConfiguration();
    const newPos = {
      x: (clientX - left - translateX) / scale,
      y: (clientY - top - translateY) / scale,
    };
    moveCursor(currentUser.id, newPos);
  };

  const onLeave = () => {
    removeCursor(currentUser.id);
  };

  return (
    <div onPointerMove={onMouseMove} onPointerLeave={onLeave}>
      {children}
      <Cursors />
    </div>
  );
};

export default CursorPane;
