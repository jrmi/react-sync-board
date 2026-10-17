import useMainStore from "./store/main";

const identity = (state) => state;

const useBoardState = (selector = identity) =>
  useMainStore((state) => selector(state.boardState));

export default useBoardState;
