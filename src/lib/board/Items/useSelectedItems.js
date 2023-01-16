import useSelection from "../store/selection";

const useSelectedItems = () => useSelection((state) => state.selection);

export default useSelectedItems;
