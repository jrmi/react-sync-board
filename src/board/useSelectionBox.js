import { useRecoilValue } from "recoil";

import { SelectionBoxAtom } from "./atoms";

const useSelectionBox = () => useRecoilValue(SelectionBoxAtom);

export default useSelectionBox;
