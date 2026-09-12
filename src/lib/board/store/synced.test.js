import { describe, expect, it } from "vitest";
import { createStore } from "zustand";

import { itemIdsStore } from "./synced";

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
