/** @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, cleanup } from "@testing-library/react";
import { Form } from "react-final-form";
import { afterEach, describe, expect, it } from "vitest";

import ItemForm from "./ItemForm";

describe("ItemForm", () => {
  afterEach(() => cleanup());

  it("edits grid settings for multiple items, including mixed item types", () => {
    let submittedValues;
    const items = [
      { id: "rect-1", type: "rect", grid: { type: "grid", size: 10 } },
      { id: "zone-1", type: "zone", grid: { type: "grid", size: 20 } },
    ];

    const { container } = render(
      <Form
        onSubmit={(values) => {
          submittedValues = values;
        }}
        render={({ handleSubmit }) => (
          <form onSubmit={handleSubmit}>
            <ItemForm items={items} />
            <button type="submit">Save</button>
          </form>
        )}
      />
    );

    fireEvent.change(container.querySelector('[name="grid.type"]'), {
      target: { value: "hexV" },
    });
    fireEvent.change(container.querySelector('[name="grid.size"]'), {
      target: { value: "30" },
    });
    fireEvent.change(container.querySelector('[name="grid.offset.x"]'), {
      target: { value: "4" },
    });
    fireEvent.change(container.querySelector('[name="grid.offset.y"]'), {
      target: { value: "-2" },
    });
    fireEvent.click(container.querySelector('button[type="submit"]'));

    expect(submittedValues.grid).toEqual({
      type: "hexV",
      size: "30",
      offset: { x: "4", y: "-2" },
    });
  });
});
