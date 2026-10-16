/** @vitest-environment jsdom */
import React from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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

describe("finding the item under the pointer", () => {
  const FindProbe = ({ target, options, onFound }) => {
    const { findElementUnderPointer } = useItemActions();
    onFound(
      findElementUnderPointer({ target, clientX: 5, clientY: 5 }, options)
    );
    return null;
  };

  const findUnder = (target, options) => {
    let found;
    render(
      <MainStoreProvider>
        <FindProbe
          target={target}
          options={options}
          onFound={(element) => {
            found = element;
          }}
        />
      </MainStoreProvider>
    );
    return found;
  };

  // The main store has no uid configured in tests, so item ids start with
  // "null__".
  const addItem = (id, { locked = false } = {}) => {
    const element = document.createElement("div");
    element.id = `null__${id}`;
    element.className = locked ? "item locked" : "item";
    const content = document.createElement("img");
    element.appendChild(content);
    document.body.appendChild(element);
    return { element, content };
  };

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    delete document.elementsFromPoint;
  });

  it("selects the unlocked item under a locked one when skipping locked items", () => {
    const counter = addItem("counter");
    const map = addItem("map", { locked: true });
    document.elementsFromPoint = () => [
      map.content,
      map.element,
      counter.content,
      counter.element,
      document.body,
    ];

    expect(findUnder(map.content, { skipLocked: true })).toBe(counter.element);
  });

  it("finds nothing when only locked items are under the pointer", () => {
    const map = addItem("map", { locked: true });
    document.elementsFromPoint = () => [map.content, map.element];

    expect(findUnder(map.content, { skipLocked: true })).toBe(null);
  });

  it("ignores a passthrough part of an unlocked item", () => {
    const counter = addItem("counter");
    counter.content.className = "passthrough";
    const map = addItem("map", { locked: true });
    document.elementsFromPoint = () => [
      map.content,
      map.element,
      counter.content,
      counter.element,
    ];

    expect(findUnder(map.content, { skipLocked: true })).toBe(null);
  });

  it("keeps returning nothing for a locked item by default", () => {
    const counter = addItem("counter");
    const map = addItem("map", { locked: true });
    document.elementsFromPoint = () => [map.content, counter.element];

    expect(findUnder(map.content)).toBe(null);
  });

  it("returns a selected item under a locked one so it can be dragged", () => {
    const counter = addItem("counter");
    counter.element.classList.add("selected");
    const map = addItem("map", { locked: true });
    document.elementsFromPoint = () => [
      map.content,
      map.element,
      counter.content,
      counter.element,
    ];

    expect(findUnder(map.content)).toBe(counter.element);
  });
});
