import { CLIENT_CONSTANTS } from "@/utils/constants";
import { CSSProperties, ReactNode } from "react";

export interface TextWithShadowProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4';
}

const TextWithShadow = ({ children, className = '', style, as = 'p' }: TextWithShadowProps) => {
  const Component = as;
  return (
    <Component
      className={className}
      style={{ textShadow: CLIENT_CONSTANTS.TEXT_SHADOW_STYLE, ...style }}
    >
      {children}
    </Component>
  );
}

export default TextWithShadow;