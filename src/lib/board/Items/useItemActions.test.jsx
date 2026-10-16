/** @vitest-environment jsdom */
import React from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSyncedState = vi.hoisted(() => ({
  boardGrid: null,
  getBoardConfig: () => ({ grid: mockSyncedState.boardGrid }),
  items: {},
  itemIds: [],
  getItems: () => mockSyncedState.items,
  getItemIds: () => mockSyncedState.itemIds,
  setItemIds: (itemIds) => {
    mockSyncedState.itemIds = itemIds;
  },
  updateItems: (toUpdate, patch) => {
    mockSyncedState.items = Object.fromEntries(
      Object.entries(mockSyncedState.items).map(([id, item]) => [
        id,
        toUpdate[id]
          ? patch
            ? { ...item, ...toUpdate[id] }
            : toUpdate[id]
          : item,
      ]),
    );
  },
}));

vi.mock("@/board/store/synced", () => ({
  useSyncedStore: (selector) => selector(mockSyncedState),
}));

vi.mock("../useDim", () => ({
  default: () => ({
    getCenter: () => ({ x: 0, y: 0 }),
    updateItemExtent: vi.fn(),
  }),
}));

vi.mock("./useItemInteraction", () => ({
  default: () => ({
    call: vi.fn(),
  }),
}));

vi.mock("@/utils", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getItemElem: () => document.createElement("div"),
  };
});

import { MainStoreProvider } from "../store/main";
import useItemActions from "./useItemActions";

vi.mock("../grid", async (importOriginal) => ({
  ...(await importOriginal()),
  measureGridItem: () => ({ width: 4, height: 4 }),
}));

const PlacementProbe = () => {
  const { placeItems } = useItemActions();

  return (
    <>
      <button onClick={() => placeItems(["item"])}>Place</button>
      <output>{JSON.stringify(mockSyncedState.items.item)}</output>
    </>
  );
};

const PointerProbe = React.forwardRef((_props, ref) => {
  const actions = useItemActions();
  React.useImperativeHandle(ref, () => actions);
  return null;
});

const itemElement = (id, { locked = false, passthrough = false } = {}) => {
  const element = document.createElement("div");
  element.className = `item${locked ? " locked" : ""}`;
  element.dataset.id = id;
  const child = document.createElement("span");
  if (passthrough) child.className = "passthrough";
  element.append(child);
  return { element, child };
};

describe("item placement grid integration", () => {
  afterEach(() => {
    cleanup();
    mockSyncedState.items = {};
    mockSyncedState.itemIds = [];
  });

  it.each([
    ["no grid", null, undefined, { x: 3, y: 7 }],
    ["board grid", { type: "grid", size: 10 }, undefined, { x: 8, y: 8 }],
    ["item grid", null, { type: "grid", size: 5 }, { x: 3, y: 8 }],
    [
      "item grid takes precedence",
      { type: "grid", size: 10 },
      { type: "grid", size: 5 },
      { x: 3, y: 8 },
    ],
  ])(
    "places an item with %s",
    (_name, boardGrid, itemGrid, expectedPosition) => {
      mockSyncedState.boardGrid = boardGrid;
      mockSyncedState.items = {
        item: { id: "item", x: 3, y: 7, grid: itemGrid },
      };
      mockSyncedState.itemIds = ["item"];

      const { getByText } = render(
        <MainStoreProvider>
          <PlacementProbe boardGrid={boardGrid} />
        </MainStoreProvider>,
      );

      act(() => {
        fireEvent.click(getByText("Place"));
      });

      expect(mockSyncedState.items.item).toMatchObject(expectedPosition);
    },
  );
});

describe("pointer item lookup", () => {
  let actionsRef;

  beforeEach(() => {
    mockSyncedState.itemIds = ["hull", "turret", "upper"];
    actionsRef = React.createRef();
    Object.defineProperty(document, "elementsFromPoint", {
      configurable: true,
      value: vi.fn(),
    });
    render(
      <MainStoreProvider>
        <PointerProbe ref={actionsRef} />
      </MainStoreProvider>,
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    mockSyncedState.itemIds = [];
  });

  it("uses visual stack order to pass a locked item through to an unlocked item", () => {
    const { element: hull, child: hullChild } = itemElement("hull");
    const { element: turret, child: turretChild } = itemElement("turret", {
      locked: true,
    });
    const unknown = itemElement("unknown").element;
    document.elementsFromPoint.mockReturnValue([
      turretChild,
      turret,
      unknown,
      hullChild,
      hull,
    ]);

    expect(
      actionsRef.current.findElementUnderPointer({
        target: turretChild,
        clientX: 10,
        clientY: 20,
      }),
    ).toBe(hull);
  });

  it("keeps explicit locked lookup options and chooses the topmost unlocked candidate", () => {
    const { element: hull } = itemElement("hull");
    const { element: upper } = itemElement("upper");
    const { element: turret, child: turretChild } = itemElement("turret", {
      locked: true,
    });
    document.elementsFromPoint.mockReturnValue([
      turretChild,
      turret,
      upper,
      hull,
    ]);

    const event = { target: turretChild, clientX: 10, clientY: 20 };
    expect(actionsRef.current.findElementUnderPointer(event)).toBe(upper);
    expect(actionsRef.current.findElementUnderPointer(event, { returnLocked: true })).toBe(
      turret,
    );
    expect(actionsRef.current.findElementUnderPointer(event, { passLocked: true })).toBe(
      turret,
    );
  });

  it("returns no short-click target when every stacked item is locked", () => {
    const { element: turret, child: turretChild } = itemElement("turret", {
      locked: true,
    });
    document.elementsFromPoint.mockReturnValue([
      turretChild,
      turret,
    ]);

    const event = { target: turretChild, clientX: 10, clientY: 20 };
    expect(actionsRef.current.findElementUnderPointer(event)).toBeNull();
    expect(actionsRef.current.findElementUnderPointer(event, { returnLocked: true })).toBe(
      turret,
    );
  });

  it("continues passing through passthrough children", () => {
    const { element: hull } = itemElement("hull");
    const { element: turret, child: turretChild } = itemElement("turret", {
      locked: true,
      passthrough: true,
    });
    document.elementsFromPoint.mockReturnValue([
      turretChild,
      turret,
      hull,
    ]);

    expect(
      actionsRef.current.findElementUnderPointer({
        target: turretChild,
        clientX: 10,
        clientY: 20,
      }),
    ).toBe(hull);
  });
});
