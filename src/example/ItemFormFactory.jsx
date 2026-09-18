import React from "react";
import { Form } from "react-final-form";

import AutoSave from "./ui/formUtils/AutoSave";
import { useItemActions, useSelectedItems, useItems } from "@/";

export const getFormFieldComponent = (type, itemMap) => {
  if (type in itemMap) {
    return itemMap[type].form;
  }
  return () => null;
};

const ItemFormFactory = ({ ItemFormComponent }) => {
  const { batchUpdateItems } = useItemActions();
  const items = useItems();
  const selectedItems = useSelectedItems();

  const onSubmitHandler = React.useCallback(
    (formValues, dirtyFields = {}) => {
      const gridWasEdited = Object.keys(dirtyFields).some(
        (field) => field === "grid" || field.startsWith("grid."),
      );
      const values =
        selectedItems.length > 1 && !gridWasEdited
          ? Object.fromEntries(
              Object.entries(formValues).filter(([key]) => key !== "grid"),
            )
          : formValues;

      batchUpdateItems(selectedItems, (item) => ({
        ...item,
        ...values,
      }));
    },
    [batchUpdateItems, selectedItems]
  );

  return (
    <Form
      onSubmit={onSubmitHandler}
      render={() => (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <AutoSave save={onSubmitHandler} />
          <ItemFormComponent
            items={items.filter(({ id }) => selectedItems.includes(id))}
          />
        </div>
      )}
    />
  );
};

export default React.memo(ItemFormFactory);
