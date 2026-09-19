# React sync board

React Sync Board is a set of React components/hooks that allow you to add real
time collaboration on a board to any React project.

You can see it live in [AirBoardGame](https://airboardgame.net/) website.

## Demo

You can access the demo storybook [here](https://react-sync-board.netlify.app).

## Installation

```sh
npm install react-sync-board
```

You need an up and running instance of the [wire.io](https://github.com/jrmi/wire.io)
server to be able to synchronize two boards. You can achieve that by using npm >= v7
and execute:

```sh
npx wire.io
```

See [wire.io](https://github.com/jrmi/wire.io) for more information.

## Usage

See the examples in `src/stories` to know how to use it.

(Documentation in progress)

### Mouse and trackpad interaction

`Board` accepts an optional local `interaction` prop. It is not synchronized
between collaborators:

```jsx
<Board
  interaction={{
    navigationMode: "trackpad",
    primaryAction: "select",
    zoomMultiplier: 2.5,
  }}
/>
```

`navigationMode` may be `"auto"` (the default), `"wheel"`, or `"trackpad"`.
`auto` resolves through a platform heuristic: it uses `trackpad` on macOS and
`wheel` elsewhere. `wheel` always zooms with the wheel. `trackpad` pans with
horizontal or vertical scroll and zooms for a pinch or `Ctrl` + wheel, including
on Linux. Trackpad zoom uses the same sensitivity on every platform.

`zoomMultiplier` is optional and must be a positive number. It defaults to `1`
in `wheel` mode and `2` in `trackpad` mode; provide it to tune zoom sensitivity
for an individual board.

`inertia` controls momentum after a pan or zoom and defaults to `true`.
Set `inertiaAmount` to a positive number to tune its range (`1` is the default,
values below `1` shorten it, and values above `1` extend it):

```jsx
<Board interaction={{ inertia: false }} />
<Board interaction={{ inertia: true, inertiaAmount: 1.5 }} />
```

`primaryAction` is `"pan"` or `"select"`. It replaces the legacy `moveFirst`
prop: `moveFirst={true}` maps to `"pan"` and `moveFirst={false}` maps to
`"select"`. When both are provided, `interaction.primaryAction` takes priority.
`moveFirst` remains supported during this transition. Browsers do not expose a
reliable way to detect trackpad hardware, so use `navigationMode="trackpad"`
explicitly when that interaction is wanted outside macOS. Without either
setting, a mouse drag pans, while a touchscreen drag selects; two fingers still
pan and pinch. Trackpad mode also uses selection as its primary action.

### Infinite background

The background uses virtual tiles: only the visible tiles and a one-tile margin
are mounted. Panning does not increase the number of mounted tiles.
Tiles follow the camera's pan, zoom and rotation.

```jsx
<Board
  backgroundTileSize={512}
  style={{
    backgroundColor: "#555",
    backgroundImage: "radial-gradient(white 1px, transparent 1px)",
    backgroundSize: "37px 37px",
  }}
/>
```

`backgroundTileSize` optionally sets the square tile side in world-coordinate
pixels. Omit it for automatic sizing (512 world pixels, increased when zooming
out to keep the tile count small). A positive finite number overrides automatic
sizing; invalid values fall back to automatic sizing. Smaller tiles mount more
elements, especially when zoomed out.

This controls rendering tile size; `style.backgroundSize` controls pattern size.
Offsets keep repeating backgrounds aligned even when the tile size is not a
multiple of the pattern size. CSS image/gradient layers, positions, repeat modes
and custom image URLs are read from the supplied background style.
`boardSize` is deprecated and does not constrain panning.

## Storybook

To start the storybook, clone this repository then execute:

```sh
npm ci
npm start
```

Remember to start a `wire.io` instance as explained above.

### Movement grids

Set `boardConfig.grid` through `useBoardConfig()` and optionally set `item.grid`:

```js
{ type: "grid", size: 50, offset: { x: 0, y: 0 }, show: true,
  color: "#000000", opacity: 0.2 }
```

Types are `grid` (square intersections), `hexH` (horizontal rows of hex centers),
and `hexV` (vertical columns of hex centers). Square size is the spacing; hex size
is the circumradius. Sizes must be positive and finite (invalid/missing sizes
use 1). Offsets are board-relative and each missing/invalid axis uses zero.
Numeric strings are accepted. A recognized item grid overrides the board grid;
otherwise the item inherits it. No active type on either means no snapping.
Legacy board fields are not interpreted; applications should migrate saved data
before loading the board.

`useItemActions().placeItems(itemIds)` resolves the current board grid internally.
Dragging snaps on release; keyboard placement and insertion use the same path.
Item centers use measured border-box dimensions, independent of camera zoom.
Linked-item placement behavior is unchanged.

Render the overlay inside the board:

```jsx
<Board itemTemplates={itemTemplates}>
  <BoardGridOverlay preview={editingItems} />
</Board>
```

Import `BoardGridOverlay` from `react-sync-board`. With `preview={false}` (the
default), selected items show their effective grid while moving only when
`grid.show` is true. Preview forces custom item grids visible, including when
stationary or `show` is false. Inherited grids continue to follow board visibility.

See [the browser regressions](tests/browser/README.md) for local verification.
