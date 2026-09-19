// Run with a Vite server on 5199 and wire.io on 4099 (see README.md).
import assert from "node:assert/strict";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "@playwright/test"
);
const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);
function expectedPosition(position, grid) {
  if (!grid || !["grid", "hexH", "hexV"].includes(grid.type)) return position;
  const size = Number(grid.size);
  const ox = Number(grid.offset?.x || 0),
    oy = Number(grid.offset?.y || 0);
  const x = position.x + 22 - ox,
    y = position.y + 17 - oy;
  if (grid.type === "grid")
    return {
      x: Math.round(x / size) * size + ox - 22,
      y: Math.round(y / size) * size + oy - 17,
    };
  let best,
    distance = Infinity;
  // Independent finite lattice search, including negative board coordinates.
  for (let row = -80; row <= 80; row++)
    for (let column = -80; column <= 80; column++) {
      let cx = Math.sqrt(3) * size * (column + (row % 2) / 2),
        cy = 1.5 * size * row;
      if (grid.type === "hexV") [cx, cy] = [cy, cx];
      const d = Math.hypot(cx - x, cy - y);
      if (d < distance) {
        distance = d;
        best = { x: cx + ox - 22, y: cy + oy - 17 };
      }
    }
  return best;
}
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_EXECUTABLE,
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(
      process.env.GRID_TEST_URL || "http://127.0.0.1:5199/tests/browser/"
    );
    await page.waitForFunction(() => window.gridTest);
    await page.waitForFunction(
      () => gridTest.main.getConfiguration().itemExtent.radius > 0
    );
    await page.waitForTimeout(100);
    const cases = [
      ["new square board", { type: "grid", size: 50, show: true }],
      [
        "item override and partial offset",
        { type: "grid", size: 50 },
        { type: "grid", size: "12.5", offset: { x: "3.25" }, show: true },
      ],
      ["inheritance", { type: "grid", size: 50 }, { show: true }],
      ["disabled", { type: "none", size: 50 }],
      ["no grid", undefined],
      [
        "custom on disabled board",
        { type: "none" },
        { type: "grid", size: 12.5 },
      ],
      [
        "horizontal hex",
        { type: "hexH", size: 25.5, offset: { y: "-3" }, show: true },
      ],
      [
        "vertical hex zoomed",
        { type: "hexV", size: 25.5, offset: { x: "2" }, show: true },
        undefined,
        2,
      ],
      [
        "negative fractional square zoomed",
        { type: "grid", size: 7.25, offset: { x: -3.5, y: 2.25 } },
        undefined,
        0.5,
        -103,
      ],
    ];
    for (const [name, boardGrid, itemGrid, scale = 1, start = 103] of cases) {
      await page.evaluate(
        ({ boardGrid, itemGrid, scale, start }) => {
          gridTest.setBoard({
            grid: boardGrid,
            gridType: "grid",
            gridSize: 99,
          });
          gridTest.setItemList([
            { id: "token", type: "token", x: start, y: 107, grid: itemGrid },
          ]);
          gridTest.main.updateBoardState({
            scale,
            translateX: 300,
            translateY: 200,
          });
          window.placements = [];
        },
        { boardGrid, itemGrid, scale, start }
      );
      const box = await page.locator('.item[data-id="token"]').boundingBox();
      await page.mouse.move(box.x + 20 * scale, box.y + 15 * scale);
      await page.mouse.down();
      await page.mouse.move(box.x + 57 * scale, box.y + 38 * scale, {
        steps: 4,
      });
      await page.waitForFunction(() => gridTest.getItemList()[0].moving);
      const moving = await page.evaluate(() => gridTest.getItemList()[0]);
      near(moving.x, start + 37);
      near(moving.y, 130);
      const grid = itemGrid?.type ? itemGrid : boardGrid;
      if (grid?.show) {
        const overlay = page.locator('[data-grid-item="token"]');
        await overlay.waitFor();
        const origin = await overlay.evaluate((el) => ({
          x:
            Number.parseFloat(el.style.left) +
            Number(el.querySelector("pattern").getAttribute("x")),
          y:
            Number.parseFloat(el.style.top) +
            Number(el.querySelector("pattern").getAttribute("y")),
        }));
        near(origin.x, Number(grid.offset?.x || 0));
        near(origin.y, Number(grid.offset?.y || 0));
      }
      await page.mouse.up();
      await page.waitForFunction(() => window.placements.length > 0);
      const result = await page.evaluate(() => ({
        item: gridTest.getItemList()[0],
        interaction: placements.at(-1)[0],
      }));
      const expected = expectedPosition(moving, grid);
      near(result.item.x, expected.x);
      near(result.item.y, expected.y);
      assert.equal(result.item.moving, false);
      assert.deepEqual(result.item, result.interaction);
      assert.equal(await page.locator("[data-grid-item]").count(), 0);
      console.log(`PASS pointer release: ${name}`);
    }
    await page.evaluate(() => {
      gridTest.setBoard({ grid: { type: "grid", size: 50 } });
      gridTest.main.updateBoardState({
        scale: 1,
        translateX: 300,
        translateY: 200,
      });
      gridTest.setItemList([
        { id: "a", type: "token", x: 103, y: 107 },
        { id: "b", type: "token", x: 203, y: 157 },
      ]);
      gridTest.main.setSelection(["a", "b"]);
      placements = [];
    });
    const box = await page.locator('.item[data-id="a"]').boundingBox();
    await page.mouse.move(box.x + 20, box.y + 15);
    await page.mouse.down();
    await page.mouse.move(box.x + 57, box.y + 38, { steps: 4 });
    await page.mouse.up();
    await page.waitForFunction(() => placements.length);
    let items = await page.evaluate(() => gridTest.getItemList());
    assert.deepEqual(
      items.map(({ x, y }) => ({ x, y })),
      [
        { x: 128, y: 133 },
        { x: 228, y: 183 },
      ]
    );
    await page.keyboard.press("Shift+ArrowRight");
    await page.waitForFunction(() => gridTest.getItemList()[0].x === 178);
    items = await page.evaluate(() => gridTest.getItemList());
    assert.deepEqual(
      items.map(({ x, y }) => ({ x, y })),
      [
        { x: 178, y: 133 },
        { x: 278, y: 183 },
      ]
    );
    console.log("PASS multiple selection and keyboard placement");
    await page.evaluate(() =>
      gridTest.pushItem({ id: "inserted", type: "token", x: 103, y: 107 })
    );
    await page.waitForFunction(
      () => gridTest.getItems(["inserted"])[0]?.moving === false
    );
    const inserted = await page.evaluate(
      () => gridTest.getItems(["inserted"])[0]
    );
    assert.deepEqual({ x: inserted.x, y: inserted.y }, { x: 128, y: 83 });
    console.log("PASS insertion inherits current board grid");
    await page.evaluate(() => {
      gridPreview = true;
      gridTest.updateItem(
        "inserted",
        { grid: { type: "hexV", size: 12.5, show: false } },
        true
      );
      gridTest.main.setSelection(["inserted"]);
    });
    await page.locator('[data-grid-item="inserted"]').waitFor();
    console.log("PASS custom editor preview overrides show=false");
    const peer = await browser.newPage();
    await peer.goto(
      process.env.GRID_TEST_URL || "http://127.0.0.1:5199/tests/browser/"
    );
    await peer.waitForFunction(
      () => window.gridTest?.getItems(["inserted"])[0]
    );
    await page.evaluate(() => {
      gridPreview = false;
      gridTest.main.setSelection(["a"]);
    });
    await page.keyboard.press("Shift+ArrowRight");
    await peer.waitForFunction(() => gridTest.getItems(["a"])[0]?.x === 228);
    assert.deepEqual(
      await page.evaluate(() => gridTest.getItemList()),
      await peer.evaluate(() => gridTest.getItemList())
    );
    console.log("PASS placement synchronizes between two clients");
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
