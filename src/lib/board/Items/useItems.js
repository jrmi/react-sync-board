import { useRecoilValue } from "recoil";
import { AllItemsSelector } from "../atoms";

const useItemList = () => {
  const items = useRecoilValue(AllItemsSelector);
  return items;
};

export default useItemList;
