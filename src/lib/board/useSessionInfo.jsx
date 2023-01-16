import { useSyncedStore } from "./store/synced";

const useSessionInfo = () => {
  const [getSessionInfo, setSessionInfo, updateSessionInfo, sessionInfo] =
    useSyncedStore((state) => [
      state.getSessionInfo,
      state.setSessionInfo,
      state.updateSessionInfo,
      state.session,
    ]);

  return { getSessionInfo, setSessionInfo, sessionInfo, updateSessionInfo };
};

export default useSessionInfo;
