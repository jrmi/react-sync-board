import assert from "node:assert/strict";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "@playwright/test"
);
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE,
});
try {
  const page = await browser.newPage();
  await page.goto(
    process.env.GRID_TEST_URL || "http://127.0.0.1:5199/tests/browser/"
  );
  await page.waitForFunction(() => window.gridTest?.main.config.uid);
  await page.evaluate(() => {
    gridTest.setItemList([
      { id: "a", type: "token", x: 0, y: 0, rotate: 25 },
      { id: "b", type: "token", x: 100, y: 80 },
    ]);
    window.selectionReads = 0;
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function (...args) {
      if (this.matches(".item.selected")) window.selectionReads++;
      return original.apply(this, args);
    };
  });
  const verifyBox = async (ids) => {
    const error = await page.evaluate((ids) => {
      const box = gridTest.main.selectionBox;
      if (!ids.length) return box === null ? 0 : Infinity;
      const wrapper = document
        .getElementById(gridTest.main.config.uid)
        .getBoundingClientRect();
      const rects = ids.map((id) =>
        document.querySelector(`.item[data-id="${id}"]`).getBoundingClientRect()
      );
      const left = Math.min(...rects.map((r) => r.left));
      const top = Math.min(...rects.map((r) => r.top));
      const width = Math.max(...rects.map((r) => r.right)) - left;
      const height = Math.max(...rects.map((r) => r.bottom)) - top;
      return Math.max(
        Math.abs(box.left - (left - wrapper.left)),
        Math.abs(box.top - (top - wrapper.top)),
        Math.abs(box.width - width),
        Math.abs(box.height - height)
      );
    }, ids);
    assert.ok(error < 0.1, `Selection bounds differ from DOM by ${error}px`);
  };
  for (const ids of [[], ["a"], ["a", "b"]]) {
    await page.evaluate((ids) => {
      gridTest.main.updateBoardState({
        scale: 1,
        translateX: 300,
        translateY: 200,
        rotate: 0,
      });
      gridTest.main.setSelection(ids);
    }, ids);
    await page.waitForTimeout(450);
    for (const camera of [
      { scale: 0.3, translateX: 200, translateY: 100 },
      { scale: 2, translateX: 350, translateY: 250 },
      { translateX: 400, translateY: 300 },
    ]) {
      await page.evaluate((camera) => {
        window.selectionReads = 0;
        gridTest.main.updateBoardState(camera);
      }, camera);
      await page.waitForTimeout(50);
      assert.equal(
        await page.evaluate(() => window.selectionReads),
        0,
        "Camera changes must not measure selected items"
      );
      await verifyBox(ids);
    }
    await page.evaluate(() => gridTest.main.updateBoardState({ rotate: 65 }));
    await page.waitForTimeout(400);
    await verifyBox(ids);
    await page.evaluate(() => gridTest.main.clear());
    await page.waitForTimeout(50);
    await verifyBox([]);
    console.log(
      `PASS ${ids.length} selected items: zoom, pan, rotation, and clearing`
    );
  }
} finally {
  await browser.close();
}
