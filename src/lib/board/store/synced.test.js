import { describe, expect, it } from "vitest";
import { createStore } from "zustand";

import { itemIdsStore, itemsStore } from "./synced";

const makeStore = () => createStore((...args) => itemIdsStore(...args));

describe("synced item ordering", () => {
  it("inserts, replaces, and removes item ids", () => {
    const store = makeStore();
    store.getState().setItemIds(["a", "b"]);
    store.getState().insert(1, "new");
    store.getState().updateItemIds(0, "first");
    store.getState().remove(2);
    expect(store.getState().getItemIds()).toEqual(["first", "new"]);
  });

  it("updates multiple positions without changing the item list key", () => {
    const store = makeStore();
    store.getState().setItemIds(["a", "b", "c"]);
    store.getState().updateManyItemIds({ 0: "x", 2: "z" });
    expect(store.getState().getItemIds()).toEqual(["x", "b", "z"]);
    expect(store.getState().items).toBeUndefined();
  });
});

describe("synced item movement", () => {
  it("moves selected items and marks them as moving", () => {
    const store = createStore((...args) => itemsStore(...args));
    store.getState().setItems({
      a: { id: "a", x: 10, y: 20 },
      b: { id: "b", x: -5, y: 3 },
      c: { id: "c", x: 100, y: 200 },
    });

    store.getState().moveItems(["a", "b"], { x: 4, y: -2 });

    expect(store.getState().getItems()).toEqual({
      a: { id: "a", x: 14, y: 18, moving: true },
      b: { id: "b", x: -1, y: 1, moving: true },
      c: { id: "c", x: 100, y: 200 },
    });
  });

  it("uses zero as the default coordinate when moving an item", () => {
    const store = createStore((...args) => itemsStore(...args));
    store.getState().setItems({ a: { id: "a" } });

    store.getState().moveItems(["a"], { x: 8, y: 6 });

    expect(store.getState().getItems().a).toEqual({
      id: "a",
      x: 8,
      y: 6,
      moving: true,
    });
  });
});
