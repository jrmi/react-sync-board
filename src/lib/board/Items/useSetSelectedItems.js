import useMainStore from "../store/main";

const useSetSelectedItems = () => {
  const [setSelection] = useMainStore((state) => [state.setSelection]);
  return setSelection;
};

export default useSetSelectedItems;
