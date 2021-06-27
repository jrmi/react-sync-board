export const media2Url = (value, apiBase) => {
  if (value && typeof value === "object") {
    switch (value.type) {
      case "local":
        return `${apiBase}/${value.content}`;
      case "external":
        return value.content;
      case "dataUrl":
        return value.content;
      case "empty":
        return null;
      default:
      // do nothing
    }
  }
  return value;
};

export default { media2Url };
