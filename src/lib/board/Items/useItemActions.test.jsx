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
    ["board grid", { type: "grid", size: 10 }, undefined, { x: 3, y: 3 }],
    ["item grid", null, { type: "grid", size: 5 }, { x: 5.5, y: 5.5 }],
    [
      "item grid takes precedence",
      { type: "grid", size: 10 },
      { type: "grid", size: 5 },
      { x: 5.5, y: 5.5 },
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
