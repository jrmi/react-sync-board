import useMainStore from "./store/main";

const useBoardState = () => {
  const [boardState] = useMainStore((state) => [state.boardState]);
  return boardState;
};

export default useBoardState;
