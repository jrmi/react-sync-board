import React from "react";
import useItems from "./Items/useItems";
import useSelectedItems from "./Items/useSelectedItems";
import useBoardConfig from "./useBoardConfig";
import useBoardState from "./useBoardState";
import useMainStore from "./store/main";
import { getItemElem } from "@/utils";
import {
  gridGeometry,
  measureGridItem,
  normalizeGrid,
  resolveDisplayGrid,
} from "./grid";

export const GridOverlay = ({ grid, item, uid }) => {
  const patternId = React.useId();
  const element = getItemElem(uid, item.id);
  const [dimensions, setDimensions] = React.useState(null);
  React.useLayoutEffect(() => {
    if (!element) return;
    const measure = () => setDimensions(measureGridItem(element));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  if (!dimensions) return null;

  const { type, size, offset, color, opacity } = grid;
  const { width, height, centers } = gridGeometry(grid);
  const patternOffsetX = offset.x - (type === "grid" ? size / 2 : 0);
  const patternOffsetY = offset.y - (type === "grid" ? size / 2 : 0);
  const diameter = Math.max(360, Math.min(size * 12, 960));
  const left = item.x + dimensions.width / 2 - diameter / 2;
  const top = item.y + dimensions.height / 2 - diameter / 2;
  const polygons = [];
  if (type !== "grid") {
    const angleOffset = type === "hexH" ? Math.PI / 6 : 0;
    for (let row = -1; row <= 1; row++) {
      for (let column = -1; column <= 1; column++) {
        centers.forEach(([cx, cy], index) => {
          const points = Array.from({ length: 6 }, (_, side) => {
            const angle = angleOffset + (side * Math.PI) / 3;
            return `${column * width + cx + size * Math.cos(angle)},${row * height + cy + size * Math.sin(angle)}`;
          }).join(" ");
          polygons.push(
            <polygon key={`${row}:${column}:${index}`} points={points} />,
          );
        });
      }
    }
  }
  return (
    <svg
      data-grid-item={item.id}
      data-grid-type={type}
      width={diameter}
      height={diameter}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        // Keep the overlay on the compositor path, like positioned items. A
        // layout left/top update makes the SVG pattern shimmer while dragging.
        transform: `translate3d(${left}px, ${top}px, 0)`,
        willChange: "transform",
        pointerEvents: "none",
        // Keep the grid above stationary items at the same layer, while the
        // moving selected item remains above its own grid.
        zIndex: item.moving ? ((item.layer ?? 0) + 4) * 10 + 101 : 90,
        opacity,
        maskImage: "radial-gradient(circle, #000 35%, transparent 72%)",
      }}
    >
      <defs>
        <pattern
          id={patternId}
          patternUnits="userSpaceOnUse"
          width={width}
          height={height}
          x={patternOffsetX - left}
          y={patternOffsetY - top}
        >
          <g fill="none" stroke={color} strokeWidth="1">
            {type === "grid" ? (
              <path d={`M0 ${height}V0H${width}`} />
            ) : (
              polygons
            )}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
};

// Render inside Board so overlay positions share the board's camera transform.
const BoardGridOverlay = ({ preview = false, enabled = true }) => {
  const items = useItems();
  const selected = useSelectedItems();
  const [board] = useBoardConfig();
  const { movingItems } = useBoardState();
  const uid = useMainStore((state) => state.config.uid);
  const moving = movingItems || items.some((item) => item.moving);
  if (!enabled || (!preview && !moving)) return null;
  return items
    .filter((item) => selected.includes(item.id))
    .map((item) => {
      const custom = normalizeGrid(item.grid);
      const grid = resolveDisplayGrid(board.grid, item.grid);
      const force = preview && custom;
      if (!grid || (!force && (!moving || !grid.show))) return null;
      return <GridOverlay key={item.id} grid={grid} item={item} uid={uid} />;
    });
};

export default BoardGridOverlay;
