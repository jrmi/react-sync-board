import { Field } from "react-final-form";

import Label from "./ui/Label";
import useTranslation from "../useTranslation";

const NumberField = ({ name, initialValue }) => (
  <Field
    name={name}
    initialValue={initialValue}
    parse={(value) => Number(value)}
  >
    {(props) => <input {...props.input} type="number" step="any" />}
  </Field>
);

const GridFields = ({ initialValues = {}, title = true }) => {
  const { t } = useTranslation();
  const grid = initialValues.grid || {};

  return (
    <>
      {title && <h3>{t("Snap to grid")}</h3>}
      <Label>
        {t("Grid type")}
        <Field
          name="grid.type"
          component="select"
          initialValue={grid.type || "none"}
        >
          <option value="none">{t(title ? "Use board grid" : "None")}</option>
          <option value="grid">{t("Grid")}</option>
          <option value="hexH">{t("Horizontal hexagons")}</option>
          <option value="hexV">{t("Vertical hexagons")}</option>
        </Field>
      </Label>
      <Label>
        {t("Size")}
        <NumberField name="grid.size" initialValue={grid.size || 50} />
      </Label>
      <Label>
        {t("Grid offset X")}
        <NumberField name="grid.offset.x" initialValue={grid.offset?.x || 0} />
      </Label>
      <Label>
        {t("Grid offset Y")}
        <NumberField name="grid.offset.y" initialValue={grid.offset?.y || 0} />
      </Label>
    </>
  );
};

export default GridFields;
