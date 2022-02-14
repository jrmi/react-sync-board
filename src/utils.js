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

export const getItemBoundingBox = (items, wrapper = document) => {
  const result = items.reduce((prev, itemId) => {
    const elems = wrapper.getElementsByClassName(`item ${itemId}`);
    const elem = elems[0];

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
