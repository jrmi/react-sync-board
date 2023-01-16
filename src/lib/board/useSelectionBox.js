import useSelection from "./store/selection";

const useSelectionBox = () => useSelection((state) => state.selectionBox);

export default useSelectionBox;
