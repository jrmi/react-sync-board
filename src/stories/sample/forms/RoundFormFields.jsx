import React from "react";
import { Field } from "react-final-form";

import Label from "../ui/Label";

import ColorPicker from "../ui/ColorPicker";

const Form = ({ initialValues }) => (
  <>
    <Label>
      Label
      <Field name="text" component="input" initialValue={initialValues.text} />
    </Label>
    <Label>
      Radius
      <Field
        name="radius"
        component="input"
        initialValue={initialValues.radius}
      >
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
