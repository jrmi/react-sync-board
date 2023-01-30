/**
 * Check if element or parent has className.
 * @param {DOMElement} element
 * @param {string} className
 */
export const hasClass = (element, className) =>
  element.classList && element.classList.contains(className);

export const insideClass = (element, className) => {
  if (hasClass(element, className)) {
    return element;
  }
  if (!element.parentNode) {
    return false;
  }
  return insideClass(element.parentNode, className);
};

export const getParent = (initialElem, selector) => {
  for (
    let elem = initialElem;
    elem && elem !== document;
    elem = elem.parentNode
  ) {
    if (selector(elem)) return elem;
  }
  return null;
};

export const isPointInsideRect = (point, rect) =>
  point.x > rect.left &&
  point.x < rect.left + rect.width &&
  point.y > rect.top &&
  point.y < rect.top + rect.height;

export const isItemInsideElement = (itemElement, otherElem) => {
  const rect = otherElem.getBoundingClientRect();
  const fourElem = Array.from(itemElement.querySelectorAll(".corner"));

  return fourElem.every((corner) => {
    const { top: y, left: x } = corner.getBoundingClientRect();
    return isPointInsideRect({ x, y }, rect);
  });
};

export const getItemElem = (wrapper, itemId) => {
  const elems = wrapper.getElementsByClassName(`item ${itemId}`);
  const elem = elems[0];
  if (!elem) {
    // eslint-disable-next-line no-console
    console.error(`Missing item ${itemId}`);
  }
  return elem;
};

export const getIdFromElem = (elem) => {
  const value = elem?.dataset?.id;
  if (!value) {
    // eslint-disable-next-line no-console
    console.error(
      "getIdFromElem call fails",
      elem,
      JSON.stringify(elem?.dataset),
      elem?.dataset?.id
    );
  }
  return value;
};

export const getItemBoundingBox = (items, wrapper = document) => {
  const result = items.reduce((prev, itemId) => {
    const elem = getItemElem(wrapper, itemId);

    if (!elem) return null;

    const { left, right, top, bottom } = elem.getBoundingClientRect();

    let boundingBox;

    if (!prev) {
      boundingBox = {
        left,
        top,
        right,
        bottom,
      };
    } else {
      boundingBox = prev;
    }

    boundingBox.left = Math.min(left, boundingBox.left);
    boundingBox.top = Math.min(top, boundingBox.top);
    boundingBox.right = Math.max(right, boundingBox.right);
    boundingBox.bottom = Math.max(bottom, boundingBox.bottom);

    return boundingBox;
  }, null);

  if (!result) {
    return result;
  }

  result.width = result.right - result.left;
  result.height = result.bottom - result.top;

  return result;
};

export const snapToGrid = (
  { x, y, width, height },
  { type = "grid", size = 1, offset = { x: 0, y: 0 } }
) => {
  const [centerX, centerY] = [
    x + width / 2 - offset.x,
    y + height / 2 - offset.y,
  ];

  let newX;
  let newY;
  let sizeX;
  let sizeY;
  let px1;
  let px2;
  let py1;
  let py2;
  let diff1;
  let diff2;
  const h = size / 1.1547;

  switch (type) {
    case "grid":
      newX = Math.round(centerX / size) * size;
      newY = Math.round(centerY / size) * size;
      break;
    case "hexH":
      sizeX = 2 * h;
      sizeY = 3 * size;
      px1 = Math.round(centerX / sizeX) * sizeX;
      py1 = Math.round(centerY / sizeY) * sizeY;

      px2 = px1 > centerX ? px1 - h : px1 + h;
      py2 = py1 > centerY ? py1 - 1.5 * size : py1 + 1.5 * size;

      diff1 = Math.hypot(...[px1 - centerX, py1 - centerY]);
      diff2 = Math.hypot(...[px2 - centerX, py2 - centerY]);

      if (diff1 < diff2) {
        newX = px1;
        newY = py1;
      } else {
        newX = px2;
        newY = py2;
      }
      break;
    case "hexV":
      sizeX = 3 * size;
      sizeY = 2 * h;
      px1 = Math.round(centerX / sizeX) * sizeX;
      py1 = Math.round(centerY / sizeY) * sizeY;

      px2 = px1 > centerX ? px1 - 1.5 * size : px1 + 1.5 * size;
      py2 = py1 > centerY ? py1 - h : py1 + h;

      diff1 = Math.hypot(...[px1 - centerX, py1 - centerY]);
      diff2 = Math.hypot(...[px2 - centerX, py2 - centerY]);

      if (diff1 < diff2) {
        newX = px1;
        newY = py1;
      } else {
        newX = px2;
        newY = py2;
      }
      break;
    default:
      newX = x + width / 2;
      newY = y + height / 2;
  }

  return {
    x: newX + offset.x - width / 2,
    y: newY + offset.y - height / 2,
  };
};

const colors = [
  "#037758",
  "#99092a",
  "#067070",
  "#c6650f",
  "#008726",
  "#3d7004",
  "#348402",
  "#057f58",
  "#b58612",
  "#c44c01",
  "#0a7704",
  "#0e910e",
  "#027377",
  "#c99e02",
  "#054160",
  "#157a01",
  "#b10de2",
  "#0d6289",
  "#bc5d03",
  "#ba0cd1",
  "#d39f10",
  "#0c4c7a",
  "#460782",
  "#a51f10",
  "#cecb10",
  "#9b0943",
  "#607f0c",
  "#007a4b",
  "#bf0daa",
  "#af0ad8",
];

export const getRandomColor = () =>
  colors[Math.floor(Math.random() * colors.length)];

const debug = false;

export const syncMiddleware =
  ({ wire, storeName, noSync = [], defaultValue }, config) =>
  (set, get, api) => {
    set({ ready: false });
    const unsubs = [];
    const init = async () => {
      try {
        // Try to get the initial value from a peer
        const newValue = await wire.call(`${storeName}_getValue`);
        debug && console.log("init from peer with value", newValue);
        set((state) => ({ ...state, ...newValue }));
      } catch {
        //console.log(`No peers for ${storeName}...`);
        if (defaultValue !== undefined) {
          set(defaultValue);
        }
      }
      unsubs.push(
        await wire.register(
          `${storeName}_getValue`,
          () => {
            return Object.fromEntries(
              Object.entries(get()).filter(
                ([key, value]) =>
                  typeof value !== "function" && !noSync.includes(key)
              )
            );
          },
          { invoke: "first" }
        )
      );
      // Register the sync callback
      unsubs.push(
        wire.subscribe(`${storeName}_call`, ([methodName, args]) => {
          debug && console.log("receive", methodName, args);
          previousFn[methodName](...args);
        })
      );
      set({ ready: true });
    };
    init();

    const result = config(set, get, api);
    const previousFn = { ...result };

    const syncResult = Object.fromEntries(
      // Send the update message on all method calls
      Object.entries(result).map(([key, fn]) => {
        if (
          typeof fn === "function" &&
          !key.startsWith("get") &&
          !noSync.includes(key)
        ) {
          const newFn = (...args) => {
            debug && console.log("call", key, args);
            const result = fn(...args);
            wire.publish(`${storeName}_call`, [key, args]);
            return result;
          };
          return [key, newFn];
        }
        return [key, fn];
      })
    );

    syncResult.unsub = () => {
      unsubs.forEach((unsub) => unsub());
    };

    return syncResult;
  };
