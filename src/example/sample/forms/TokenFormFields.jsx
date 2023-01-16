import React from "react";
import { Field } from "react-final-form";

import Label from "../ui/Label";

import ColorPicker from "../ui/ColorPicker";

const Form = ({ initialValues }) => (
  <>
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

    <Label>
      Label
      <Field name="text" component="input" initialValue={initialValues.text} />
    </Label>

    <Label>
      Text Color
      <Field
        name="textColor"
        component="input"
        initialValue={initialValues.textColor}
      >
        {({ input: { onChange, value } }) => (
          <ColorPicker value={value} onChange={onChange} />
        )}
      </Field>
    </Label>

    <Label>
      Font size
      <Field
        name="fontSize"
        component="input"
        initialValue={initialValues.fontSize}
      >
        {(props) => <input {...props.input} type="number" />}
      </Field>
    </Label>
  </>
);

export default Form;
