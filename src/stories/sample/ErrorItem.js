import React from "react";

const ErrorItem = ({ onReload }) => (
  <div
    style={{
      width: "100px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      textAlign: "center",
      color: "red",
    }}
    className="syncboard-error-item"
  >
    Sorry, this item seems broken...
    <button onClick={onReload}>Reload it</button>
  </div>
);

export default ErrorItem;
