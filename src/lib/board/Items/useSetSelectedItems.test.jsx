/** @vitest-environment jsdom */
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import useSelectedItems from "./useSelectedItems";
import useSetSelectedItems from "./useSetSelectedItems";
import { MainStoreProvider } from "../store/main";

function SelectionProbe() {
  const selectedItems = useSelectedItems();
  const setSelectedItems = useSetSelectedItems();

  return (
    <button onClick={() => setSelectedItems(["item-1"])}>
      {selectedItems.join(",")}
    </button>
  );
}

describe("useSetSelectedItems", () => {
  afterEach(() => cleanup());

  it("replaces the board selection", () => {
    const { container } = render(
      <MainStoreProvider>
        <SelectionProbe />
      </MainStoreProvider>
    );

    fireEvent.click(container.querySelector("button"));

    expect(container.textContent).toBe("item-1");
  });
});
