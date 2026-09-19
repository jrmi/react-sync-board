// Run with the same local Vite and wire.io services as grid.js.
import assert from "node:assert/strict";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "@playwright/test"
);

const boardState = (page) =>
  page.evaluate(() => interactionTest.main.boardState);
const setInteraction = async (page, interaction) => {
  await page.evaluate(
    (value) => interactionTest.setInteraction(value),
    interaction
  );
  await page.waitForFunction(
    (value) =>
      interactionTest.interaction.navigationMode === value.navigationMode &&
      interactionTest.interaction.primaryAction === value.primaryAction &&
      interactionTest.interaction.zoomMultiplier === value.zoomMultiplier,
    interaction
  );
};
const wheel = (page, init, target = ".board") =>
  page.locator(target).evaluate((element, eventInit) => {
    const event = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      clientX: 400,
      clientY: 300,
      ...eventInit,
    });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  }, init);
const touchPointer = (page, type, init, target = ".board") =>
  page.locator(target).evaluate(
    (element, eventInit) => {
      element.dispatchEvent(
        new PointerEvent(eventInit.type, {
          bubbles: true,
          cancelable: true,
          pointerType: "touch",
          button: 0,
          buttons: eventInit.type === "pointerup" ? 0 : 1,
          ...eventInit,
        })
      );
    },
    { type, ...init }
  );

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_EXECUTABLE,
  });
  try {
    const page = await browser.newPage();
    await page.goto(
      process.env.GRID_TEST_URL || "http://127.0.0.1:5199/tests/browser/"
    );
    await page.waitForFunction(() => window.interactionTest);
    await page.waitForFunction(
      () => interactionTest.main.getConfiguration().itemExtent.radius > 0
    );

    await setInteraction(page, { navigationMode: "wheel" });
    await page.waitForTimeout(0);
    let before = await boardState(page);
    assert.equal(await wheel(page, { deltaY: 40 }), true);
    await page.waitForFunction(
      (scale) => interactionTest.main.boardState.scale !== scale,
      before.scale
    );
    console.log("PASS wheel mode zooms and prevents native scrolling");

    await setInteraction(page, { navigationMode: "trackpad" });
    await page.waitForTimeout(0);
    before = await boardState(page);
    assert.equal(await wheel(page, { deltaX: 12, deltaY: -8 }), true);
    await page.waitForFunction(
      ({ x, y }) =>
        interactionTest.main.boardState.translateX !== x &&
        interactionTest.main.boardState.translateY !== y,
      { x: before.translateX, y: before.translateY }
    );
    console.log("PASS trackpad mode pans horizontally and vertically");

    await page.evaluate(() => {
      gridTest.setItemList([{ id: "selected", type: "token", x: 0, y: 0 }]);
      interactionTest.main.setSelection(["selected"]);
    });
    await page.locator('.item.selected[data-id="selected"]').waitFor();
    before = await boardState(page);
    assert.equal(
      await wheel(page, { deltaY: -8 }, '.item.selected[data-id="selected"]'),
      true
    );
    await page.waitForFunction(
      (y) => interactionTest.main.boardState.translateY !== y,
      before.translateY
    );
    console.log("PASS trackpad scroll pans over a selected item");

    before = await boardState(page);
    assert.equal(await wheel(page, { deltaY: 25, ctrlKey: true }), true);
    await page.waitForFunction(
      (scale) => interactionTest.main.boardState.scale !== scale,
      before.scale
    );
    console.log("PASS trackpad Ctrl+wheel zooms and prevents native zoom");

    await setInteraction(page, {
      navigationMode: "trackpad",
      zoomMultiplier: 4,
    });
    await page.evaluate(() =>
      interactionTest.main.updateBoardState({
        scale: 1,
        translateX: 300,
        translateY: 200,
      })
    );
    assert.equal(await wheel(page, { deltaY: 25, ctrlKey: true }), true);
    await page.waitForFunction(
      () => Math.abs(interactionTest.main.boardState.scale - 0.8) < 1e-7
    );
    console.log("PASS an explicit zoom multiplier overrides the mode default");

    await setInteraction(page, { navigationMode: "auto" });
    before = await boardState(page);
    assert.equal(await wheel(page, { deltaY: 25, ctrlKey: true }), true);
    await page.waitForFunction(
      (scale) => interactionTest.main.boardState.scale !== scale,
      before.scale
    );
    console.log("PASS auto resolves to wheel navigation on Linux");

    // Explicit primaryAction wins over the legacy prop. A blank-board drag
    // pans only when the resolved primary action is pan.
    await page.evaluate(() => {
      interactionTest.main.updateBoardState({
        translateX: 300,
        translateY: 200,
      });
      interactionTest.setMoveFirst(false);
    });
    await setInteraction(page, {
      navigationMode: "wheel",
      primaryAction: "pan",
    });
    await page.mouse.move(900, 600);
    await page.mouse.down();
    await page.mouse.move(930, 620);
    await page.mouse.up();
    await page.waitForFunction(
      () => interactionTest.main.boardState.translateX !== 300
    );
    console.log("PASS interaction.primaryAction takes priority over moveFirst");

    // Two touch points always navigate, even when one-finger dragging selects.
    await setInteraction(page, {
      navigationMode: "wheel",
      primaryAction: "select",
    });
    await page.evaluate(() =>
      interactionTest.main.updateBoardState({
        translateX: 300,
        translateY: 200,
      })
    );
    await touchPointer(page, "pointerdown", {
      pointerId: 1,
      clientX: 400,
      clientY: 300,
    });
    await touchPointer(page, "pointerdown", {
      pointerId: 2,
      clientX: 420,
      clientY: 300,
    });
    await touchPointer(page, "pointermove", {
      pointerId: 1,
      clientX: 420,
      clientY: 300,
    });
    await page.waitForFunction(
      () => interactionTest.main.boardState.translateX !== 300
    );
    await touchPointer(page, "pointerup", {
      pointerId: 1,
      clientX: 420,
      clientY: 300,
    });
    await touchPointer(page, "pointerup", {
      pointerId: 2,
      clientX: 420,
      clientY: 300,
    });
    console.log("PASS two-finger touch pans while primaryAction is select");

    // The same gesture on a selected item must pan the board, not move it.
    await page.evaluate(() => {
      gridTest.setItemList([{ id: "selected", type: "token", x: 0, y: 0 }]);
      interactionTest.main.setSelection(["selected"]);
      interactionTest.main.updateBoardState({
        translateX: 300,
        translateY: 200,
      });
    });
    const selectedItem = '.item.selected[data-id="selected"]';
    await page.locator(selectedItem).waitFor();
    await touchPointer(
      page,
      "pointerdown",
      { pointerId: 3, clientX: 400, clientY: 300 },
      selectedItem
    );
    await touchPointer(
      page,
      "pointerdown",
      { pointerId: 4, clientX: 420, clientY: 300 },
      selectedItem
    );
    await touchPointer(
      page,
      "pointermove",
      { pointerId: 3, clientX: 420, clientY: 300 },
      selectedItem
    );
    await page.waitForFunction(
      () => interactionTest.main.boardState.translateX !== 300
    );
    assert.equal(await page.evaluate(() => gridTest.getItemList()[0].x), 0);
    await touchPointer(
      page,
      "pointerup",
      { pointerId: 3, clientX: 420, clientY: 300 },
      selectedItem
    );
    await touchPointer(
      page,
      "pointerup",
      { pointerId: 4, clientX: 420, clientY: 300 },
      selectedItem
    );
    console.log("PASS two-finger touch over a selected item does not move it");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
