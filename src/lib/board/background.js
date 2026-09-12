import { transformFrom, transformTo } from "@/utils";

const CSS_LENGTH_RE = /[+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?(?:px|%)/gi;

/**
 * Splits a CSS list while ignoring separators inside strings and parentheses.
 * This keeps gradients, URLs, and calc() expressions together.
 *
 * @param {string} value CSS list to split.
 * @param {string} [separator=","] Character separating list items.
 * @returns {string[]} Trimmed, non-empty list items.
 */
export function splitCSS(value, separator = ",") {
  let depth = 0;
  let quote = "";
  let partStart = 0;
  const parts = [];

  for (const [index, char] of value.split("").entries()) {
    if (quote) {
      if (char === quote && value[index - 1] !== "\\") quote = "";
    } else if (char === '"' || char === "'") quote = char;
    else if (char === "(") depth++;
    else if (char === ")") depth--;
    else if (depth === 0 && char === separator) {
      const part = value.slice(partStart, index).trim();
      if (part) parts.push(part);
      partStart = index + 1;
    }
  }

  const finalPart = value.slice(partStart).trim();
  if (finalPart) parts.push(finalPart);
  return parts;
}

/**
 * Converts CSS pixel and percentage lengths into pixels.
 * Percentage values are resolved against the supplied reference dimension.
 *
 * @param {string} value CSS length or calc() expression.
 * @param {number} reference Dimension used to resolve percentages.
 * @returns {number} Resolved pixel value.
 */
export function cssLength(value, reference) {
  return [...value.replace(/\s/g, "").matchAll(CSS_LENGTH_RE)].reduce(
    (sum, [term]) =>
      sum +
      Number.parseFloat(term) * (term.endsWith("%") ? reference / 100 : 1),
    0
  );
}

/**
 * Calculates the rendered width and height of a background tile.
 * Supports explicit lengths, auto dimensions, cover, and contain sizing.
 *
 * @param {string} size CSS background-size value.
 * @param {number} width Available width in pixels.
 * @param {number} height Available height in pixels.
 * @param {{ width?: number, height?: number }} [intrinsic] Source dimensions.
 * @returns {[number, number]} Tile width and height in pixels.
 */
export function tileSize(size, width, height, intrinsic) {
  const [x, y = "auto"] = splitCSS(size, " ");
  const iw = intrinsic?.width;
  const ih = intrinsic?.height;
  if (x === "cover" || x === "contain") {
    if (!iw || !ih) return [width, height];
    const factor = Math[x === "cover" ? "max" : "min"](width / iw, height / ih);
    return [iw * factor, ih * factor];
  }
  let w = x === "auto" ? null : cssLength(x, width);
  let h = y === "auto" ? null : cssLength(y, height);
  if (w === null && h === null) return [iw || width, ih || height];
  if (w === null) w = iw && ih ? (h * iw) / ih : width;
  if (h === null) h = iw && ih ? (w * ih) / iw : height;
  return [w, h];
}

/**
 * Finds a world-space rectangle covering the transformed viewport.
 * The extra padding prevents visible gaps at the edges during transforms.
 *
 * @param {number} width Viewport width in pixels.
 * @param {number} height Viewport height in pixels.
 * @param {object} camera Current pan, scale, and rotation.
 * @returns {{ left: number, top: number, width: number, height: number, x: number, y: number }}
 * World bounds and their screen-space origin.
 */
export function backgroundWindow(width, height, camera) {
  const corners = [
    [0, 0],
    [width, 0],
    [0, height],
    [width, height],
  ].map((corner) => transformFrom(corner, camera));
  const xs = corners.map(([x]) => x);
  const ys = corners.map(([, y]) => y);
  const left = Math.floor(Math.min(...xs)) - 2;
  const top = Math.floor(Math.min(...ys)) - 2;
  const right = Math.ceil(Math.max(...xs)) + 2;
  const bottom = Math.ceil(Math.max(...ys)) + 2;
  const [x, y] = transformTo([left, top], camera);
  return { left, top, width: right - left, height: bottom - top, x, y };
}

/**
 * Returns a position wrapped into a repeating interval.
 * Unlike the remainder operator, this also works for negative coordinates.
 *
 * @param {number} position Position to wrap.
 * @param {number} start Start of the interval.
 * @param {number} size Interval length.
 * @returns {number} Wrapped position offset.
 */
export const repeatOffset = (position, start, size) =>
  (((position - start) % size) + size) % size;

/**
 * Generates the world-space background tiles intersecting the viewport.
 * It adds a one-tile buffer around the visible bounds for smooth panning.
 *
 * @param {number} width Viewport width in pixels.
 * @param {number} height Viewport height in pixels.
 * @param {object} camera Current pan, scale, and rotation.
 * @param {number} [tileSizeOverride] Fixed tile size in world pixels.
 * @returns {{ tiles: Array<{ key: string, left: number, top: number }>, size: number, left: number, top: number, x: number, y: number }}
 * Tile descriptors and the transformed grid origin.
 */
export function visibleTiles(width, height, camera, tileSizeOverride) {
  const bounds = backgroundWindow(width, height, camera);
  // Coarser tiles when zoomed out keep the mounted count bounded.
  const size =
    Number.isFinite(tileSizeOverride) && tileSizeOverride > 0
      ? tileSizeOverride
      : 512 * 2 ** Math.max(0, Math.ceil(Math.log2(1 / camera.scale)));
  const firstColumn = Math.floor(bounds.left / size) - 1;
  const lastColumn = Math.floor((bounds.left + bounds.width) / size) + 1;
  const firstRow = Math.floor(bounds.top / size) - 1;
  const lastRow = Math.floor((bounds.top + bounds.height) / size) + 1;
  const left = firstColumn * size;
  const top = firstRow * size;
  const [x, y] = transformTo([left, top], camera);
  const tiles = Array.from(
    { length: lastRow - firstRow + 1 },
    (_, rowIndex) => {
      const row = firstRow + rowIndex;
      return Array.from(
        { length: lastColumn - firstColumn + 1 },
        (_, columnIndex) => {
          const column = firstColumn + columnIndex;
          return {
            key: `${size}:${column}:${row}`,
            left: column * size,
            top: row * size,
          };
        }
      );
    }
  ).flat();

  return { tiles, size, left, top, x, y };
}
