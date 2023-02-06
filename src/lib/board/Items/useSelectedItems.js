import useMainStore from "../store/main";

const useSelectedItems = () => {
  const [selection] = useMainStore((state) => [state.selection]);
  return selection;
};

export default useSelectedItems;
