import React from "react";
import { Field } from "react-final-form";

import Label from "./ui/Label";
import Hint from "./ui/Hint";
import Slider from "./ui/Slider";
import useTranslation from "../useTranslation";

import itemMap from "./itemMap";

const getDefaultActionsFromItem = (item) => {
  if (item.type in itemMap) {
    const actions = itemMap[item.type].defaultActions;
    if (typeof actions === "function") {
      return actions(item);
    }
    return actions;
  }

  return [];
};

export const getFormFieldComponent = (type) => {
  if (type in itemMap) {
    return itemMap[type].form;
  }
  return () => null;
};

const ItemForm = ({ items }) => {
  const { t } = useTranslation();

  const [defaultActions] = React.useState(() =>
    getDefaultActionsFromItem(items[0], itemMap)
  );

  let FieldsComponent;

  if (items.length === 1) {
    FieldsComponent = getFormFieldComponent(items[0].type);
  } else {
    const types = new Set(items.map(({ type }) => type));
    if (types.size === 1) {
      FieldsComponent = getFormFieldComponent(Array.from(types)[0]);
    } else {
      FieldsComponent = () => null;
    }
  }

  let initialValues;

  // Set initial values to item values if only one element selected
  // Empty object otherwise
  if (items.length === 1) {
    initialValues = { ...items[0] };
    initialValues.actions = initialValues.actions || defaultActions;
  } else {
    initialValues = {};
  }

  return (
    <>
      <Label>
        <Field
          name="locked"
          component="input"
          type="checkbox"
          initialValue={initialValues.locked}
        />
        <span className="checkable">{t("Locked?")}</span>
        <Hint>{t("Lock action help")}</Hint>
      </Label>
      <Label>
        {t("Rotation")}
        <Field name="rotation" initialValue={initialValues.rotation}>
          {({ input: { onChange, value } }) => (
            <Slider
              defaultValue={0}
              value={value}
              min={-180}
              max={180}
              step={5}
              included={false}
              marks={{
                "-180": -180,
                "-90": -90,
                "-45": -45,
                "-30": -30,
                0: 0,
                30: 30,
                45: 45,
                90: 90,
                180: 180,
              }}
              onChange={onChange}
              className={"slider-rotation"}
            />
          )}
        </Field>
      </Label>
      <Label>
        {t("Layer")}
        <Field name="layer" initialValue={initialValues.layer}>
          {({ input: { onChange, value } }) => (
            <Slider
              defaultValue={0}
              value={value}
              min={-3}
              max={3}
              step={1}
              included={false}
              marks={{
                "-3": -3,
                "-2": -2,
                "-1": -1,
                0: 0,
                1: 1,
                2: 2,
                3: 3,
              }}
              onChange={onChange}
              className={"slider-layer"}
            />
          )}
        </Field>
      </Label>
      <FieldsComponent initialValues={initialValues} />
      <h3>{t("Snap to grid")}</h3>
      <Label>
        {t("Grid type")}
        <Field
          name="grid.type"
          initialValue={initialValues.grid?.type || "none"}
          component="select"
        >
          <option value="none">{t("None")}</option>
          <option value="grid">{t("Grid")}</option>
          <option value="hexH">{t("Horizontal hexagons")}</option>
          <option value="hexV">{t("Vertical hexagons")}</option>
        </Field>
      </Label>
      <Label>
        {t("Size")}
        <Field
          name="grid.size"
          component="input"
          initialValue={initialValues.grid?.size}
        >
          {(props) => <input {...props.input} type="number" />}
        </Field>
      </Label>
    </>
  );
};

export default React.memo(ItemForm);
