import styled from "@emotion/styled";

const Label = styled.label`
  clear: both;
  padding-bottom: 1.5em;
  &::after {
    content: "";
    display: block;
    clear: both;
  }
`;

export default Label;
