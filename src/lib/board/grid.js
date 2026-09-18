export const gridTypes = new Set(["grid", "hexH", "hexV"]);

const finite = (value, fallback = 0) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;

export const normalizeGrid = (grid) => {
  if (!gridTypes.has(grid?.type)) return null;
  const size = finite(grid.size, 1);
  return {
    ...grid,
    size: size > 0 ? size : 1,
    offset: { x: finite(grid.offset?.x), y: finite(grid.offset?.y) },
    show: grid.show !== false,
    color: grid.color || "#000000",
    opacity: Math.max(0, Math.min(1, finite(grid.opacity ?? 0.2, 0.2))),
  };
};

export const resolveGridConfig = (boardGrid, itemGrid) =>
  normalizeGrid(itemGrid) || normalizeGrid(boardGrid);

// An inherited item's display preference may override the board's visibility
// without changing the grid used for placement.
export const resolveDisplayGrid = (boardGrid, itemGrid) => {
  const grid = resolveGridConfig(boardGrid, itemGrid);
  const itemHasCustomGrid = normalizeGrid(itemGrid);
  if (!grid || itemHasCustomGrid || typeof itemGrid?.show !== "boolean") {
    return grid;
  }
  return { ...grid, show: itemGrid.show };
};

// Board units, independent of zoom/rotation. Include selection borders so the
// measured center is the visible center both before and after selection.
export const measureGridItem = (element) => {
  const style = getComputedStyle(element);
  const dimension = (axis, start, end, fallback) => {
    let value = parseFloat(style[axis]);
    if (!Number.isFinite(value)) return fallback;
    if (style.boxSizing !== "border-box") {
      value +=
        (parseFloat(style[`padding${start}`]) || 0) +
        (parseFloat(style[`padding${end}`]) || 0) +
        (parseFloat(style[`border${start}Width`]) || 0) +
        (parseFloat(style[`border${end}Width`]) || 0);
    }
    return value;
  };
  return {
    width: dimension("width", "Left", "Right", element.offsetWidth),
    height: dimension("height", "Top", "Bottom", element.offsetHeight),
  };
};

// A hex size is its circumradius; hexH has horizontal rows of centers.
export const gridGeometry = ({ type, size }) => {
  const h = (Math.sqrt(3) * size) / 2;
  return type === "grid"
    ? { width: size, height: size, centers: [[0, 0]] }
    : type === "hexH"
      ? {
          width: 2 * h,
          height: 3 * size,
          centers: [
            [0, 0],
            [h, 1.5 * size],
          ],
        }
      : {
          width: 3 * size,
          height: 2 * h,
          centers: [
            [0, 0],
            [1.5 * size, h],
          ],
        };
};

export const snapToGrid = (position, grid) => {
  const { x, y, width, height } = position;
  const normalized = normalizeGrid(grid);
  if (!normalized || ![x, y, width, height].every(Number.isFinite))
    return { x, y };
  const { offset } = normalized;
  const centerX = x + width / 2 - offset.x;
  const centerY = y + height / 2 - offset.y;
  const geometry = gridGeometry(normalized);
  let nearest;
  let distance = Infinity;
  for (const [originX, originY] of geometry.centers) {
    const cx =
      Math.round((centerX - originX) / geometry.width) * geometry.width +
      originX;
    const cy =
      Math.round((centerY - originY) / geometry.height) * geometry.height +
      originY;
    const candidateDistance = Math.hypot(cx - centerX, cy - centerY);
    if (candidateDistance < distance) {
      nearest = { x: cx + offset.x - width / 2, y: cy + offset.y - height / 2 };
      distance = candidateDistance;
    }
  }
  return nearest && Number.isFinite(nearest.x) && Number.isFinite(nearest.y)
    ? nearest
    : { x, y };
};
