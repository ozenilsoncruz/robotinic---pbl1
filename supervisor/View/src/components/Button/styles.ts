import { styled } from "styled-components";

export const StyledButton = styled("button")`
  height: 32px;
  border-radius: 16px;
  border: 2px solid #8338ec;
  font-family: "Roboto";
  font-weight: 800;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    border: none;
    background-color: #8338ec;
    color: #fff;
  }
`;
