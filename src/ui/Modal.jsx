import React from "react";
import SidePanel from "./SidePanel";

const Modal = ({ setShow, show, ...rest }) => (
  <SidePanel
    open={show}
    onClose={() => setShow(false)}
    position="right"
    modal
    width="33%"
    {...rest}
  />
);

export default Modal;
