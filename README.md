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
