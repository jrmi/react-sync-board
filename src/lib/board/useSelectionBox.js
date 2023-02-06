import useMainStore from "./store/main";

const useSelectionBox = () => {
  const [selectionBox] = useMainStore((state) => [state.selectionBox]);
  return selectionBox;
};

export default useSelectionBox;
