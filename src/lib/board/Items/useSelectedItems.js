import { useRecoilValue } from "recoil";

import { SelectedItemsAtom } from "../atoms";

const useSelectedItems = () => useRecoilValue(SelectedItemsAtom);

export default useSelectedItems;
