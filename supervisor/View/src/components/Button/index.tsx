import { ButtonHTMLAttributes } from "react";
import { StyledButton } from "./styles";

function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <StyledButton {...props} />;
}
export default Button;
