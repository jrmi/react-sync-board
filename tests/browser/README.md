# Grid pointer regressions

Start the local services in separate terminals from the Syncboard repository:

```sh
WIREIO_PORT=4099 node node_modules/wire.io/src/cli.js
npm run dev -- --host 127.0.0.1 --port 5199
```

Run with Playwright available (or point `PLAYWRIGHT_MODULE` at an installed
Playwright module). `CHROMIUM_EXECUTABLE` optionally selects an existing browser:

```sh
node tests/browser/grid.js
npm run test:browser:interaction
npm run test:browser:locked-items
node tests/browser/zoom-selection.js
```

The fixture uses real Board, Gesture, item measurements, placement interactions,
and wire.io synchronization. The script drives browser mouse and keyboard input.
It covers selection-border center alignment, release-only snapping, inheritance,
item overrides, disabled grids, legacy fields being ignored, partial/string
offsets, fractional sizes, negative coordinates, both hex orientations, zoom,
multiple selections, insertion, editor previews, overlay origins, and two clients.

The initial square-grid regression failed before the fix: dragging a 44×34
border-box item to (140, 130) snapped to (130, 135), because `clientWidth` excluded
the selected border. The correct top-left position is (128, 133), with visible
center (150, 150). Place interactions now observe that same position.

`interaction.js` covers wheel zooming, explicit trackpad X/Y panning,
`Ctrl` + wheel zooming, selective native-event prevention, and the precedence
of `interaction.primaryAction` over legacy `moveFirst`.

`locked-items.js` covers short-click and drag pass-through from a locked item
to the nearest unlocked item, locked-only long presses, and visual stack order.

`zoom-selection.js` checks empty, single, and multiple selections through zoom,
pan, rotation, and clearing. It compares the public selection box with actual
DOM bounds and verifies that zoom and pan do not measure selected items.
