const getPlatform = () => {
  if (typeof navigator === "undefined") return "";

  return (
    navigator.userAgentData?.platform ||
    navigator.platform ||
    navigator.userAgent ||
    ""
  );
};

// This is only a platform heuristic, not hardware detection: a Mac may still
// have a mouse and another platform may still have a trackpad.
export const getDefaultNavigationMode = (platform = getPlatform()) =>
  /mac/i.test(platform) ? "trackpad" : "wheel";
