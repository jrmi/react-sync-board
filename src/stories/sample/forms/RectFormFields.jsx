import React from "react";
import useTranslation from "@/hooks/useTranslation";
import { Field } from "react-final-form";

import Label from "../ui/Label";

import ColorPicker from "../ui/ColorPicker";

const Form = ({ initialValues }) => {
  const { t } = useTranslation();
  return (
    <>
      <Label>
        Label
        <Field
          name="text"
          component="input"
          initialValue={initialValues.text}
        />
      </Label>
      <Label>
        Width
        <Field
          name="width"
          component="input"
          initialValue={initialValues.width}
        >
          {(props) => <input {...props.input} type="number" />}
        </Field>
      </Label>
      <Label>
        Height
        <Field
          name="height"
          component="input"
          initialValue={initialValues.height}
        >
          {(props) => <input {...props.input} type="number" />}
        </Field>
      </Label>

      <Label>
        Color
        <Field
          name="color"
          component="input"
          initialValue={initialValues.color}
        >
          {({ input: { onChange, value } }) => (
            <ColorPicker value={value} onChange={onChange} />
          )}
        </Field>
      </Label>
    </>
  );
};

export default Form;
