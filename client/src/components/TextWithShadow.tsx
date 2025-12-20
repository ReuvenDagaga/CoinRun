import { CLIENT_CONSTANTS } from "@/utils/constants";
import { ReactNode } from "react";

interface TextWithShadowProps {
  children: ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4';
}

const TextWithShadow = ({ children, className = '', as = 'p' }: TextWithShadowProps) => {
  const Component = as;
  return (
    <Component className={className} style={{ textShadow: CLIENT_CONSTANTS.TEXT_SHADOW_STYLE }}>
      {children}
    </Component>
  );
}

export default TextWithShadow;