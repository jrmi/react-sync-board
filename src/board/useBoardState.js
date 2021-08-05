import { useRecoilValue } from "recoil";

import { BoardStateAtom } from "./atoms";

const useBoardState = () => useRecoilValue(BoardStateAtom);

export default useBoardState;
