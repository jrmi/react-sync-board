import React from "react";
import useMainStore from "./store/main";
import {
  visibleTiles,
  cssLength,
  repeatOffset,
  splitCSS,
  tileSize,
} from "./background";

const fill = { position: "absolute", inset: 0, pointerEvents: "none" };

export default function WorldBackground({ style, tileSizeOverride }) {
  const [camera, rect] = useMainStore((state) => [
    state.boardState,
    state.config.boardWrapperRect,
  ]);
  const width = rect.width || 1;
  const height = rect.height || 1;
  const probe = React.useRef(null);
  const [background, setBackground] = React.useState({
    color: "#333",
    layers: [],
  });
  const [images, setImages] = React.useState({});

  React.useLayoutEffect(() => {
    const css = getComputedStyle(probe.current);
    const read = (key) => splitCSS(css[key]);
    const sizes = read("backgroundSize");
    const xs = read("backgroundPositionX");
    const ys = read("backgroundPositionY");
    const repeats = read("backgroundRepeat");
    const blends = read("backgroundBlendMode");
    setBackground({
      color: css.backgroundColor,
      layers: read("backgroundImage").map((image, i) => ({
        image,
        size: sizes[i % sizes.length],
        x: xs[i % xs.length],
        y: ys[i % ys.length],
        repeat: repeats[i % repeats.length],
        blend: blends[i % blends.length],
      })),
    });
  }, [style, width, height]);

  React.useEffect(() => {
    let active = true;
    background.layers.forEach(({ image }) => {
      if (!image.startsWith("url(")) return;
      const img = new Image();
      img.onload = () => {
        if (active)
          setImages((prev) => ({
            ...prev,
            [image]: { width: img.naturalWidth, height: img.naturalHeight },
          }));
      };
      img.src = image.slice(4, -1).replace(/^["']|["']$/g, "");
    });
    return () => {
      active = false;
    };
  }, [background.layers]);

  const grid = visibleTiles(width, height, camera, tileSizeOverride);
  const layers = background.layers.map((layer) => {
    const [w, h] = tileSize(layer.size, width, height, images[layer.image]);
    const repeatX =
      ["repeat", "repeat-x"].includes(layer.repeat) ||
      layer.repeat.startsWith("repeat ");
    const repeatY =
      ["repeat", "repeat-y"].includes(layer.repeat) ||
      layer.repeat.endsWith(" repeat");
    const x = cssLength(layer.x, width - w);
    const y = cssLength(layer.y, height - h);
    return {
      ...layer,
      size: `${w}px ${h}px`,
      position: (left, top) =>
        `${repeatX && w ? repeatOffset(x, left, w) : x - left}px ${repeatY && h ? repeatOffset(y, top, h) : y - top}px`,
    };
  });

  return (
    <div
      className="world-background"
      aria-hidden="true"
      style={{ ...fill, overflow: "hidden", backgroundColor: background.color }}
    >
      <div
        ref={probe}
        style={{
          backgroundColor: "#333",
          ...style,
          position: "absolute",
          width,
          height,
          visibility: "hidden",
          pointerEvents: "none",
        }}
      />
      <div
        className="world-background-tiles"
        style={{
          position: "absolute",
          transformOrigin: "0 0",
          transform: `translate(${grid.x}px, ${grid.y}px) rotate(${camera.rotate}deg) scale(${camera.scale})`,
        }}
      >
        {grid.tiles.map((tile) => (
          <div
            key={tile.key}
            className="world-background-tile"
            data-tile={tile.key}
            style={{
              position: "absolute",
              left: tile.left - grid.left,
              top: tile.top - grid.top,
              width: grid.size,
              height: grid.size,
              backgroundImage: layers.map((l) => l.image).join(", "),
              backgroundSize: layers.map((l) => l.size).join(", "),
              backgroundPosition: layers
                .map((l) => l.position(tile.left, tile.top))
                .join(", "),
              backgroundRepeat: layers.map((l) => l.repeat).join(", "),
              backgroundBlendMode: layers.map((l) => l.blend).join(", "),
            }}
          />
        ))}
      </div>
    </div>
  );
}
