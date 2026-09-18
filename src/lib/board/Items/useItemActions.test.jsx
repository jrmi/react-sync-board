/** @vitest-environment jsdom */
import React from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockSyncedState = vi.hoisted(() => ({
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
      ])
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
    getItemElem: () => ({ clientWidth: 4, clientHeight: 4 }),
  };
});

import useMainStore, { MainStoreProvider } from "../store/main";
import useItemActions from "./useItemActions";

const PlacementProbe = ({ boardGrid }) => {
  const { placeItems } = useItemActions();

  return (
    <>
      <button onClick={() => placeItems(["item"], boardGrid)}>Place</button>
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
      mockSyncedState.items = {
        item: { id: "item", x: 3, y: 7, grid: itemGrid },
      };
      mockSyncedState.itemIds = ["item"];

      const { getByText } = render(
        <MainStoreProvider>
          <PlacementProbe boardGrid={boardGrid} />
        </MainStoreProvider>
      );

      act(() => {
        fireEvent.click(getByText("Place"));
      });

      expect(mockSyncedState.items.item).toMatchObject(expectedPosition);
    }
  );
});
