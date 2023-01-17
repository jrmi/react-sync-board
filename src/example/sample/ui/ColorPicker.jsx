import React from "react";
import { SketchPicker } from "react-color";

import styled from "@emotion/styled";

const Color = styled.div`
  background-color: ${({ color }) => color};
  border: 1px solid #ffffff22;
  width: 20px;
  height: 20px;
  margin: 5px;
  cursor: pointer;
`;

const ColorPickerWrapper = styled.div`
  position: fixed;
  top: 0px;
  left: 0px;
  background-color: #151515b0;
  right: 0px;
  bottom: 0px;
  z-index: 290;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

const ColorPicker = ({ value, onChange }) => {
  const [showPicker, setShowPicker] = React.useState(false);
  const [currentColor, setCurrentColor] = React.useState(value);

  const showColorPicker = () => {
    setShowPicker((prev) => !prev);
  };

  const handleChange = React.useCallback((newColor) => {
    setCurrentColor(newColor);
  }, []);

  const handleChangeComplete = React.useCallback(
    (newColor) => {
      setCurrentColor(newColor);
      onChange(newColor.hex);
    },
    [onChange]
  );

  const handleClick = React.useCallback(() => {
    setShowPicker(false);
  }, []);

  return (
    <>
      <Color color={value} onClick={showColorPicker} />
      {showPicker && (
        <ColorPickerWrapper>
          <SketchPicker
            color={currentColor}
            onChange={handleChange}
            disableAlpha
            onChangeComplete={handleChangeComplete}
          />
          <button onClick={handleClick}>Close</button>
        </ColorPickerWrapper>
      )}
    </>
  );
};

export default ColorPicker;
