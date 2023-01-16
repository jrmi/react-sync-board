import useMainStore from "./store/main";

const useBoardState = () => useMainStore((state) => state.boardState);

export default useBoardState;
