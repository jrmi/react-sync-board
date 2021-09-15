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

## Storybook

To start the storybook, clone this repository then execute:

```sh
npm ci
npm start
```

Remember to start a `wire.io` instance as explained above.
