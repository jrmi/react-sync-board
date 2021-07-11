import React from "react";
import useTranslation from "@/hooks/useTranslation";
import { Field } from "react-final-form";

import Label from "../../ui/formUtils/Label";

import ColorPicker from "../ui/ColorPicker";

const Form = ({ initialValues }) => (
  <>
    <Label>
      Label
      <Field
        name="label"
        component="input"
        initialValue={initialValues.label}
      />
    </Label>
    <Label>
      Size
      <Field name="size" component="input" initialValue={initialValues.size}>
        {(props) => <input {...props.input} type="number" />}
      </Field>
    </Label>

    <Label>
      Color
      <Field name="color" component="input" initialValue={initialValues.color}>
        {({ input: { onChange, value } }) => (
          <ColorPicker value={value} onChange={onChange} />
        )}
      </Field>
    </Label>
  </>
);

export default Form;
