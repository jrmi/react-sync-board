// Run with the local Vite and wire.io services described in README.md.
import assert from "node:assert/strict";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "@playwright/test"
);

const selection = (page) =>
  page.evaluate(() => gridTest.main.getSelection());

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_EXECUTABLE,
  });
  try {
    const page = await browser.newPage();
    await page.goto(
      process.env.GRID_TEST_URL || "http://127.0.0.1:5199/tests/browser/",
    );
    await page.waitForFunction(() => window.gridTest && window.interactionTest);
    await page.evaluate(() => {
      interactionTest.setInteraction({
        navigationMode: "wheel",
        primaryAction: "select",
      });
      gridTest.main.updateBoardState({
        scale: 1,
        translateX: 300,
        translateY: 200,
      });
    });

    const setItems = async (items) => {
      await page.evaluate((value) => gridTest.setItemList(value), items);
      await page.waitForFunction(
        (ids) =>
          ids.every((id) => document.querySelector(`.item[data-id="${id}"]`)),
        items.map(({ id }) => id),
      );
    };
    const turretCenter = async () => {
      const box = await page.locator('.item[data-id="turret"]').boundingBox();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    };

    await setItems([
      { id: "hull", type: "token", x: 100, y: 100 },
      { id: "turret", type: "token", x: 100, y: 100, layer: 1, locked: true },
    ]);
    let point = await turretCenter();
    await page.mouse.click(point.x, point.y);
    await page.waitForFunction(() => gridTest.main.getSelection()[0] === "hull");
    console.log("PASS a short click on a locked turret selects its hull");

    const before = await page.evaluate(
      () => gridTest.getItems(["hull"])[0].x,
    );
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x + 25, point.y + 10, { steps: 3 });
    await page.mouse.up();
    await page.waitForFunction((x) => gridTest.getItems(["hull"])[0].x !== x, before);
    assert.equal(await selection(page)[0], "hull");
    console.log("PASS dragging from a locked turret moves its hull");

    await setItems([
      { id: "only", type: "token", x: 100, y: 100, locked: true },
    ]);
    await page.evaluate(() => gridTest.main.clear());
    const only = await page.locator('.item[data-id="only"]').boundingBox();
    await page.mouse.click(only.x + only.width / 2, only.y + only.height / 2);
    await page.waitForTimeout(50);
    assert.deepEqual(await selection(page), []);
    await page.mouse.move(only.x + only.width / 2, only.y + only.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(800);
    await page.mouse.up();
    await page.waitForFunction(() => gridTest.main.getSelection()[0] === "only");
    console.log("PASS a long press still selects a locked-only item");

    await setItems([
      { id: "hull", type: "token", x: 100, y: 100 },
      { id: "upper", type: "token", x: 100, y: 100, layer: 1 },
      { id: "turret", type: "token", x: 100, y: 100, layer: 2, locked: true },
    ]);
    point = await turretCenter();
    await page.mouse.click(point.x, point.y);
    await page.waitForFunction(() => gridTest.main.getSelection()[0] === "upper");
    console.log("PASS the topmost unlocked item below a locked item wins");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
